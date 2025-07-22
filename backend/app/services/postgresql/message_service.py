import json
from datetime import datetime
from typing import  Dict, Any, List
from app.core.base_service import BaseService, ServiceError
from app.core.circuit_breaker import circuit_breaker
from app.models.postgresql.message import  MessageCreate, MessageRequest

class MessageService(BaseService):


    @circuit_breaker(
        name="user_lookup",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def create_message(self, message: MessageCreate, user_email: str) -> str:
        try:
            user_id = await self.get_user_id_by_email(user_email)
            sources_json = None
            if message.sources is not None:
                sources_json = json.dumps(message.sources)
            async with self.get_connection() as conn:
                id_message = await conn.fetch(
                    "SELECT * FROM sp_createmessage($1, $2, $3, $4, $5)",
                     message.conversation_id, message.question, user_id, message.answer, sources_json
                )

                return str(id_message)

        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to create message: {str(e)}")


    @circuit_breaker(
        name="user_lookup",
        failure_threshold=3,     
        recovery_timeout=30.0,   
        timeout=10.0            
    )
    async def get_messages_by_conversation(self, user_email: str, message: MessageRequest) -> List[Dict[str, Any]]:
        try:
            await self.get_user_id_by_email(user_email)

            cursor_date = None
            if message.date_last_message:
                if isinstance(message.date_last_message, str):
                    cursor_date = datetime.fromisoformat(message.date_last_message.replace('Z', '+00:00'))
                else:
                    cursor_date = message.date_last_message

            async with self.get_connection() as conn:
                rows = await conn.fetch(
                    "SELECT * FROM sp_readmessagesbyconversation($1, $2, $3, $4)",
                    message.conversation_id,
                    message.limits,
                    message.id_last_message,
                    cursor_date  # Usar el datetime convertido
                )
                return [dict(row) for row in rows] if rows else []

        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to retrieve messages: {str(e)}")
