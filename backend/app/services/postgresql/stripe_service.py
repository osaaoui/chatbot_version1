import stripe
import json
import bcrypt
from decimal import Decimal
from datetime import datetime
from typing import Optional, Dict, Any
from app.core.base_service import BaseService, ServiceError
from app.core.circuit_breaker import circuit_breaker
from app.core.config import settings
from app.models.postgresql.stripe_transaction import (
    CreateCheckoutSessionRequest,
    CreateFreeUserRequest, 
    StripeTransactionResponse,
    CreateSessionResponse,
    WebhookEventData,
    CleanupResponse,
    TransactionStatus
)

class StripeService(BaseService):
    
    def __init__(self):
        super().__init__()
        stripe.api_key = settings.STRIPE_KEY
        self.publishable_key = settings.STRIPE_PUBLISHABLE_KEY
    
    def _hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    @circuit_breaker(
        name="stripe_create_session",
        failure_threshold=3,
        recovery_timeout=30.0,
        timeout=15.0
    )
    async def create_checkout_session(
        self, 
        request: CreateCheckoutSessionRequest,
        success_url: str = None,
        cancel_url: str = None
    ) -> CreateSessionResponse:
        """Crear sesión de Stripe Checkout para usuarios de pago"""
        try:
            # 1. Obtener información del paquete
            package_info = await self._get_package_info(request.package_type_id)
            
            # 2. Validar que no sea paquete FREE
            if package_info['monthly_price'] == 0:
                raise ServiceError("Use el endpoint /register-free para paquetes gratuitos", 400)
            
            # 3. Hash de la password
            hashed_password = self._hash_password(request.user_data.password)
            
            # 4. Crear sesión en Stripe
            stripe_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                mode='subscription',
                success_url=success_url or f"http://localhost:3000/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=cancel_url or "http://localhost:3000/cancel",
                customer_email=request.user_data.email,
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': package_info.get('plan_name', 'TiaBot Plan'),
                            'description': package_info.get('description', 'TiaBot subscription plan'),
                        },
                        'unit_amount': int(package_info['monthly_price'] * 100),  # Stripe usa centavos
                        'recurring': {'interval': 'month'},
                    },
                    'quantity': 1,
                }],
                metadata={
                    'package_type_id': request.package_type_id,
                    'user_email': request.user_data.email,
                    'company_name': request.company_data.company_name
                }
            )
            
            # 5. Preparar datos para guardar en BD
            session_data = {
                "stripe_session_id": stripe_session.id,
                "user_email": request.user_data.email,
                "package_type_id": request.package_type_id,
                "amount": str(package_info['monthly_price']),
                "currency": "USD",
                "company_data": request.company_data.dict(),
                "user_data": {
                    "full_name": request.user_data.full_name,
                    "email": request.user_data.email,
                    "password_hash": hashed_password
                }
            }
            
            # 6. Guardar en base de datos
            transaction_id = await self._create_stripe_session_db(session_data)
            
            return CreateSessionResponse(
                success=True,
                checkout_url=stripe_session.url,
                session_id=stripe_session.id,
                transaction_id=str(transaction_id),
                expires_in_hours=24
            )
                
        except stripe.error.StripeError as e:
            raise ServiceError(f"Error de Stripe: {str(e)}", 400)
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Error al crear sesión de checkout: {str(e)}", 500)

    @circuit_breaker(
        name="stripe_create_free_user",
        failure_threshold=3,
        recovery_timeout=30.0,
        timeout=10.0
    )
    async def create_free_user(self, request: CreateFreeUserRequest) -> Dict[str, Any]:
        """Crear usuario FREE después de verificación de email"""
        try:
            # Hash de la password
            hashed_password = self._hash_password(request.password)
            
            async with self.get_connection() as conn:
                result = await conn.fetchval(
                    "SELECT sp_create_free_user_after_verification($1, $2, $3, $4, $5)",
                    request.email,
                    request.verification_code,
                    request.full_name,
                    hashed_password,
                    request.country_id
                )
                
                if not result:
                    raise ServiceError("No se recibió respuesta del procedimiento", 500)
                
                return json.loads(result) if isinstance(result, str) else result
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Error al crear usuario FREE: {str(e)}", 500)

    @circuit_breaker(
        name="stripe_complete_payment",
        failure_threshold=2,
        recovery_timeout=60.0,
        timeout=20.0
    )
    async def complete_stripe_payment(self, webhook_data: WebhookEventData) -> Dict[str, Any]:
        """Completar pago después de webhook de Stripe"""
        try:
            async with self.get_connection() as conn:
                result = await conn.fetchval(
                    "SELECT sp_complete_stripe_payment($1, $2, $3, $4)",
                    webhook_data.stripe_session_id,
                    webhook_data.stripe_payment_intent_id,
                    webhook_data.stripe_customer_id,
                    webhook_data.stripe_subscription_id
                )
                
                if not result:
                    raise ServiceError("No se recibió respuesta del procedimiento", 500)
                
                return json.loads(result) if isinstance(result, str) else result
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Error al completar pago: {str(e)}", 500)

    @circuit_breaker(
        name="stripe_get_transaction",
        failure_threshold=5,
        recovery_timeout=20.0,
        timeout=10.0
    )
    async def get_transaction(self, session_id: str) -> StripeTransactionResponse:
        """Obtener información de una transacción"""
        try:
            async with self.get_connection() as conn:
                result = await conn.fetchval(
                    "SELECT sp_get_stripe_transaction($1)",
                    session_id
                )
                
                if not result:
                    raise ServiceError("Transacción no encontrada", 404)
                
                data = json.loads(result) if isinstance(result, str) else result
                
                if not data.get('success'):
                    raise ServiceError(data.get('message', 'Error desconocido'), 404)
                
                transaction_data = data['data']
                
                return StripeTransactionResponse(
                    transaction_id=transaction_data['transaction_id'],
                    stripe_session_id=transaction_data['stripe_session_id'],
                    stripe_payment_intent_id=transaction_data.get('stripe_payment_intent_id'),
                    stripe_customer_id=transaction_data.get('stripe_customer_id'),
                    stripe_subscription_id=transaction_data.get('stripe_subscription_id'),
                    user_email=transaction_data['user_email'],
                    package_type_id=transaction_data['package_type_id'],
                    amount=Decimal(str(transaction_data['amount'])),
                    currency=transaction_data['currency'],
                    status=TransactionStatus(transaction_data['status']),
                    company_data=transaction_data.get('company_data'),
                    user_data=transaction_data.get('user_data'),
                    webhook_events=transaction_data.get('webhook_events'),
                    created_date=transaction_data['created_date'],
                    completed_date=transaction_data.get('completed_date'),
                    expires_at=transaction_data['expires_at'],
                    is_expired=transaction_data['is_expired']
                )
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Error al obtener transacción: {str(e)}", 500)

    @circuit_breaker(
        name="stripe_cleanup_expired",
        failure_threshold=2,
        recovery_timeout=120.0,
        timeout=30.0
    )
    async def cleanup_expired_transactions(self) -> CleanupResponse:
        """Limpiar transacciones expiradas"""
        try:
            async with self.get_connection() as conn:
                result = await conn.fetchval("SELECT sp_cleanup_expired_transactions()")
                
                if not result:
                    raise ServiceError("No se recibió respuesta del procedimiento de limpieza", 500)
                
                data = json.loads(result) if isinstance(result, str) else result
                
                return CleanupResponse(
                    success=data['success'],
                    message=data['message'],
                    expired_transactions=data['expired_transactions'],
                    cleanup_date=data['cleanup_date']
                )
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Error en limpieza de transacciones: {str(e)}", 500)

    # Métodos auxiliares privados
    async def _get_package_info(self, package_type_id: str) -> Dict[str, Any]:
        """Obtener información del paquete"""
        async with self.get_connection() as conn:
            row = await conn.fetchrow(
                "SELECT monthly_price, additional_features FROM availablepackages WHERE package_type_id = $1",
                package_type_id
            )
            
            if not row:
                raise ServiceError(f"Paquete {package_type_id} no encontrado", 404)
            
            # ✅ CORRECCIÓN: Parsear JSON string a diccionario
            additional_features_raw = row['additional_features']
            
            # Si es string, parsearlo a diccionario
            if isinstance(additional_features_raw, str):
                try:
                    additional_features = json.loads(additional_features_raw)
                except json.JSONDecodeError:
                    additional_features = {}
            elif isinstance(additional_features_raw, dict):
                additional_features = additional_features_raw
            else:
                additional_features = {}
            
            return {
                'monthly_price': float(row['monthly_price']),
                'plan_name': additional_features.get('plan_name', 'Plan TiaBot'),
                'description': additional_features.get('description', 'Suscripción a TiaBot'),
                **additional_features
            }

    async def _create_stripe_session_db(self, session_data: Dict[str, Any]) -> str:
        """Crear sesión en base de datos"""
        async with self.get_connection() as conn:
            transaction_id = await conn.fetchval(
                "SELECT sp_create_stripe_session($1)",
                json.dumps(session_data)
            )
            
            if not transaction_id:
                raise ServiceError("Error al crear sesión en base de datos", 500)
                
            return str(transaction_id)

    def verify_webhook_signature(self, payload: bytes, sig_header: str, webhook_secret: str) -> bool:
        """Verificar firma del webhook de Stripe"""
        try:
            stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            return True
        except stripe.error.SignatureVerificationError:
            return False
        except Exception:
            return False