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

async def update_user_in_sqlite(old_email: str, new_email: str, full_name: str, role: str):
    try:
        users = load_users()
        
        if old_email in users:
            user_data = users[old_email]
            
            user_data["email"] = new_email
            user_data["fullName"] = full_name
            user_data["role"] = role
            
            del users[old_email]
            
            users[new_email] = user_data
            
            save_users(users)
            
            print(f"Usuario actualizado en SQLite: {old_email} -> {new_email}")
        else:
            print(f"Usuario {old_email} no encontrado en SQLite")
            
    except Exception as e:
        print(f"Error actualizando usuario en SQLite: {str(e)}")

async def insert_user_to_postgresql(fullName: str, email: str, password_hash: str, role: str):
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL)
        
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
        

        company_name = f"{fullName} Company"
        company_id = await conn.fetchval(
            "SELECT public.sp_createcompany($1, $2, $3, $4)",
            company_name,      
            32,                 
            "default",
            user_id             
        )

        if not company_id:
            await conn.close()
            return None
        
        document_base_name = f"{fullName} Documents"
        document_base_id = await conn.fetchval(
            "SELECT SP_CreateDocumentBase($1, $2, $3, $4)",
            document_base_name, 
            user_id,            
            None,               
            user_id             
        )
        
        expiration_date = datetime.now() + timedelta(days=365) 
        package_id = await conn.fetchval(
            "SELECT SP_CreatePurchasedPackage($1, $2, $3, $4, $5, $6, $7)",
            user_id,                                   
            'Individual',                              
            'INDIVIDUAL_PRO',                          
            expiration_date,                           
            19.99,                                     
            user_id,                                   
            1                                          
        )
        
        permission_id = await conn.fetchval(
            "SELECT SP_CreateOrUpdateDocumentPermission($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            user_id,          
            user_id,          
            True,             
            True,             
            True,            
            True,             
            document_base_id,  
            None,             
            None            
        )
        
        folder_name = f"{fullName} Folder"
        user_folder_id = await conn.fetchval(
            "SELECT SP_CreateFolder($1, $2, $3, $4)",
            folder_name,      
            document_base_id, 
            user_id,          
            None      
        )
        
        await conn.close()
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
    with open(USER_FILE, "w") as f:
        json.dump(users, f, indent=2)
    
    if user_data:
        try:
            try:
                loop = asyncio.get_running_loop()
                task = asyncio.create_task(insert_user_to_postgresql(
                    user_data["fullName"],
                    user_data["email"],
                    user_data["hashed_password"], 
                    user_data["role"]
                ))
                
                def handle_result(task):
                    try:
                        result = task.result()
                        if not result:
                            print("Error: No se pudo crear el usuario completo")
                    except Exception as e:
                        print(f"Error en PostgreSQL: {e}")
                
                task.add_done_callback(handle_result)
                
            except RuntimeError:
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