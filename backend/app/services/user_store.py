# services/user_store.py
import json
import os
import asyncio
import asyncpg
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
        user_id = await conn.fetchval(
            "SELECT public.sp_createuser($1, $2, $3, $4, $5)",
            fullName,
            email, 
            password_hash,
            1,
            None 
        )
        
        await conn.close()
        return str(user_id)
        
    except Exception as e:
        print(f"Error inserting user to PostgreSQL: {str(e)}")
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
                # Opcional: puedes agregar un callback para manejar el resultado
                task.add_done_callback(lambda t: print(f"PostgreSQL insert result: {t.result()}") if not t.exception() else print(f"PostgreSQL error: {t.exception()}"))
                
            except RuntimeError:
                # No hay loop corriendo, crea uno nuevo
                asyncio.run(insert_user_to_postgresql(
                    user_data["fullName"],
                    user_data["email"],
                    user_data["hashed_password"],
                    user_data["role"]
                ))
        except Exception as e:
            print(f"Failed to insert to PostgreSQL: {str(e)}")