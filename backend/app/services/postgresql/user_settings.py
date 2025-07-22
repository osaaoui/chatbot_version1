from app.core.base_service import BaseService, ServiceError
from app.core.circuit_breaker import circuit_breaker
from app.models.postgresql.user_settings import (
    UserSettingsUpdate, 
    UserSettingsResponse
)

class UserSettingsService(BaseService):

    @circuit_breaker(
        name="user_settings_read",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def get_user_settings(self, user_email: str) -> UserSettingsResponse:
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            async with self.get_connection() as conn:
                rows = await conn.fetch(
                    "SELECT * FROM sp_readusersettings($1)",
                    user_id
                )
                
                if not rows:
                    raise ServiceError(f"User settings for user {user_email} not found", 404)
                
                row = rows[0]
                return UserSettingsResponse(
                    user_id=str(row['user_id']),
                    font_size=row['font_size'],
                    interface_mode=row['interface_mode'],
                    language=row['language']
                )
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to retrieve user settings: {str(e)}")

    @circuit_breaker(
        name="user_settings_update",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def update_user_settings(self, user_email: str, settings: UserSettingsUpdate) -> UserSettingsResponse:
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            async with self.get_connection(transaction=True) as conn:
                await conn.execute(
                    "SELECT sp_updateusersettings($1, $2, $3, $4)",
                    user_id,
                    settings.font_size,
                    settings.interface_mode.value if settings.interface_mode else None,
                    settings.language
                )
                rows = await conn.fetch(
                    "SELECT * FROM sp_readusersettings($1)",
                    user_id
                )
                
                if not rows:
                    raise ServiceError("Failed to retrieve updated settings", 500)
                
                row = rows[0]
                return UserSettingsResponse(
                    user_id=str(row['user_id']),
                    font_size=row['font_size'],
                    interface_mode=row['interface_mode'],
                    language=row['language']
                )
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to update user settings: {str(e)}")