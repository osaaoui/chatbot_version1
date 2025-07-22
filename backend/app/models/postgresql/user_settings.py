from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class InterfaceMode(str, Enum):
    DARK = "dark"
    LIGHT = "light"

class UserSettingsUpdate(BaseModel):
    font_size: Optional[int] = Field(None, ge=8, le=32, description="Font size between 8 and 32")
    interface_mode: Optional[InterfaceMode] = Field(None, description="Interface theme mode")
    language: Optional[str] = Field(None, min_length=2, max_length=10, description="Language code")

class UserSettingsResponse(BaseModel):
    user_id: str
    font_size: int = 16
    interface_mode: InterfaceMode = InterfaceMode.LIGHT
    language: str = "en"