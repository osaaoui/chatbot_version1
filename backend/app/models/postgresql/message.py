from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class MessageCreate(BaseModel):
    conversation_id: str
    question: str
    answer: str
    sources: Optional[List[Dict[str, Any]]] = None

class MessageRequest(BaseModel):
    conversation_id: str
    limits: int
    id_last_message: Optional[str] = None
    date_last_message: Optional[str] = None