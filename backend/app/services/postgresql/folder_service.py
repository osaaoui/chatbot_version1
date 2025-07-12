from typing import List, Optional, Dict, Any
from app.core.base_service import BaseService, ServiceError
from app.models.postgresql.folder import *

class FolderService(BaseService):
    
    async def create_folder(self, folder_data: FolderCreate, user_email: str) -> str:
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            async with self.get_connection() as conn:
                folder_id = await conn.fetchval(
                    "SELECT SP_CreateFolder($1, $2, $3, $4)",
                    folder_data.folder_name,
                    folder_data.document_base_id,
                    user_id,
                    folder_data.parent_folder_id
                )
                return str(folder_id)
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to create folder: {str(e)}")
    
    async def get_folder_by_id(self, folder_id: str) -> Optional[Dict[str, Any]]:
        """Get folder by ID"""
        try:
            async with self.get_connection() as conn:
                result = await conn.fetchrow("SELECT * FROM SP_ReadFolderById($1)", folder_id)
                return dict(result) if result else None
        except Exception as e:
            raise ServiceError(f"Failed to retrieve folder: {str(e)}")
    
    async def get_folders_by_user(self, user_email: str) -> List[Dict[str, Any]]:
        """Get all folders for a user"""
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            async with self.get_connection() as conn:
                results = await conn.fetch("SELECT * FROM SP_ReadFoldersByUser($1)", user_id)
                return [dict(row) for row in results]
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to retrieve folders: {str(e)}")

    async def update_folder(
        self, 
        folder_id: str, 
        user_email: str, 
        folder_name: Optional[str] = None, 
        parent_folder_id: Optional[str] = None,
        change_parent: bool = False 
    ) -> bool:
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            print(f"Updating folder {folder_id}: name={folder_name}, parent={parent_folder_id}, change_parent={change_parent}")
            
            async with self.get_connection() as conn:
                await conn.execute(
                    "SELECT SP_UpdateFolder($1, $2, $3, $4, NULL, $5)",
                    folder_id, user_id, folder_name, parent_folder_id, change_parent
                )
                return True
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to update folder: {str(e)}")
    
    async def delete_folder(self, folder_id: str, user_email: str) -> bool:
        """Soft delete folder"""
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            async with self.get_connection() as conn:
                await conn.execute("SELECT SP_DeleteFolder($1, $2)", folder_id, user_id)
                return True
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to delete folder: {str(e)}")
        

    async def get_document_bases_by_user(self, user_email: str) -> List[Dict[str, Any]]:
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            async with self.get_connection() as conn:
                results = await conn.fetch("SELECT * FROM SP_ReadDocumentBasesByUser($1)", user_id)
                return [dict(row) for row in results]
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to retrieve document bases: {str(e)}")
        
    async def create_document_base(self, documentbase_data: DocumentBaseCreate, user_email: str) -> str:
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            # Si no hay company_id o es string vacío, el owner es el usuario actual
            company_id = documentbase_data.company_id if documentbase_data.company_id and documentbase_data.company_id.strip() else None
            owner_user_id = user_id if not company_id else None
            
            async with self.get_connection() as conn:
                document_base_id = await conn.fetchval(
                    "SELECT SP_createdocumentbase($1, $2, $3, $4)",
                    documentbase_data.base_name,
                    user_id, 
                    company_id,     
                    owner_user_id    
                )
                return str(document_base_id)
        except ServiceError:
            raise
        except Exception as e:
            error_msg = str(e)
            if "already exists" in error_msg:
                raise ServiceError("Document base name already exists", 400)
            elif "Invalid company_id" in error_msg:
                raise ServiceError("Invalid company_id, owner_user_id, or user not found", 400)
            else:
                raise ServiceError(f"Failed to create document base: {error_msg}")
            
    async def update_document_base(
        self, 
        document_base_id: str, 
        update_data: DocumentBaseUpdate, 
        user_email: str
    ) -> bool:
        """Update document base"""
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            async with self.get_connection() as conn:
                await conn.execute(
                    "SELECT sp_updatedocumentbase($1, $2, $3, $4, $5)",
                    document_base_id,
                    user_id,
                    update_data.base_name,
                    update_data.total_storage_mb,
                    update_data.status
                )
                return True
        except ServiceError:
            raise
        except Exception as e:
            error_msg = str(e)
            if "not found" in error_msg:
                raise ServiceError("Document base not found", 404)
            elif "already exists" in error_msg:
                raise ServiceError("Document base name already exists", 400)
            else:
                raise ServiceError(f"Failed to update document base: {error_msg}")
    
    async def delete_document_base(self, document_base_id: str, user_email: str) -> bool:
        """Soft delete document base"""
        try:
            user_id = await self.get_user_id_by_email(user_email)
            
            async with self.get_connection() as conn:
                await conn.execute(
                    "SELECT sp_deletedocumentbase($1, $2)",
                    document_base_id,
                    user_id
                )
                return True
        except ServiceError:
            raise
        except Exception as e:
            error_msg = str(e)
            if "not found" in error_msg:
                raise ServiceError("Document base not found", 404)
            else:
                raise ServiceError(f"Failed to delete document base: {error_msg}")