from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DocumentCreate(BaseModel):
    document_name: str = Field(..., min_length=1, max_length=255, description="Name of the document")
    document_base_id: str = Field(..., description="ID of the document base")
    storage_url: str = Field(..., description="URL where document is stored")
    file_type: str = Field(..., description="Type of file (pdf, docx, etc.)")
    size_mb: float = Field(..., gt=0, description="Size of file in MB")
    folder_id: Optional[str] = Field(None, description="ID of folder containing document")
    num_pages: Optional[int] = Field(None, ge=1, description="Number of pages in document")

class DocumentUpdate(BaseModel):
    document_name: str = Field(..., min_length=1, max_length=255, description="New name for the document")

class DocumentResponse(BaseModel):
    document_id: str
    document_name: str
    document_base_id: str
    folder_id: Optional[str]
    storage_url: str
    file_type: str
    size_mb: float
    status: str
    vectorization_status: str
    creation_date: datetime
    created_by_user_id: str