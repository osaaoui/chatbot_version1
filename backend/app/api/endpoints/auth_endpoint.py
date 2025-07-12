from fastapi import APIRouter, HTTPException
from app.models.user import UserCreate, UserLogin, Token
from app.services.auth_service import (
    get_password_hash,
    authenticate_user,
    create_access_token
)
from app.services.user_store import load_users, save_users 

router = APIRouter()

@router.post("/signup", response_model=Token)
def register(user: UserCreate):
    users = load_users()
    if user.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_data = {
        "fullName": user.fullName,
        "email": user.email,
        "hashed_password": get_password_hash(user.password),
        "role": user.role
    }
    
    users[user.email] = user_data
    # Pasa user_data como segundo parámetro
    save_users(users, user_data)

    token = create_access_token({"sub": user.email, "role": user.role, "fullName": user.fullName})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(user: UserLogin):
    auth_user = authenticate_user(user.email, user.password)
    if not auth_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": auth_user["email"], "role": auth_user["role"], "fullName": auth_user["fullName"]})
    return {"access_token": access_token, "token_type": "bearer"}

