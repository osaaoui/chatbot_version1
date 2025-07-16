from fastapi import APIRouter, HTTPException, status, Depends
from app.models.postgresql.message import MessageCreate, MessageRequest
from app.core.base_service import APIResponse, ServiceError
from app.services.auth_service import get_current_user
from app.services.postgresql.message_service import MessageService

router = APIRouter()
message_service = MessageService()

def handle_service_error(e: ServiceError):
    raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_data: MessageCreate,
      current_user: dict = Depends(get_current_user)
):
    try:
        user_email = current_user["email"]
        message_id = await message_service.create_message(message_data, user_email)
        return message_service.success_response(
            "Message created successfully",
            {"message_id": message_id}
        )
    except ServiceError as e:
        handle_service_error(e)

@router.get("/conversation", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_messages_by_conversation(
    message_data: MessageRequest = Depends(),
    current_user: dict = Depends(get_current_user)
):
    try:
        user_email = current_user["email"]
        messages = await message_service.get_messages_by_conversation(user_email, message_data)

        return message_service.success_response(
            f"messages from conversation {message_data.conversation_id}",
            {"messages": messages}
        )

    except ServiceError as e:
        handle_service_error(e)

