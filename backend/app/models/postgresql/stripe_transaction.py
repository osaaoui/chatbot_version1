from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime
from decimal import Decimal

class TransactionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class Currency(str, Enum):
    USD = "USD"
    EUR = "EUR"
    COP = "COP"

class CompanyData(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    country_id: int = Field(..., ge=1)
    billing_address: str = Field(..., min_length=1)
    postal_code: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    nuid: Optional[str] = Field(None, max_length=100, description="Company tax ID")
    token_reference: Optional[str] = Field(None, max_length=255)

class UserData(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')  # ✅ CAMBIADO: regex → pattern
    password: str = Field(..., min_length=8, description="Plain password (will be hashed)")

class CreateCheckoutSessionRequest(BaseModel):
    package_type_id: str = Field(..., description="UUID of the package")
    user_data: UserData
    company_data: CompanyData
    success_url: Optional[str] = Field(None, description="Custom success URL")
    cancel_url: Optional[str] = Field(None, description="Custom cancel URL")

class CreateFreeUserRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')  # ✅ CAMBIADO: regex → pattern
    password: str = Field(..., min_length=8, description="Plain password (will be hashed)")
    verification_code: str = Field(..., min_length=4, max_length=10)
    country_id: Optional[int] = Field(32, ge=1, description="Country ID, defaults to Colombia")

class StripeTransactionResponse(BaseModel):
    transaction_id: str
    stripe_session_id: str
    stripe_payment_intent_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    user_email: str
    package_type_id: str
    amount: Decimal
    currency: Currency
    status: TransactionStatus
    company_data: Optional[Dict[str, Any]] = None
    user_data: Optional[Dict[str, Any]] = None
    webhook_events: Optional[List[Dict[str, Any]]] = None
    created_date: datetime
    completed_date: Optional[datetime] = None
    expires_at: datetime
    is_expired: bool

class CreateSessionResponse(BaseModel):
    success: bool
    checkout_url: str
    session_id: str
    transaction_id: str
    expires_in_hours: int = 24

class WebhookEventData(BaseModel):
    stripe_session_id: str
    stripe_payment_intent_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    event_type: str

class CleanupResponse(BaseModel):
    success: bool
    message: str
    expired_transactions: int
    cleanup_date: datetime

class StripeConfigResponse(BaseModel):
    publishable_key: str