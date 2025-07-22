import asyncpg
import asyncio
from typing import Optional, Any
from contextlib import asynccontextmanager
from pydantic import BaseModel
from app.core.config import settings
from app.core.circuit_breaker import circuit_breaker

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
                min_size=10,               
                max_size=50,                  
                max_queries=100000,            
                max_inactive_connection_lifetime=300.0, 
                command_timeout=30.0,      
                server_settings={
                    'jit': 'off',             
                    'log_statement': 'none',   
                    'plan_cache_mode': 'force_generic_plan', 
                    'default_statistics_target': '100',    
                    'statement_timeout': '30s',     
                    'idle_in_transaction_session_timeout': '10s', 
                    'lock_timeout': '5s',                  
                    'deadlock_timeout': '1s'             
                }
            )
    
    @classmethod
    async def close_pool(cls):
        if cls._pool:
            await cls._pool.close()
            cls._pool = None
    
    @asynccontextmanager
    async def get_connection(self, 
                           transaction: bool = False,        
                           isolation: str = None,            
                           readonly: bool = False):          
        """
        Args:
            transaction: Si True, envuelve automáticamente en transacción
            isolation: Nivel de aislamiento ('read_committed', 'serializable', etc.)
            readonly: Si True, transacción de solo lectura
        """
        if self._pool is None:
            await self.initialize_pool()
        
        # ✅ SOLUCIÓN: Adquirir conexión sin circuit breaker interno
        try:
            async with asyncio.timeout(5.0):
                conn = await self._pool.acquire()  # ✅ Sin "async with"
        except asyncio.TimeoutError:
            raise ServiceError("Database connection timeout - try again", 503)
        except Exception as e:
            raise ServiceError(f"Database connection failed: {str(e)}", 503)
        
        try:
            # Configurar conexión
            await conn.execute("SET statement_timeout = '30s'")
            await conn.execute("SET idle_in_transaction_session_timeout = '10s'") 
            await conn.execute("SET plan_cache_mode = force_generic_plan")
            
            if transaction:
                async with conn.transaction(isolation=isolation, readonly=readonly):
                    yield conn
            else:
                yield conn
                
        except Exception as e:
            raise ServiceError(f"Database error: {str(e)}", 503)
        finally:
            # ✅ IMPORTANTE: Liberar conexión explícitamente
            try:
                await self._pool.release(conn)
            except Exception as e:
                print(f"Error releasing connection: {e}")


    @circuit_breaker(
        name="user_lookup",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def get_user_id_by_email(self, email: str) -> str:
        async with self.get_connection() as conn:
            result = await conn.fetchrow("SELECT * FROM SP_ReadUserByEmail($1)", email)
            if not result:
                raise ServiceError(f"User with email {email} not found", 404)
            return str(result[0])
    
    async def check_database_health(self) -> bool:
        try:
            async with self.get_connection() as conn:
                await conn.fetchval("SELECT 1")
            return True
        except Exception as e:
            print(f"Database health check failed: {str(e)}")
            return False
    
    def success_response(self, message: str, data: Any = None) -> APIResponse:
        return APIResponse(success=True, message=message, data=data)
    
    def error_response(self, message: str, error: str = None) -> APIResponse:
        return APIResponse(success=False, message=message, error=error)