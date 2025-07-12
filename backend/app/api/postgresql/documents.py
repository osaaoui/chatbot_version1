from fastapi import APIRouter, HTTPException, Depends, status
from app.models.postgresql.document import DocumentCreate
from app.services.postgresql.document_service import DocumentService
from app.core.base_service import APIResponse, ServiceError
from app.services.auth_service import get_current_user

router = APIRouter()
document_service = DocumentService()

def handle_service_error(e: ServiceError):
    """Handle service errors consistently"""
    raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    document_data: DocumentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new document"""
    try:
        document_id = await document_service.create_document(document_data, current_user["email"])
        return document_service.success_response(
            "Document created successfully", 
            {"document_id": document_id}
        )
    except ServiceError as e:
        handle_service_error(e)

@router.get("/{document_id}", response_model=APIResponse)
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get document by ID"""
    try:
        document = await document_service.get_document_by_id(document_id)
        if not document:
            raise ServiceError("Document not found", 404)
        
        return document_service.success_response("Document retrieved successfully", document)
    except ServiceError as e:
        handle_service_error(e)

@router.put("/{document_id}", response_model=APIResponse)
async def update_document(
    document_id: str,
    document_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Update document name"""
    try:
        await document_service.update_document(document_id, document_name, current_user["email"])
        return document_service.success_response("Document updated successfully")
    except ServiceError as e:
        handle_service_error(e)

@router.delete("/{document_id}", response_model=APIResponse)
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete document (soft delete)"""
    try:
        await document_service.delete_document(document_id, current_user["email"])
        return document_service.success_response("Document deleted successfully")
    except ServiceError as e:
        handle_service_error(e)