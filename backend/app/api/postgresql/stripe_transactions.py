from fastapi import APIRouter, HTTPException, status, Request, BackgroundTasks
from app.models.postgresql.stripe_transaction import (
    CreateCheckoutSessionRequest,
    CreateFreeUserRequest,
    StripeTransactionResponse,
    CreateSessionResponse,
    WebhookEventData,
    CleanupResponse,
    StripeConfigResponse
)
from app.core.base_service import APIResponse, ServiceError
from app.core.config import settings
from app.services.postgresql.stripe_service import StripeService
import json
import logging

router = APIRouter()
stripe_service = StripeService()
logger = logging.getLogger(__name__)

def handle_service_error(e: ServiceError):
    raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/config", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_stripe_config():
    """Obtener configuración pública de Stripe para el frontend"""
    try:
        config_data = StripeConfigResponse(
            publishable_key=stripe_service.publishable_key
            # ✅ QUITAR: api_version=settings.STRIPE_API_VERSION
        )
        
        return stripe_service.success_response(
            "Configuración de Stripe obtenida exitosamente",
            config_data.dict()
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo configuración de Stripe: {str(e)}")
        raise HTTPException(status_code=500, detail="Error obteniendo configuración")

@router.post("/create-checkout-session", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_checkout_session(request: CreateCheckoutSessionRequest):
    """Crear sesión de Stripe Checkout para usuarios de pago"""
    try:
        session_response = await stripe_service.create_checkout_session(
            request, 
            request.success_url, 
            request.cancel_url
        )
        
        return stripe_service.success_response(
            "Sesión de checkout creada exitosamente",
            session_response.dict()
        )
        
    except ServiceError as e:
        handle_service_error(e)

@router.post("/register-free", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def register_free_user(request: CreateFreeUserRequest):
    """Registrar usuario FREE después de verificación de email"""
    try:
        result = await stripe_service.create_free_user(request)
        
        if result.get('success'):
            return stripe_service.success_response(
                result['message'],
                result.get('data')
            )
        else:
            raise ServiceError(result.get('message', 'Error desconocido'), 400)
            
    except ServiceError as e:
        handle_service_error(e)

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    """Webhook para eventos de Stripe"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        # Verificar firma del webhook usando variable de entorno
        if not stripe_service.verify_webhook_signature(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET):
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Parsear evento
        try:
            event = json.loads(payload.decode('utf-8'))
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON")
        
        logger.info(f"Webhook recibido: {event.get('type', 'unknown')}")
        
        # Manejar evento de checkout completado
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            
            webhook_data = WebhookEventData(
                stripe_session_id=session['id'],
                stripe_payment_intent_id=session.get('payment_intent'),
                stripe_customer_id=session.get('customer'),
                stripe_subscription_id=session.get('subscription'),
                event_type=event['type']
            )
            
            # Procesar en segundo plano
            background_tasks.add_task(process_payment_completion, webhook_data)
            
        return {"status": "success", "message": "Webhook procesado"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Error procesando webhook")

async def process_payment_completion(webhook_data: WebhookEventData):
    """Procesar completación de pago en segundo plano"""
    try:
        logger.info(f"Procesando pago completado: {webhook_data.stripe_session_id}")
        
        result = await stripe_service.complete_stripe_payment(webhook_data)
        
        if result.get('success'):
            logger.info(f"Usuario creado después del pago: {webhook_data.stripe_session_id}")
        else:
            logger.error(f"Error creando usuario después del pago: {result.get('message')}")
            
    except Exception as e:
        logger.error(f"Error procesando pago: {str(e)}")

@router.get("/session/{session_id}", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_session_status(session_id: str):
    """Obtener estado de una sesión de pago"""
    try:
        transaction = await stripe_service.get_transaction(session_id)
        
        return stripe_service.success_response(
            "Estado de transacción obtenido exitosamente",
            transaction.dict()
        )
        
    except ServiceError as e:
        handle_service_error(e)

@router.post("/cleanup-expired", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def cleanup_expired_transactions():
    """Limpiar transacciones expiradas"""
    try:
        cleanup_result = await stripe_service.cleanup_expired_transactions()
        
        return stripe_service.success_response(
            cleanup_result.message,
            {
                "expired_transactions": cleanup_result.expired_transactions,
                "cleanup_date": cleanup_result.cleanup_date
            }
        )
        
    except ServiceError as e:
        handle_service_error(e)