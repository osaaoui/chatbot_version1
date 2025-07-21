import asyncpg
from typing import Optional, Any
from contextlib import asynccontextmanager
from pydantic import BaseModel
from app.core.config import settings

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None

class ServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class BaseService:
    _pool = None
    
    @classmethod
    async def initialize_pool(cls):
        if cls._pool is None:
            cls._pool = await asyncpg.create_pool(
                settings.DATABASE_URL,
                min_size=50,
                max_size=200,
                max_queries=100000,
                max_inactive_connection_lifetime=300.0,
                command_timeout=7200,
                server_settings={
                    'jit': 'off',
                    'log_statement': 'none',
                    'plan_cache_mode': 'force_generic_plan',
                    'default_statistics_target': '100'
                }
            )
    
    @classmethod
    async def close_pool(cls):
        if cls._pool:
            await cls._pool.close()
            cls._pool = None
    
    @asynccontextmanager
    async def get_connection(self):
        if self._pool is None:
            await self.initialize_pool()
        
        async with self._pool.acquire() as conn:
            await conn.execute("SET plan_cache_mode = force_generic_plan")
            yield conn
    
    async def get_user_id_by_email(self, email: str) -> str:
        async with self.get_connection() as conn:
            result = await conn.fetchrow("SELECT * FROM SP_ReadUserByEmail($1)", email)
            if not result:
                raise ServiceError(f"User with email {email} not found", 404)
            return str(result[0])
    
    def success_response(self, message: str, data: Any = None) -> APIResponse:
        return APIResponse(success=True, message=message, data=data)
    
    def error_response(self, message: str, error: str = None) -> APIResponse:
        return APIResponse(success=False, message=message, error=error)