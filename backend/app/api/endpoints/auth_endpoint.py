from fastapi import APIRouter, HTTPException
from app.models.user import UserCreate, UserLogin, Token
from app.services.auth_service import (
    get_password_hash,
    authenticate_user,
    create_access_token
)

from pydantic import BaseModel, EmailStr

from app.services.user_store import load_users, save_users  # JSON file-based store


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # <-- add this

router = APIRouter()

@router.post("/signup", response_model=Token)
def register(user: UserCreate):
    users = load_users()
    if user.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")

    users[user.email] = {
    "email": user.email,
    "hashed_password": get_password_hash(user.password),
    "role": user.role  # <-- store the role
}


    save_users(users)

    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(user: UserLogin):
    auth_user = authenticate_user(user.email, user.password)
    if not auth_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": auth_user["email"], "role": auth_user["role"]})
    return {"access_token": access_token, "token_type": "bearer"}

