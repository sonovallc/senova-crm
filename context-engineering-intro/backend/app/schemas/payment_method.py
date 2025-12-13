"""Payment method Pydantic schemas for request/response validation"""

from pydantic import BaseModel, Field, field_validator, computed_field
from typing import Optional
from datetime import datetime
from uuid import UUID


# Payment Method Schemas
class PaymentMethodBase(BaseModel):
    """Base payment method schema"""
    pass


class PaymentMethodCreate(BaseModel):
    """Schema for adding a payment method"""
    payment_method_id: str = Field(..., description="Stripe payment method ID (starts with pm_)")

    @field_validator("payment_method_id")
    @classmethod
    def validate_payment_method_id(cls, v: str) -> str:
        """Validate payment method ID format"""
        if not v.startswith("pm_"):
            raise ValueError("Payment method ID must start with 'pm_'")
        return v


class PaymentMethodUpdate(BaseModel):
    """Schema for updating a payment method"""
    is_default: Optional[bool] = Field(None, description="Set as default payment method")


class PaymentMethodResponse(PaymentMethodBase):
    """Schema for payment method response"""
    id: UUID
    wallet_id: UUID
    stripe_payment_method_id: str
    card_brand: str
    card_last_four: str
    card_exp_month: int = Field(..., ge=1, le=12)
    card_exp_year: int = Field(..., ge=datetime.now().year)
    is_default: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def display_name(self) -> str:
        """Get display name for the payment method"""
        return f"{self.card_brand.title()} ending in {self.card_last_four}"

    @computed_field
    @property
    def is_expired(self) -> bool:
        """Check if card is expired"""
        now = datetime.now()
        return (self.card_exp_year < now.year or
                (self.card_exp_year == now.year and self.card_exp_month < now.month))

    @computed_field
    @property
    def expiry_display(self) -> str:
        """Get formatted expiry date"""
        return f"{self.card_exp_month:02d}/{self.card_exp_year}"

    model_config = {"from_attributes": True}


class SetupIntentRequest(BaseModel):
    """Request for creating a Stripe Setup Intent"""
    wallet_id: UUID = Field(..., description="Wallet to add payment method to")


class SetupIntentResponse(BaseModel):
    """Response containing Setup Intent details"""
    client_secret: str = Field(..., description="Client secret for Stripe.js")
    wallet_id: UUID
    stripe_customer_id: str


class PaymentMethodListResponse(BaseModel):
    """Response for listing payment methods"""
    payment_methods: list[PaymentMethodResponse]
    default_method_id: Optional[UUID] = None
    total: int


class PaymentMethodDeleteResponse(BaseModel):
    """Response for deleting a payment method"""
    success: bool
    message: str
    deleted_id: UUID