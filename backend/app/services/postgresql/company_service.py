from app.core.base_service import BaseService, ServiceError
from typing import List, Dict, Any
from app.core.circuit_breaker import circuit_breaker

class CompanyService(BaseService):

    @circuit_breaker(
        name="user_lookup",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def get_company(self, user_email: str) -> List[Dict[str, Any]]:
        try:
            user_id = await self.get_user_id_by_email(user_email)
            async with self.get_connection() as conn:
                id_company = await conn.fetch(
                    "SELECT * FROM sp_readcompanybyuserid($1)",
                    user_id
                )
                return [dict(row) for row in id_company] if id_company else []
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to get company: {str(e)}")
        