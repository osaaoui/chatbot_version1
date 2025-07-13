# services/user_store.py
import json
import os
import asyncio
import asyncpg
from datetime import datetime, timedelta
from app.core.config import settings

USER_FILE = "users.json"

def load_users():
    if not os.path.exists(USER_FILE):
        return {}
    with open(USER_FILE, "r") as f:
        return json.load(f)

async def insert_user_to_postgresql(fullName: str, email: str, password_hash: str, role: str):
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL)
        
        # 1. Crear el usuario
        user_id = await conn.fetchval(
            "SELECT public.sp_createuser($1, $2, $3, $4, $5)",
            fullName,
            email, 
            password_hash,
            1,
            None 
        )
        
        if not user_id:
            await conn.close()
            return None
        
        # 2. Crear DocumentBase personal
        document_base_name = f"{fullName} Personal Documents"
        document_base_id = await conn.fetchval(
            "SELECT SP_CreateDocumentBase($1, $2, $3, $4)",
            document_base_name,  # base_name
            user_id,            # created_by_user_id
            None,               # company_id (NULL for personal)
            user_id             # owner_user_id
        )
        
        # 3. Crear PurchasedPackage (Individual Pro)
        expiration_date = datetime.now() + timedelta(days=365)  # 1 año desde ahora
        package_id = await conn.fetchval(
            "SELECT SP_CreatePurchasedPackage($1, $2, $3, $4, $5, $6, $7)",
            user_id,                                    # client_id
            'Individual',                               # client_type
            'INDIVIDUAL_PRO',                          # package_type_id
            expiration_date,                           # expiration_date
            19.99,                                     # amount_paid
            user_id,                                   # created_by_user_id
            1                                          # current_user_count
        )
        
        # 4. Crear permisos completos para el usuario en su DocumentBase
        permission_id = await conn.fetchval(
            "SELECT SP_CreateOrUpdateDocumentPermission($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            user_id,           # user_id
            user_id,           # created_by_user_id
            True,              # can_upload
            True,              # can_delete
            True,              # can_read
            True,              # can_modify
            document_base_id,  # document_base_id
            None,              # folder_id
            None               # document_id
        )
        
        # 5. Crear carpeta inicial con el nombre del usuario
        folder_name = f"{fullName} folder"
        user_folder_id = await conn.fetchval(
            "SELECT SP_CreateFolder($1, $2, $3, $4)",
            folder_name,       # folder_name
            document_base_id,  # document_base_id
            user_id,           # created_by_user_id
            None               # parent_folder_id (root folder)
        )
        
        await conn.close()
        
        # Retornar todos los datos creados
        return {
            "user_id": str(user_id),
            "document_base": {
                "id": str(document_base_id),
                "name": document_base_name
            },
            "package": {
                "id": str(package_id),
                "type": "INDIVIDUAL_PRO",
                "amount_paid": 19.99
            },
            "permission": {
                "id": str(permission_id),
                "permissions": "full_access"
            },
            "folder": {
                "id": str(user_folder_id),
                "name": folder_name
            }
        }
        
    except Exception as e:
        print(f"Error inserting user to PostgreSQL: {str(e)}")
        if 'conn' in locals():
            await conn.close()
        return None

def save_users(users: dict, user_data: dict = None):
    # Primero guarda en archivo
    with open(USER_FILE, "w") as f:
        json.dump(users, f, indent=2)
    
    # Luego maneja PostgreSQL si hay user_data
    if user_data:
        try:
            # Verifica si hay un loop en ejecución
            try:
                loop = asyncio.get_running_loop()
                # Si hay un loop corriendo, programa la tarea
                task = asyncio.create_task(insert_user_to_postgresql(
                    user_data["fullName"],
                    user_data["email"],
                    user_data["hashed_password"], 
                    user_data["role"]
                ))
                
                # Callback para manejar el resultado
                def handle_result(task):
                    try:
                        result = task.result()
                        if not result:
                            print("Error: No se pudo crear el usuario completo")
                    except Exception as e:
                        print(f"Error en PostgreSQL: {e}")
                
                task.add_done_callback(handle_result)
                
            except RuntimeError:
                # No hay loop corriendo, crea uno nuevo
                result = asyncio.run(insert_user_to_postgresql(
                    user_data["fullName"],
                    user_data["email"],
                    user_data["hashed_password"],
                    user_data["role"]
                ))
                
                if not result:
                    print("Error: No se pudo crear el usuario completo")
                        
        except Exception as e:
            print(f"Failed to insert to PostgreSQL: {str(e)}")