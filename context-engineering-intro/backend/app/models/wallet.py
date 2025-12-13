"""Wallet system for managing credits and payments"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, CheckConstraint, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class Wallet(Base):
    """
    Wallet for managing prepaid credits for SMS/voice communications.
    Can be owned by either an object or a user.
    """

    __tablename__ = "wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Object that owns this wallet (for organization wallets)
    object_id = Column(UUID(as_uuid=True), ForeignKey("objects.id"), nullable=False, index=True, unique=True)

    # Owner type and reference
    owner_type = Column(String(20), nullable=False, default='object')  # 'object' or 'user'
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # Balance and currency
    balance = Column(Numeric(10, 2), nullable=False, default=0.00)
    currency = Column(String(3), nullable=False, default='USD')

    # Auto-recharge settings
    auto_recharge_enabled = Column(Boolean, default=False)
    auto_recharge_threshold = Column(Numeric(10, 2), default=10.00)  # Trigger when balance falls below
    auto_recharge_amount = Column(Numeric(10, 2), default=50.00)  # Amount to add

    # Stripe integration
    stripe_customer_id = Column(String(100), nullable=True, unique=True)
    default_payment_method_id = Column(String(100), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    object = relationship("Object", backref="wallet")
    owner_user = relationship("User", foreign_keys=[owner_user_id], backref="owned_wallets")
    transactions = relationship(
        "WalletTransaction",
        back_populates="wallet",
        cascade="all, delete-orphan",
        order_by="desc(WalletTransaction.created_at)"
    )
    payment_methods = relationship(
        "PaymentMethod",
        back_populates="wallet",
        cascade="all, delete-orphan"
    )

    # Constraints and indexes
    __table_args__ = (
        # Check that owner_type matches the populated field
        CheckConstraint(
            "(owner_type = 'object' AND owner_user_id IS NULL) OR "
            "(owner_type = 'user' AND owner_user_id IS NOT NULL)",
            name='ck_wallet_owner_consistency'
        ),
        Index('idx_wallets_object_id', 'object_id'),
        Index('idx_wallets_owner_user_id', 'owner_user_id'),
        Index('idx_wallets_stripe_customer', 'stripe_customer_id'),
    )

    def __repr__(self):
        return f"<Wallet {self.id} balance={self.balance} {self.currency}>"

    @property
    def can_charge(self, amount: float) -> bool:
        """Check if wallet has sufficient balance for a charge"""
        return float(self.balance) >= amount

    @property
    def needs_recharge(self) -> bool:
        """Check if wallet needs auto-recharge based on threshold"""
        return (
            self.auto_recharge_enabled and
            float(self.balance) < float(self.auto_recharge_threshold)
        )