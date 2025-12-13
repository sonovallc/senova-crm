"""Payment methods for wallet system"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class PaymentMethod(Base):
    """
    Payment methods (credit cards) associated with wallets.
    Stores tokenized card information via Stripe.
    """

    __tablename__ = "payment_methods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Wallet association
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False, index=True)

    # Stripe payment method details
    stripe_payment_method_id = Column(String(100), nullable=False, unique=True)

    # Card details (for display only, actual processing via Stripe)
    card_brand = Column(String(20), nullable=False)  # visa, mastercard, amex, discover
    card_last_four = Column(String(4), nullable=False)
    card_exp_month = Column(Integer, nullable=False)
    card_exp_year = Column(Integer, nullable=False)

    # Status
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    wallet = relationship("Wallet", back_populates="payment_methods")

    # Indexes
    __table_args__ = (
        Index('idx_payment_methods_wallet_id', 'wallet_id'),
        Index('idx_payment_methods_stripe_id', 'stripe_payment_method_id'),
        Index('idx_payment_methods_default', 'wallet_id', 'is_default'),
    )

    def __repr__(self):
        return f"<PaymentMethod {self.card_brand} ***{self.card_last_four}>"

    @property
    def display_name(self) -> str:
        """Get display name for the payment method"""
        return f"{self.card_brand.title()} ending in {self.card_last_four}"

    @property
    def is_expired(self) -> bool:
        """Check if card is expired"""
        from datetime import datetime
        now = datetime.now()
        return (self.card_exp_year < now.year or
                (self.card_exp_year == now.year and self.card_exp_month < now.month))