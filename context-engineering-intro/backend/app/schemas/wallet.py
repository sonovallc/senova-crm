"""Wallet system Pydantic schemas for request/response validation"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator, computed_field
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from decimal import Decimal
from uuid import UUID

if TYPE_CHECKING:
    from app.schemas.payment_method import PaymentMethodResponse


# Wallet Schemas
class WalletBase(BaseModel):
    """Base wallet schema"""
    currency: str = Field(default="USD", description="Currency code")

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Validate currency is supported"""
        supported = ["USD", "EUR", "GBP", "CAD"]
        if v not in supported:
            raise ValueError(f"Currency must be one of {supported}")
        return v


class WalletResponse(WalletBase):
    """Schema for wallet response"""
    id: UUID
    object_id: UUID
    owner_type: str
    owner_user_id: Optional[UUID] = None
    balance: Decimal = Field(..., decimal_places=2)
    auto_recharge_enabled: bool
    auto_recharge_threshold: Decimal = Field(..., decimal_places=2)
    auto_recharge_amount: Decimal = Field(..., decimal_places=2)
    stripe_customer_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def has_payment_method(self) -> bool:
        """Check if wallet has at least one payment method"""
        # This will be populated by the service when including payment methods
        return False  # Default, will be overridden in service

    @computed_field
    @property
    def needs_recharge(self) -> bool:
        """Check if wallet needs auto-recharge"""
        return self.auto_recharge_enabled and self.balance < self.auto_recharge_threshold

    model_config = {"from_attributes": True}


class WalletWithPaymentMethods(WalletResponse):
    """Wallet response with payment methods included"""
    payment_methods: List[PaymentMethodResponse] = []

    @computed_field
    @property
    def has_payment_method(self) -> bool:
        """Check if wallet has at least one payment method"""
        return len(self.payment_methods) > 0


class WalletCreateRequest(BaseModel):
    """Schema for creating a wallet (usually automatic)"""
    object_id: UUID = Field(..., description="Object that owns this wallet")
    owner_type: str = Field(default="object", pattern="^(object|user)$")
    owner_user_id: Optional[UUID] = Field(None, description="User ID if owner_type is 'user'")
    currency: str = Field(default="USD")

    @field_validator("owner_user_id")
    @classmethod
    def validate_owner_consistency(cls, v: Optional[UUID], values) -> Optional[UUID]:
        """Validate owner_user_id matches owner_type"""
        owner_type = values.data.get("owner_type")
        if owner_type == "user" and v is None:
            raise ValueError("owner_user_id is required when owner_type is 'user'")
        if owner_type == "object" and v is not None:
            raise ValueError("owner_user_id must be null when owner_type is 'object'")
        return v


class WalletFundRequest(BaseModel):
    """Schema for adding funds to wallet"""
    amount: Decimal = Field(..., ge=5.00, le=1000.00, decimal_places=2, description="Amount to add (min $5, max $1000)")
    payment_method_id: UUID = Field(..., description="Payment method to charge")
    description: Optional[str] = Field(None, description="Optional description for the transaction")


class WalletSettingsUpdate(BaseModel):
    """Schema for updating wallet auto-recharge settings"""
    auto_recharge_enabled: Optional[bool] = Field(None, description="Enable/disable auto-recharge")
    auto_recharge_threshold: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100.00,
        decimal_places=2,
        description="Balance threshold to trigger auto-recharge"
    )
    auto_recharge_amount: Optional[Decimal] = Field(
        None,
        ge=10.00,
        le=500.00,
        decimal_places=2,
        description="Amount to add on auto-recharge"
    )


# Wallet Transaction Schemas
class WalletTransactionBase(BaseModel):
    """Base wallet transaction schema"""
    transaction_type: str = Field(..., description="Type of transaction")
    amount: Decimal = Field(..., decimal_places=2, description="Amount (positive=credit, negative=debit)")
    description: str = Field(..., description="Transaction description")

    @field_validator("transaction_type")
    @classmethod
    def validate_transaction_type(cls, v: str) -> str:
        """Validate transaction type"""
        valid_types = [
            "credit_card_charge", "sms_usage", "mms_usage", "voice_usage",
            "phone_number_purchase", "phone_number_monthly", "refund",
            "auto_recharge", "manual_credit", "manual_debit"
        ]
        if v not in valid_types:
            raise ValueError(f"Transaction type must be one of {valid_types}")
        return v


class WalletTransactionResponse(WalletTransactionBase):
    """Schema for wallet transaction response"""
    id: UUID
    wallet_id: UUID
    balance_after: Decimal = Field(..., decimal_places=2)
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    created_at: datetime

    @computed_field
    @property
    def is_credit(self) -> bool:
        """Check if this is a credit transaction"""
        return self.amount > 0

    @computed_field
    @property
    def is_debit(self) -> bool:
        """Check if this is a debit transaction"""
        return self.amount < 0

    @computed_field
    @property
    def display_amount(self) -> str:
        """Get formatted display amount with sign"""
        if self.is_credit:
            return f"+${abs(float(self.amount)):.2f}"
        else:
            return f"-${abs(float(self.amount)):.2f}"

    model_config = {"from_attributes": True}


class WalletUsageDeduction(BaseModel):
    """Schema for deducting usage charges from wallet"""
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Amount to deduct")
    transaction_type: str = Field(..., pattern="^(sms_usage|mms_usage|voice_usage)$")
    description: str = Field(..., description="Description of the usage")
    reference_type: Optional[str] = Field(None, description="Type of reference (e.g., 'communication')")
    reference_id: Optional[str] = Field(None, description="ID of the reference entity")


class WalletBalanceCheck(BaseModel):
    """Schema for checking wallet balance"""
    required_amount: Decimal = Field(..., gt=0, decimal_places=2)


class WalletBalanceResponse(BaseModel):
    """Response for balance check"""
    balance: str = Field(..., description="Current wallet balance as string")
    currency: str = Field(..., description="Currency code")


class WalletTransactionListResponse(BaseModel):
    """Response for listing wallet transactions"""
    transactions: List[WalletTransactionResponse]
    total: int = Field(..., description="Total number of transactions")
    limit: int = Field(..., description="Number of transactions per page")
    offset: int = Field(..., description="Number of transactions skipped")