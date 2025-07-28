from pydantic import BaseModel, Field, EmailStr

class EmailVerificationRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address to verify")

class EmailVerificationValidate(BaseModel):
    email: EmailStr = Field(..., description="Email address")
    verification_code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")