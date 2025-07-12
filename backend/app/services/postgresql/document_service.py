from typing import Optional, Dict, Any
from app.core.base_service import BaseService, ServiceError
from app.models.postgresql.document import DocumentCreate, DocumentResponse


class DocumentService(BaseService):
    
    async def create_document(self, document_data: DocumentCreate, user_email: str, file_content: bytes = None) -> str:
        """
        Create a new document in PostgreSQL
        
        Args:
            document_data: Document creation data
            user_email: Email of the user creating the document
            file_content: Binary content of the file (optional)
            
        Returns:
            str: Document ID
        """
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            # Convert file content to base64 if provided
            base64_file = None
            if file_content:
                base64_file = file_content
            
            async with self.get_connection() as conn:
                document_id = await conn.fetchval(
                    "SELECT SP_CreateDocument($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                    document_data.document_name,
                    document_data.document_base_id,
                    document_data.storage_url,
                    document_data.file_type,
                    document_data.size_mb,
                    user_id,
                    document_data.folder_id,
                    document_data.num_pages,
                    base64_file
                )
                return str(document_id)
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to create document: {str(e)}")
    
    async def get_document_by_id(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        try:
            async with self.get_connection() as conn:
                result = await conn.fetchrow("SELECT * FROM SP_ReadDocumentById($1)", document_id)
                return dict(result) if result else None
        except Exception as e:
            raise ServiceError(f"Failed to retrieve document: {str(e)}")
    
    async def update_document(self, document_id: str, document_name: str, user_email: str) -> bool:
        """Update document name"""
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            async with self.get_connection() as conn:
                await conn.execute(
                    "SELECT SP_UpdateDocument($1, $2, $3, NULL, NULL, NULL)",
                    document_id, user_id, document_name
                )
                return True
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to update document: {str(e)}")
    
    async def delete_document(self, document_id: str, user_email: str) -> bool:
        """Soft delete document"""
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            async with self.get_connection() as conn:
                await conn.execute("SELECT SP_DeleteDocument($1, $2)", document_id, user_id)
                return True
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to delete document: {str(e)}")