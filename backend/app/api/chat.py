# app/api/chat.py
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.qa_service import get_answer

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    user_id: str = "default"

class SourceDocument(BaseModel):
    content: str
    metadata: dict

class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: list[SourceDocument]
    user_id: str

@router.post("/", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    answer, sources = get_answer(req.question, req.user_id)
    return {
        "question": req.question,
        "answer": answer,
        "sources": sources,
        "user_id": req.user_id,
    }
