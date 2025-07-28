from fastapi import APIRouter, HTTPException, status
from app.models.postgresql.emailverification import EmailVerificationRequest, EmailVerificationValidate
from app.services.postgresql.emailverification_service import EmailVerificationService
from app.core.base_service import APIResponse, ServiceError

router = APIRouter()
email_verification_service = EmailVerificationService()

def handle_service_error(e: ServiceError):
    raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/request", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def request_email_verification(
    email_data: EmailVerificationRequest
):
    """
    Request email verification - checks if email doesn't exist and sends verification code
    """
    try:
        result = await email_verification_service.request_email_verification(email_data)
        return email_verification_service.success_response(
            "Verification code sent successfully",
            result
        )
    except ServiceError as e:
        handle_service_error(e)


@router.post("/resend", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def resend_verification_code(
    email_data: EmailVerificationRequest
):
    """
    Resend email verification code - checks if email doesn't exist and resends verification code
    """
    try:
        result = await email_verification_service.resend_verification_code(email_data)
        return email_verification_service.success_response(
            "Verification code resent successfully",
            result
        )
    except ServiceError as e:
        handle_service_error(e)


@router.post("/validate", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def validate_verification_code(
    validation_data: EmailVerificationValidate
):
    """
    Validate the verification code for the given email
    """
    try:
        result = await email_verification_service.validate_verification_code(
            validation_data.email, 
            validation_data.verification_code
        )
        
        if result.get("success"):
            return email_verification_service.success_response(
                result.get("message", "Code validated successfully"),
                {"verification_id": result.get("verification_id")}
            )
        else:
            raise ServiceError(
                result.get("message", "Invalid verification code"),
                status_code=400
            )
            
    except ServiceError as e:
        handle_service_error(e)