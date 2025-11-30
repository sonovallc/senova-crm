"""Payment model - PCI DSS compliant (tokenized only, NO raw card data)"""

from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class PaymentGateway(str, enum.Enum):
    """Payment gateway provider"""
    STRIPE = "stripe"
    SQUARE = "square"
    PAYPAL = "paypal"
    CASH_APP = "cashapp"


class PaymentStatus(str, enum.Enum):
    """Payment processing status"""
    PENDING = "pending"
    APPROVED = "approved"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class Payment(Base):
    """
    Payment transactions - PCI DSS compliant

    CRITICAL: NEVER store raw payment card data
    ALWAYS use gateway-provided tokens only
    """

    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Payment Gateway
    gateway = Column(SQLEnum(PaymentGateway), nullable=False)
    gateway_payment_id = Column(String(255), unique=True, index=True)  # External payment ID from gateway

    # Customer
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False, index=True)

    # Amount (stored in cents to avoid floating point issues)
    amount = Column(Integer, nullable=False)  # Amount in cents (e.g., 10000 = $100.00)
    currency = Column(String(3), default="USD")

    # Payment Method (TOKENIZED - NO RAW CARD DATA)
    # CRITICAL: Only store gateway-provided tokens, never raw card numbers
    payment_method_token = Column(String(500))  # Gateway-provided payment method token
    payment_method_type = Column(String(50))    # "card", "ach", "cash_app", etc.

    # Display Information ONLY (for UI, never for processing)
    last_four_digits = Column(String(4))        # Last 4 digits for display only
    card_brand = Column(String(50))             # "Visa", "Mastercard", etc. for display

    # Status
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, index=True)

    # Description and Reference
    description = Column(Text)
    invoice_number = Column(String(100))

    # Refund Information
    refunded_amount = Column(Integer, default=0)  # Amount refunded in cents
    refund_reason = Column(Text)
    refunded_at = Column(DateTime(timezone=True))

    # Gateway Response Metadata (for debugging and reconciliation)
    gateway_response = Column(JSONB, default=dict)
    # Example: {"transaction_id": "xyz", "auth_code": "123456", "avs_result": "Y", "cvv_result": "M"}

    # Timestamps
    processed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    contact = relationship("Contact", back_populates="payments")

    # Indexes for performance
    __table_args__ = (
        Index('idx_payment_contact', 'contact_id', 'created_at'),
        Index('idx_payment_gateway', 'gateway', 'gateway_payment_id'),
        Index('idx_payment_status', 'status', 'created_at'),
        Index('idx_payment_gateway_id', 'gateway_payment_id'),
    )

    def __repr__(self):
        return f"<Payment {self.gateway} ${self.amount_dollars} - {self.status}>"

    @property
    def amount_dollars(self) -> float:
        """Get amount in dollars (converted from cents)"""
        return self.amount / 100.0

    @property
    def is_refunded(self) -> bool:
        """Check if payment is fully or partially refunded"""
        return self.status in [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED]

    @property
    def can_refund(self) -> bool:
        """Check if payment can be refunded"""
        return self.status == PaymentStatus.COMPLETED and not self.is_refunded

    @property
    def refund_amount_dollars(self) -> float:
        """Get refunded amount in dollars"""
        return self.refunded_amount / 100.0 if self.refunded_amount else 0.0
