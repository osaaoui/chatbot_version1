from fastapi import APIRouter, HTTPException, status, Depends
from app.models.postgresql.conversation import ConversationCreate
from app.services.postgresql.conversation_service import ConversationService
from app.core.base_service import APIResponse, ServiceError
from app.services.auth_service import get_current_user

router = APIRouter()
conversation_service = ConversationService()

def handle_service_error(e: ServiceError):
    raise HTTPException(status_code=e.status_code, detail=e.message)



@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_email = current_user["email"]
        conversation_id = await conversation_service.create_conversation(conversation_data, user_email)
        return conversation_service.success_response(
            "Conversation created successfully",
            {"conversation_id": conversation_id}
        )
    except ServiceError as e:
        handle_service_error(e)


@router.get("/", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_conversations(
    limits: int = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_email = current_user["email"]
        conversations = await conversation_service.get_conversation_by_id(user_email, limits)
        total_count = len(conversations)
        
        return conversation_service.success_response(
            f"Retrieved {total_count} conversations",
            {"conversations": conversations, "total_count": total_count}
        )
        
    except ServiceError as e:
        handle_service_error(e)
