from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserProfile(BaseModel):
    user_id: str
    full_name: str
    email: str
    status: str
    role: str
    is_active: bool
    created_date: Optional[datetime] = None
    last_modification_date: Optional[datetime] = None

class UpdateUserProfileRequest(BaseModel):
    email: Optional[EmailStr] = None

class UpdateUserProfileResponse(BaseModel):
    profile: UserProfile
    token_regenerated: bool
    new_token: Optional[str] = None
    token_type: Optional[str] = None