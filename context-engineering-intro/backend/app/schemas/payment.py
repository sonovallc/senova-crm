"""Payment Pydantic schemas"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from app.models.payment import PaymentGateway, PaymentStatus


class PaymentBase(BaseModel):
    """Base payment schema"""
    contact_id: uuid.UUID
    amount: int = Field(..., gt=0, description="Amount in cents")
    currency: str = "USD"
    description: Optional[str] = None


class PaymentCreate(PaymentBase):
    """
    Schema for creating payment

    CRITICAL: payment_method_token comes from client-side gateway SDK
    NEVER send raw card data to backend
    """
    gateway: PaymentGateway
    payment_method_token: str = Field(..., description="Tokenized payment method from gateway SDK")
    invoice_number: Optional[str] = None


class PaymentResponse(PaymentBase):
    """Schema for payment response"""
    id: uuid.UUID
    gateway: PaymentGateway
    gateway_payment_id: Optional[str] = None
    payment_method_type: Optional[str] = None
    last_four_digits: Optional[str] = None  # Display only
    card_brand: Optional[str] = None  # Display only
    status: PaymentStatus
    refunded_amount: int = 0
    refund_reason: Optional[str] = None
    refunded_at: Optional[datetime] = None
    gateway_response: Dict[str, Any] = {}
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @property
    def amount_dollars(self) -> float:
        """Get amount in dollars"""
        return self.amount / 100.0

    @property
    def refund_amount_dollars(self) -> float:
        """Get refunded amount in dollars"""
        return self.refunded_amount / 100.0 if self.refunded_amount else 0.0


class PaymentList(BaseModel):
    """Schema for paginated payment list"""
    items: List[PaymentResponse]
    total: int
    page: int
    page_size: int
    pages: int


class RefundRequest(BaseModel):
    """Schema for payment refund request"""
    amount: Optional[int] = Field(None, gt=0, description="Amount to refund in cents (None = full refund)")
    reason: str = Field(..., min_length=1, description="Reason for refund")
