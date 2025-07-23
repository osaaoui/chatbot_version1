from typing import Dict, Any
from app.core.base_service import BaseService, ServiceError
from app.models.postgresql.user_profile import UserProfile, UpdateUserProfileRequest
from app.services.user_store import update_user_in_sqlite
from app.services.auth_service import create_access_token
from app.core.circuit_breaker import circuit_breaker
class UserProfileService(BaseService):

    @circuit_breaker(
        name="user_lookup",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def get_user_profile(self, user_id: str) -> UserProfile:
        try:
            async with self.get_connection() as conn:
                user_query = """
                    SELECT 
                        u.user_id,
                        u.full_name,
                        u.email,
                        u.status,
                        u.is_active,
                        u.creation_date,
                        u.last_modification_date,
                        u.global_role_id,
                        r.role_name
                    FROM public.sp_readuserbyid($1) u
                    INNER JOIN roles r ON u.global_role_id = r.role_id
                """
                
                result = await conn.fetchrow(user_query, user_id)
                
                if not result:
                    raise ServiceError(f"Usuario con ID {user_id} no encontrado", 404)
                
                return UserProfile(
                    user_id=str(result['user_id']),
                    full_name=result['full_name'],
                    email=result['email'],
                    status=result['status'],
                    role=result['role_name'],
                    is_active=result['is_active'],
                    created_date=result['creation_date'],
                    last_modification_date=result['last_modification_date']
                )
                
        except Exception as e:
            if isinstance(e, ServiceError):
                raise e
            raise ServiceError(f"Error al obtener el perfil del usuario: {str(e)}", 500)


    @circuit_breaker(
        name="user_lookup",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def update_user_profile(self, user_id: str, update_data: UpdateUserProfileRequest, current_email: str) -> Dict[str, Any]:
        try:
            async with self.get_connection() as conn:
                existing_user = await conn.fetchrow(
                    "SELECT user_id, full_name FROM public.sp_readuserbyid($1) LIMIT 1",
                    user_id
                )
                
                if not existing_user:
                    raise ServiceError(f"Usuario con ID {user_id} no encontrado", 404)
                
                name_changed = False
                new_token = None
                
                if update_data.full_name and update_data.full_name != existing_user['full_name']:
                    name_changed = True
                
                await conn.execute(
                    "SELECT public.sp_updateuser($1, $2, $3, $4, $5, $6, $7, $8)",
                    user_id,                   
                    user_id,                   
                    update_data.full_name,
                    None,
                    None,                       
                    None,                      
                    None,                      
                    None                        
                )
                
                updated_profile = await self.get_user_profile(user_id)
                
                # Si el nombre cambió, actualizamos en SQLite y regeneramos el token
                if name_changed:
                    await update_user_in_sqlite(current_email, current_email, updated_profile.full_name, updated_profile.role)
                    
                    new_token = create_access_token({
                        "sub": current_email,
                        "role": updated_profile.role,
                        "fullName": updated_profile.full_name
                    })
                
                return {
                    "profile": updated_profile,
                    "new_token": new_token,
                    "token_regenerated": name_changed
                }
                
        except Exception as e:
            if isinstance(e, ServiceError):
                raise e
            raise ServiceError(f"Error al actualizar el perfil del usuario: {str(e)}", 500)