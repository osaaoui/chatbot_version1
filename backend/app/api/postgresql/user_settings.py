from fastapi import APIRouter, HTTPException, status, Depends
from app.models.postgresql.user_settings import UserSettingsUpdate
from app.core.base_service import APIResponse, ServiceError
from app.services.auth_service import get_current_user
from app.services.postgresql.user_settings import UserSettingsService

router = APIRouter()
user_settings_service = UserSettingsService()

def handle_service_error(e: ServiceError):
    raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_user_settings(
    current_user: dict = Depends(get_current_user)
):
    try:
        user_email = current_user["email"]
        settings = await user_settings_service.get_user_settings(user_email)
        return user_settings_service.success_response(
            "User settings retrieved successfully",
            settings.dict()
        )
    except ServiceError as e:
        handle_service_error(e)


@router.patch("/", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_email = current_user["email"]
        updated_settings = await user_settings_service.update_user_settings(user_email, settings_update)
        return user_settings_service.success_response(
            "User settings updated successfully",
            updated_settings.dict()
        )
    except ServiceError as e:
        handle_service_error(e)