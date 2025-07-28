from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    fullName: str
    email: str
    password: str
    role: str 
    packageId: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
