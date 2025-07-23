# app/services/postgresql/country_service.py
from typing import List, Dict, Any
from app.core.base_service import BaseService, ServiceError
from app.core.circuit_breaker import circuit_breaker

class CountryService(BaseService):

    @circuit_breaker(
        name="country_lookup",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def get_all_countries(self) -> List[Dict[str, Any]]:
        try:
            async with self.get_connection() as conn:
                rows = await conn.fetch("SELECT * FROM sp_readallcountry()")
                return [dict(row) for row in rows] if rows else []

        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to retrieve countries: {str(e)}")