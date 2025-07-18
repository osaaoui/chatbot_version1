from app.core.base_service import BaseService, ServiceError
from typing import List, Dict, Any

class CompanyService(BaseService):
    async def get_company(self, user_email: str) -> List[Dict[str, Any]]:
        try:
            user_id = await self.get_user_id_by_email(user_email)
            async with self.get_connection() as conn:
                id_company = await conn.fetch(
                    "SELECT * FROM sp_getcompany($1)",
                    user_id
                )
                return [dict(row) for row in id_company] if id_company else []
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to get company: {str(e)}")
        