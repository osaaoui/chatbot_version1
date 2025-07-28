import json
from app.core.base_service import BaseService, ServiceError
from app.models.postgresql.emailverification import EmailVerificationRequest
from app.services.email_service import EmailService
from typing import Dict, Any
from app.core.circuit_breaker import circuit_breaker
import secrets
import string
from datetime import datetime, timedelta

class EmailVerificationService(BaseService):
    
    def __init__(self):
        self.email_service = EmailService()
    
    def _generate_verification_code(self) -> str:
        """Generate a 6-digit verification code"""
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    @circuit_breaker(
        name="email_verification",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def request_email_verification(self, email_verification: EmailVerificationRequest) -> Dict[str, Any]:
        """
        Verify that email does NOT exist in database and generate verification code
        """
        try:
            # 1. Check if email already exists using existing stored procedure
            async with self.get_connection() as conn:
                existing_user = await conn.fetch(
                    "SELECT * FROM sp_readuserbyemail($1)",
                    email_verification.email
                )
                
                # If user exists, return error
                if existing_user:
                    raise ServiceError("Email already registered", status_code=409)
                
                # 2. Generate 6-digit verification code
                verification_code = self._generate_verification_code()
                
                # 3. Set expiration time (15 minutes from now)
                expires_at = datetime.utcnow() + timedelta(minutes=15)
                
                # 4. Save verification code to database
                verification_id = await conn.fetchval(
                    "SELECT * FROM sp_createemailverificationcode($1, $2, $3, $4)",
                    email_verification.email,
                    verification_code,
                    expires_at,
                    None  # created_by_user_id is None for new user registration
                )
                
                # 5. Send email with verification code
                try:
                    await self.email_service.send_verification_code(
                        to_email=email_verification.email,
                        verification_code=verification_code,
                        expires_minutes=15,
                        is_resend=False
                    )
                except ServiceError as e:
                    # Si falla el envío, eliminar el código de la BD
                    await conn.execute(
                        "UPDATE email_verification_codes SET status = 'Failed' WHERE verification_id = $1",
                        verification_id
                    )
                    raise ServiceError(f"Failed to send verification email: {e.message}", e.status_code)
                
                return {
                    "verification_id": str(verification_id),
                    "message": "Verification code sent successfully",
                    "expires_at": expires_at.isoformat()
                }
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to process email verification: {str(e)}")
    

    @circuit_breaker(
        name="email_verification_resend",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def resend_verification_code(self, email_verification: EmailVerificationRequest) -> Dict[str, Any]:
        """
        Reenviar código de verificación - verifica que email NO exista y reenvía código
        """
        try:
            async with self.get_connection() as conn:
                # 1. Verificar que el email NO existe en usuarios
                existing_user = await conn.fetch(
                    "SELECT * FROM sp_readuserbyemail($1)",
                    email_verification.email
                )
                
                if existing_user:
                    raise ServiceError("Email already registered", status_code=409)
                
                # 2. Verificar si hay un código activo reciente (menos de 2 minutos)
                recent_code = await conn.fetchrow(
                    """
                    SELECT verification_id, creation_date 
                    FROM email_verification_codes 
                    WHERE email = $1 
                        AND status = 'Active' 
                        AND creation_date > CURRENT_TIMESTAMP - INTERVAL '2 minutes'
                    ORDER BY creation_date DESC 
                    LIMIT 1
                    """,
                    email_verification.email
                )
                
                if recent_code:
                    raise ServiceError(
                        "Please wait 2 minutes before requesting a new code", 
                        status_code=429
                    )
                
                # 3. Verificar límite de reenvíos por hora (máximo 5)
                hourly_count = await conn.fetchval(
                    """
                    SELECT COUNT(*) 
                    FROM email_verification_codes 
                    WHERE email = $1 
                        AND creation_date > CURRENT_TIMESTAMP - INTERVAL '1 hour'
                    """,
                    email_verification.email
                )
                
                if hourly_count >= 5:
                    raise ServiceError(
                        "Maximum verification attempts per hour exceeded. Please try again later", 
                        status_code=429
                    )
                
                # 4. Generar nuevo código
                verification_code = self._generate_verification_code()
                expires_at = datetime.utcnow() + timedelta(minutes=15)
                
                # 5. Guardar nuevo código (esto invalida automáticamente los anteriores)
                verification_id = await conn.fetchval(
                    "SELECT * FROM sp_createemailverificationcode($1, $2, $3, $4)",
                    email_verification.email,
                    verification_code,
                    expires_at,
                    None
                )
                
                # 6. Enviar email
                try:
                    await self.email_service.send_verification_code(
                        to_email=email_verification.email,
                        verification_code=verification_code,
                        expires_minutes=15,
                        is_resend=True
                    )
                except ServiceError as e:
                    # Si falla el envío, marcar como fallido
                    await conn.execute(
                        "UPDATE email_verification_codes SET status = 'Failed' WHERE verification_id = $1",
                        verification_id
                    )
                    raise ServiceError(f"Failed to resend verification email: {e.message}", e.status_code)
                
                return {
                    "verification_id": str(verification_id),
                    "message": "Verification code resent successfully",
                    "expires_at": expires_at.isoformat(),
                    "resend_available_after": (datetime.utcnow() + timedelta(minutes=2)).isoformat()
                }
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to resend email verification: {str(e)}")

    @circuit_breaker(
        name="email_verification_validate",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def validate_verification_code(self, email: str, verification_code: str) -> Dict[str, Any]:
        """
        Validate the verification code for given email
        """
        try:
            async with self.get_connection() as conn:
                # NO incrementar attempts_count aquí, el stored procedure ya lo maneja
                
                # Validate using stored procedure - devuelve JSON como string
                result_json = await conn.fetchval(
                    "SELECT sp_validateemailverificationcode($1, $2)",
                    email, verification_code
                )
                
                # Parse JSON string to dictionary
                result = json.loads(result_json)
                
                return result
                
        except ServiceError:
            raise
        except json.JSONDecodeError as e:
            raise ServiceError(f"Failed to parse database response: {str(e)}")
        except Exception as e:
            raise ServiceError(f"Failed to validate verification code: {str(e)}")