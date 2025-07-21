import json
import os
from typing import Optional
from app.core.base_service import BaseService

USER_FILE = "users.json"

class UserStoreService(BaseService):
    
    def load_users(self) -> dict:
        if not os.path.exists(USER_FILE):
            return {}
        try:
            with open(USER_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            return {}

    def save_users_to_json(self, users: dict) -> None:
        try:
            with open(USER_FILE, "w") as f:
                json.dump(users, f, indent=2)
        except Exception as e:
            print(f"Error saving users to JSON: {str(e)}")

    async def create_user_in_postgresql(self, user_data: dict) -> Optional[dict]:
        try:
            async with self.get_connection() as conn:
                package_type_id = "8002ea7c-3c28-4ca5-b162-382c719e6d55"
                
                result = await conn.fetchval(
                    "SELECT public.sp_createuserpackage($1, $2, $3, $4)",
                    user_data["fullName"],
                    user_data["email"],
                    user_data["hashed_password"],
                    package_type_id
                )
                
                if not result:
                    return None
                
                result_data = json.loads(result) if isinstance(result, str) else result
                
                if not result_data.get('success'):
                    return None
                
                return result_data.get('data', {})
                
        except Exception as e:
            return None

    async def save_user_complete(self, users: dict, user_data: dict = None) -> None:
        self.save_users_to_json(users)
        
        if user_data:
            result = await self.create_user_in_postgresql(user_data)
            if not result:
                print("Warning: User saved to JSON but failed to create in PostgreSQL")

    async def update_user(self, old_email: str, new_email: str, full_name: str, role: str) -> None:
        try:
            users = self.load_users()
            
            if old_email in users:
                user_data = users[old_email]
                user_data["email"] = new_email
                user_data["fullName"] = full_name
                user_data["role"] = role
                del users[old_email]
                users[new_email] = user_data
                self.save_users_to_json(users)
            else:
                print(f"Usuario {old_email} no encontrado")
                
        except Exception as e:
            print(f"Error actualizando usuario: {str(e)}")

user_service = UserStoreService()

def load_users():
    return user_service.load_users()

async def save_users(users: dict, user_data: dict = None):
    await user_service.save_user_complete(users, user_data)

async def update_user_in_sqlite(old_email: str, new_email: str, full_name: str, role: str):
    await user_service.update_user(old_email, new_email, full_name, role)