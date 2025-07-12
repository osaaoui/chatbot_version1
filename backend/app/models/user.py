from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    fullName: str
    email: str
    password: str
    role: str 

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
