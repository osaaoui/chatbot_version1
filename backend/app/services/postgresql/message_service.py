import json
from typing import  Dict, Any, List
from app.core.base_service import BaseService, ServiceError
from app.models.postgresql.message import  MessageCreate, MessageRequest

class MessageService(BaseService):

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

    async def get_messages_by_conversation(self, user_email: str, message: MessageRequest) -> List[Dict[str, Any]]:
        try:
            await self.get_user_id_by_email(user_email)

            async with self.get_connection() as conn:
                rows = await conn.fetch(
                    "SELECT * FROM sp_readmessagesbyconversation($1, $2, $3, $4)",
                    message.conversation_id,
                    message.limits,
                    message.id_last_message,
                    message.date_last_message
                )
                return [dict(row) for row in rows] if rows else []

        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to retrieve messages: {str(e)}")
