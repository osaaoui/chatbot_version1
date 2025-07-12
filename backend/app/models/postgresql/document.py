from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class DocumentCreate(BaseModel):
    document_name: str = Field(..., max_length=255)
    document_base_id: UUID
    storage_url: str
    file_type: str = Field(..., max_length=50)
    size_mb: float = Field(..., gt=0)
    folder_id: Optional[UUID] = None
    num_pages: Optional[int] = None

class DocumentResponse(BaseModel):
    document_id: UUID
    document_name: str
    folder_id: Optional[UUID]
    document_base_id: UUID
    storage_url: str
    file_type: str
    size_mb: float
    num_pages: Optional[int]
    vectorization_status: str
    created_by_user_id: UUID
    creation_date: str
    last_modified_by_user_id: UUID
    last_modification_date: str
    status: str

class DocumentUpdate(BaseModel):
    document_name: str = Field(..., min_length=1, max_length=255, description="New name for the document")
