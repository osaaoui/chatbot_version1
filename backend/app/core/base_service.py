import asyncpg
import os
from typing import Optional, Any, Dict
from contextlib import asynccontextmanager
from pydantic import BaseModel
from app.core.config import settings

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None

class ServiceError(Exception):
    """Custom service exception"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class BaseService:
    def __init__(self):
        self.db_url = settings.DATABASE_URL
    
    @asynccontextmanager
    async def get_connection(self):
        """Context manager for database connections"""
        conn = await asyncpg.connect(self.db_url)
        try:
            yield conn
        finally:
            await conn.close()
    
    async def get_user_id_by_email(self, email: str) -> str:
        """Get user ID from email - cached method to avoid repetition"""
        async with self.get_connection() as conn:
            result = await conn.fetchrow("SELECT * FROM SP_ReadUserByEmail($1)", email)
            if not result:
                raise ServiceError(f"User with email {email} not found", 404)
            return str(result[0])
    
    def success_response(self, message: str, data: Any = None) -> APIResponse:
        """Standard success response"""
        return APIResponse(success=True, message=message, data=data)
    
    def error_response(self, message: str, error: str = None) -> APIResponse:
        """Standard error response"""
        return APIResponse(success=False, message=message, error=error)