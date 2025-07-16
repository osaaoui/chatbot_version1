from app.core.base_service import BaseService, ServiceError
from app.models.postgresql.conversation import ConversationCreate
from typing import List, Optional, Dict, Any

class ConversationService(BaseService):
    async def create_conversation(self, conversation_create: ConversationCreate, user_email: str) -> str:

        try:
            user_id = await self.get_user_id_by_email(user_email)
            async with self.get_connection() as conn:
                id_conversation = await conn.fetch(
                    "SELECT * FROM sp_createconversation($1, $2)",
                    user_id, conversation_create.name_conversation
                )

                return str(id_conversation)
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to create conversation: {str(e)}")
        

    async def get_conversation_by_id(self, user_email: str, limits: Optional[int] = None) -> List[Dict[str, Any]]:
        try:
            user_id = await self.get_user_id_by_email(user_email)
            async with self.get_connection() as conn:
                if limits is not None:
                    query = "SELECT * FROM sp_readconversationsbyuser($1, $2)"
                    params = (user_id, limits)
                else:
                    query = "SELECT * FROM sp_readconversationsbyuser($1)"
                    params = (user_id,)

                conversation = await conn.fetch(query, *params)

                return [dict(row) for row in conversation] if conversation else []

        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to get conversation: {str(e)}")