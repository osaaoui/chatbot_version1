from pydantic import BaseModel, Field

class ConversationCreate(BaseModel):
    name_conversation: str = Field(..., max_length=255)

