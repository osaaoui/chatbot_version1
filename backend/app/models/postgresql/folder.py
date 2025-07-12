from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal

class FolderCreate(BaseModel):
    folder_name: str = Field(..., min_length=1, max_length=255, description="Name of the folder")
    document_base_id: str = Field(..., description="ID of the document base")
    parent_folder_id: Optional[str] = Field(None, description="ID of parent folder if nested")

class FolderUpdate(BaseModel):
    folder_name: str = Field(..., min_length=1, max_length=255, description="New name for the folder")

class FolderResponse(BaseModel):
    folder_id: str
    folder_name: str
    document_base_id: str
    parent_folder_id: Optional[str]
    status: str
    creation_date: datetime
    created_by_user_id: str

class DocumentBaseCreate(BaseModel):
    base_name: str = Field(..., min_length=1, max_length=255, description="Name of the document base")
    company_id: Optional[str] = Field(None, description="ID of the company (mutually exclusive with owner_user_id)")

    
class DocumentBaseUpdate(BaseModel):
    base_name: Optional[str] = Field(None, min_length=1, max_length=255, description="New name for the document base")
    company_id: Optional[str] = Field(None, description="ID of the company (mutually exclusive with owner_user_id)")
    owner_user_id: Optional[str] = Field(None, description="ID of the owner user (mutually exclusive with company_id)")
    total_storage_mb: Optional[Decimal] = Field(None, description="Total storage in MB")
    status: Optional[str] = Field(None, description="Status of the document base")

    @model_validator(mode='after')
    def validate_mutually_exclusive(self):
        """Validate that only one of company_id or owner_user_id is provided"""
        # Solo validar si ambos campos están presentes (no None)
        if self.company_id is not None and self.owner_user_id is not None:
            raise ValueError('Cannot specify both company_id and owner_user_id')
        return self

    @model_validator(mode='after') 
    def validate_status(self):
        """Validate status field"""
        if self.status is not None and self.status not in ['Active', 'Inactive', 'Archived']:
            raise ValueError('Status must be Active, Inactive, or Archived')
        return self

class DocumentBaseResponse(BaseModel):
    document_base_id: str
    base_name: str
    company_id: Optional[str]
    owner_user_id: Optional[str]
    created_by_user_id: str
    creation_date: datetime
    last_modified_by_user_id: str
    last_modification_date: datetime
    status: str

    class Config:
        from_attributes = True
