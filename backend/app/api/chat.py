# app/api/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.qa_service_pg import get_answer
from app.services.postgresql.message_service import MessageService
from app.models.postgresql.message import  MessageCreate, MessageRequest
router = APIRouter()
message_service = MessageService()

class ChatRequest(BaseModel):
    question: str
    conversation_id: str
    user_id: str = "default"

class SourceDocument(BaseModel):
    snippet: str
    metadata: dict

class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: list[SourceDocument]
    user_id: str

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        answer, sources = get_answer(req.question, req.user_id)
        message_data = MessageCreate(
            conversation_id=req.conversation_id,
            question=req.question,
            answer=answer,
            sources=sources
        )
        message_id = await message_service.create_message(message_data, req.user_id)
        
        print(f"Message created with ID: {message_id}")
        return {
            "question": req.question,
            "answer": answer,
            "sources": sources, 
            "user_id": req.user_id,
        }
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error") from e



