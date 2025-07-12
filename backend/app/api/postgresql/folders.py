from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from app.models.postgresql.folder import *
from app.services.postgresql.folder_service import *
from app.core.base_service import APIResponse, ServiceError
from app.services.auth_service import get_current_user

router = APIRouter()
folder_service = FolderService()

def handle_service_error(e: ServiceError):
    """Handle service errors consistently"""
    raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_data: FolderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new folder"""
    try:
        folder_id = await folder_service.create_folder(folder_data, current_user["email"])
        return folder_service.success_response(
            "Folder created successfully", 
            {"folder_id": folder_id}
        )
    except ServiceError as e:
        handle_service_error(e)

@router.get("/{folder_id}", response_model=APIResponse)
async def get_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get folder by ID"""
    try:
        folder = await folder_service.get_folder_by_id(folder_id)
        if not folder:
            raise ServiceError("Folder not found", 404)
        
        return folder_service.success_response("Folder retrieved successfully", folder)
    except ServiceError as e:
        handle_service_error(e)

@router.get("", response_model=APIResponse)
async def get_user_folders(current_user: dict = Depends(get_current_user)):
    """Get all folders for the authenticated user"""
    try:
        folders = await folder_service.get_folders_by_user(current_user["email"])
        return folder_service.success_response(
            f"Retrieved {len(folders)} folders", 
            folders
        )
    except ServiceError as e:
        handle_service_error(e)

@router.put("/{folder_id}", response_model=APIResponse)
async def update_folder(
    folder_id: str,
    folder_name: Optional[str] = Query(None),
    parent_folder_id: Optional[str] = Query(None),
    change_parent: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    try:
        if parent_folder_id == "":
            parent_folder_id = None
            
        await folder_service.update_folder(
            folder_id, 
            current_user["email"], 
            folder_name, 
            parent_folder_id,
            change_parent
        )
        return folder_service.success_response("Folder updated successfully")
    except ServiceError as e:
        handle_service_error(e)

@router.delete("/{folder_id}", response_model=APIResponse)
async def delete_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete folder (soft delete)"""
    try:
        await folder_service.delete_folder(folder_id, current_user["email"])
        return folder_service.success_response("Folder deleted successfully")
    except ServiceError as e:
        handle_service_error(e)

@router.get("/document-bases/user", response_model=APIResponse)
async def get_user_document_bases(current_user: dict = Depends(get_current_user)):
    """Get all document bases for the authenticated user"""
    try:
        document_bases = await folder_service.get_document_bases_by_user(current_user["email"])
        return folder_service.success_response(
            f"Retrieved {len(document_bases)} document bases", 
            document_bases
        )
    except ServiceError as e:
        handle_service_error(e)

@router.post("/document-bases/user", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_document_base(
    documentbase_data: DocumentBaseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new document base"""
    try:
        document_base_id = await folder_service.create_document_base(
            documentbase_data, 
            current_user["email"]
        )
        return folder_service.success_response(
            "Document base created successfully", 
            {"document_base_id": document_base_id}
        )
    except ServiceError as e:
        handle_service_error(e)

@router.put("/document-bases/user/{document_base_id}", response_model=APIResponse)
async def update_document_base(
    document_base_id: str,
    update_data: DocumentBaseUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update document base"""
    try:
        await folder_service.update_document_base(
            document_base_id, 
            update_data, 
            current_user["email"]
        )
        return folder_service.success_response("Document base updated successfully")
    except ServiceError as e:
        handle_service_error(e)

@router.delete("/document-bases/user/{document_base_id}", response_model=APIResponse)
async def delete_document_base(
    document_base_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        await folder_service.delete_document_base(document_base_id, current_user["email"])
        return folder_service.success_response("Document base deleted successfully")
    except ServiceError as e:
        handle_service_error(e)