from fastapi import APIRouter, Depends, HTTPException, status
from app.services.postgresql.user_profile_service import UserProfileService
from app.models.postgresql.user_profile import UpdateUserProfileRequest
from app.core.base_service import ServiceError, APIResponse
from app.services.auth_service import get_current_user

router = APIRouter()
service = UserProfileService()

@router.get("/profile", response_model=APIResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    try:
        user_id = await service.get_user_id_by_email(current_user["email"])
        profile = await service.get_user_profile(user_id)
        
        return service.success_response(
            message="Perfil obtenido exitosamente",
            data=profile.dict()
        )
        
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.put("/profile", response_model=APIResponse)
async def update_user_profile(
    update_data: UpdateUserProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = await service.get_user_id_by_email(current_user["email"])
        result = await service.update_user_profile(user_id, update_data, current_user["email"])
        
        response_data = {
            "profile": result["profile"].dict(),
            "token_regenerated": result["token_regenerated"]
        }
        
        if result["new_token"]:
            response_data["new_token"] = result["new_token"]
            response_data["token_type"] = "bearer"
        
        return service.success_response(
            message="Perfil actualizado exitosamente",
            data=response_data
        )
        
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )