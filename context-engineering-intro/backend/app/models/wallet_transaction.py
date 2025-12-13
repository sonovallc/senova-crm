"""Wallet transaction history and tracking"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class WalletTransaction(Base):
    """
    Transaction history for wallet credits and debits.
    Tracks all financial activity including charges, usage, and refunds.
    """

    __tablename__ = "wallet_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Wallet association
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False, index=True)

    # Transaction details
    transaction_type = Column(String(30), nullable=False)
    # Types: 'credit_card_charge', 'sms_usage', 'mms_usage', 'voice_usage',
    #        'phone_number_purchase', 'phone_number_monthly', 'refund'

    amount = Column(Numeric(10, 2), nullable=False)  # Positive = credit, Negative = debit
    balance_after = Column(Numeric(10, 2), nullable=False)  # Balance after this transaction

    # Description and reference
    description = Column(Text, nullable=False)
    reference_type = Column(String(30), nullable=True)  # 'communication', 'phone_number', 'stripe_charge'
    reference_id = Column(String(100), nullable=True)  # ID of related entity

    # Stripe reference (for charges/refunds)
    stripe_charge_id = Column(String(100), nullable=True, index=True)

    # Timestamp (no updated_at as transactions are immutable)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    wallet = relationship("Wallet", back_populates="transactions")

    # Indexes
    __table_args__ = (
        Index('idx_wallet_transactions_wallet_id', 'wallet_id'),
        Index('idx_wallet_transactions_type', 'transaction_type'),
        Index('idx_wallet_transactions_created_at', 'created_at'),
        Index('idx_wallet_transactions_reference', 'reference_type', 'reference_id'),
    )

    def __repr__(self):
        return f"<WalletTransaction {self.transaction_type} {self.amount}>"

    @property
    def is_credit(self) -> bool:
        """Check if this is a credit transaction"""
        return float(self.amount) > 0

    @property
    def is_debit(self) -> bool:
        """Check if this is a debit transaction"""
        return float(self.amount) < 0

    @property
    def display_amount(self) -> str:
        """Get formatted display amount with sign"""
        if self.is_credit:
            return f"+${abs(float(self.amount)):.2f}"
        else:
            return f"-${abs(float(self.amount)):.2f}"