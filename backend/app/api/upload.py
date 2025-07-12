
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Form, Depends
from fastapi.responses import JSONResponse
from typing import Optional
from uuid import UUID

# Importaciones para el servicio de documentos
from app.models.postgresql.document import DocumentCreate
from app.services.postgresql.document_service import DocumentService
from app.core.base_service import ServiceError
from app.services.auth_service import get_current_user

router = APIRouter()
document_service = DocumentService()
UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def handle_service_error(e: ServiceError):
    """Handle service errors consistently"""
    raise HTTPException(status_code=e.status_code, detail=e.message)
@router.get("/files")

def list_user_files(user_id: str = Query(...)):
    user_files = []
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(user_id + "__"):
            user_files.append(filename.split("__", 1)[1]) 
    return {"files": user_files}


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    document_base_id: UUID = Form(...),
    folder_id: Optional[UUID] = Form(None),
    num_pages: Optional[int] = Form(None),
    current_user: dict = Depends(get_current_user)
):

    allowed_types = ["application/pdf", "image/jpeg", "image/png", "text/plain", "application/msword", 
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    try:
        content = await file.read()
        file_size_mb = len(content) / (1024 * 1024) 
        
        file_type = file.content_type.split('/')[-1]
        if file_type == "vnd.openxmlformats-officedocument.wordprocessingml.document":
            file_type = "docx"
        elif file_type == "msword":
            file_type = "doc"
        storage_url = f"local://{UPLOAD_DIR}/{file.filename}"
        
        document_data = DocumentCreate(
            document_name=file.filename,
            document_base_id=document_base_id,
            storage_url=storage_url,
            file_type=file_type,
            size_mb=round(file_size_mb, 2),
            folder_id=folder_id,
            num_pages=num_pages
        )
        
        try:
            document_id = await document_service.create_document(
                document_data, 
                current_user["email"], 
                content  
            )
        except ServiceError as e:
            handle_service_error(e)
        
        try:
            file_location = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_location, "wb") as f:
                f.write(content)
            
            return JSONResponse(content={
                "message": f"File '{file.filename}' uploaded successfully.",
                "document_id": document_id,
                "file_size_mb": file_size_mb,
                "storage_location": file_location
            })
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file physically: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
