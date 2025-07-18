from pydantic import BaseModel, Field

class CompanyUpdate(BaseModel):
    id: int
    name: str = Field(..., max_length=255)
    address: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=20)
