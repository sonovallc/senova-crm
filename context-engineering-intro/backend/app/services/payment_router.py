"""
Payment gateway router with intelligent routing and fallback logic

Features:
- Multi-gateway routing (Stripe, Square, PayPal, Cash App)
- Automatic fallback on failure
- Cost optimization
- Gateway health monitoring
"""

from typing import Dict, Optional, List
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment, PaymentGateway, PaymentStatus
from app.models.contact import Contact
from app.services.stripe_service import get_stripe_service
from app.services.square_service import get_square_service
from app.services.paypal_service import get_paypal_service
from app.services.cashapp_service import get_cashapp_service
from app.core.exceptions import PaymentError, NotFoundError


class PaymentRouter:
    """
    Routes payments to appropriate gateway with fallback logic

    Features:
    - Gateway selection based on preference
    - Automatic fallback if primary fails
    - Cost optimization
    - Failure tracking
    """

    def __init__(self):
        self.stripe = get_stripe_service()
        self.square = get_square_service()
        self.paypal = get_paypal_service()
        self.cashapp = get_cashapp_service()

        # Gateway priority order (can be customized)
        self.gateway_priority = [
            PaymentGateway.STRIPE,
            PaymentGateway.SQUARE,
            PaymentGateway.PAYPAL,
            PaymentGateway.CASH_APP,
        ]

    async def process_payment(
        self,
        contact_id: UUID,
        amount_cents: int,
        currency: str = "USD",
        payment_method_token: str = None,
        gateway: Optional[PaymentGateway] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict] = None,
        db: Optional[AsyncSession] = None,
    ) -> Payment:
        """
        Process payment with intelligent gateway routing

        Args:
            contact_id: Contact making payment
            amount_cents: Amount in cents
            currency: Currency code
            payment_method_token: Payment token from client SDK
            gateway: Preferred gateway (auto-selects if None)
            description: Payment description
            metadata: Custom metadata
            db: Database session

        Returns:
            Payment record

        Raises:
            NotFoundError: Contact not found
            PaymentError: All gateways failed
        """
        if not db:
            raise PaymentError("Database session required")

        # Get contact
        contact = await db.get(Contact, contact_id)
        if not contact:
            raise NotFoundError(f"Contact {contact_id} not found")

        # Auto-select gateway if not specified
        if not gateway:
            gateway = self._select_gateway(amount_cents, currency)

        # Try payment with selected gateway
        payment = await self._attempt_payment(
            contact=contact,
            amount_cents=amount_cents,
            currency=currency,
            payment_method_token=payment_method_token,
            gateway=gateway,
            description=description,
            metadata=metadata,
            db=db,
        )

        if payment:
            return payment

        # If primary gateway failed, try fallbacks
        for fallback_gateway in self.gateway_priority:
            if fallback_gateway == gateway:
                continue  # Skip already tried gateway

            try:
                payment = await self._attempt_payment(
                    contact=contact,
                    amount_cents=amount_cents,
                    currency=currency,
                    payment_method_token=payment_method_token,
                    gateway=fallback_gateway,
                    description=description,
                    metadata=metadata,
                    db=db,
                )

                if payment:
                    return payment

            except PaymentError:
                continue  # Try next fallback

        raise PaymentError("All payment gateways failed")

    def _select_gateway(
        self,
        amount_cents: int,
        currency: str,
    ) -> PaymentGateway:
        """
        Auto-select best payment gateway

        Logic:
        - Stripe: Best for international, subscriptions
        - Square: Best for US retail, lower fees for small amounts
        - PayPal: Best for customer preference, no account needed
        - Cash App: Best for P2P, US only

        Args:
            amount_cents: Payment amount
            currency: Currency code

        Returns:
            Selected gateway
        """
        # For now, default to Stripe (most versatile)
        # TODO: Implement cost optimization logic
        # TODO: Check gateway health/uptime
        # TODO: Consider customer preference

        return PaymentGateway.STRIPE

    async def _attempt_payment(
        self,
        contact: Contact,
        amount_cents: int,
        currency: str,
        payment_method_token: str,
        gateway: PaymentGateway,
        description: Optional[str],
        metadata: Optional[Dict],
        db: AsyncSession,
    ) -> Optional[Payment]:
        """
        Attempt payment with specific gateway

        Args:
            contact: Contact object
            amount_cents: Amount in cents
            currency: Currency code
            payment_method_token: Payment token
            gateway: Gateway to use
            description: Payment description
            metadata: Custom metadata
            db: Database session

        Returns:
            Payment record or None if failed
        """
        # Create payment record
        payment = Payment(
            contact_id=contact.id,
            gateway=gateway,
            amount=amount_cents,
            currency=currency,
            payment_method_token=payment_method_token,
            description=description,
            metadata=metadata or {},
            status=PaymentStatus.PENDING,
        )

        db.add(payment)
        await db.commit()
        await db.refresh(payment)

        try:
            result = None

            if gateway == PaymentGateway.STRIPE:
                result = await self._process_stripe(
                    payment=payment,
                    amount_cents=amount_cents,
                    currency=currency,
                    payment_method_token=payment_method_token,
                    description=description,
                    metadata=metadata,
                )

            elif gateway == PaymentGateway.SQUARE:
                result = await self._process_square(
                    payment=payment,
                    amount_cents=amount_cents,
                    currency=currency,
                    payment_method_token=payment_method_token,
                    description=description,
                )

            elif gateway == PaymentGateway.PAYPAL:
                result = await self._process_paypal(
                    payment=payment,
                    amount_cents=amount_cents,
                    currency=currency,
                )

            elif gateway == PaymentGateway.CASH_APP:
                result = await self._process_cashapp(
                    payment=payment,
                    amount_cents=amount_cents,
                    currency=currency,
                    payment_method_token=payment_method_token,
                )

            if result:
                # Update payment record with result
                payment.external_id = result.get("payment_id") or result.get("order_id")
                payment.status = PaymentStatus.APPROVED
                payment.gateway_response = result

                # Extract card details if available
                if result.get("card_details"):
                    payment.last_four_digits = result["card_details"].get("last_4")
                    payment.card_brand = result["card_details"].get("brand")

                await db.commit()
                return payment

        except PaymentError as e:
            # Mark payment as failed
            payment.status = PaymentStatus.FAILED
            payment.gateway_response = {"error": str(e)}
            await db.commit()

            return None

        return None

    async def _process_stripe(
        self,
        payment: Payment,
        amount_cents: int,
        currency: str,
        payment_method_token: str,
        description: Optional[str],
        metadata: Optional[Dict],
    ) -> Dict:
        """Process payment with Stripe"""
        result = await self.stripe.create_payment_intent(
            amount_cents=amount_cents,
            currency=currency,
            payment_method=payment_method_token,
            description=description,
            metadata=metadata,
        )

        # If requires additional action (3D Secure), mark accordingly
        if result.get("requires_action"):
            payment.status = PaymentStatus.PENDING
            payment.gateway_response = result

        return result

    async def _process_square(
        self,
        payment: Payment,
        amount_cents: int,
        currency: str,
        payment_method_token: str,
        description: Optional[str],
    ) -> Dict:
        """Process payment with Square"""
        result = await self.square.create_payment(
            source_id=payment_method_token,
            amount_cents=amount_cents,
            currency=currency,
            note=description,
        )

        return result

    async def _process_paypal(
        self,
        payment: Payment,
        amount_cents: int,
        currency: str,
    ) -> Dict:
        """Process payment with PayPal"""
        # Convert cents to decimal string
        amount = f"{amount_cents / 100:.2f}"

        result = await self.paypal.create_order(
            amount=amount,
            currency=currency,
        )

        # PayPal requires customer approval, so status is pending
        payment.status = PaymentStatus.PENDING
        payment.gateway_response = result

        return result

    async def _process_cashapp(
        self,
        payment: Payment,
        amount_cents: int,
        currency: str,
        payment_method_token: str,
    ) -> Dict:
        """Process payment with Cash App"""
        result = await self.cashapp.create_payment(
            customer_token=payment_method_token,
            amount_cents=amount_cents,
            currency=currency,
        )

        return result

    async def refund_payment(
        self,
        payment_id: UUID,
        amount_cents: Optional[int] = None,
        reason: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> Payment:
        """
        Refund payment

        Args:
            payment_id: Payment ID to refund
            amount_cents: Refund amount (None = full refund)
            reason: Refund reason
            db: Database session

        Returns:
            Updated payment record

        Raises:
            NotFoundError: Payment not found
            PaymentError: Refund failed
        """
        if not db:
            raise PaymentError("Database session required")

        # Get payment
        payment = await db.get(Payment, payment_id)
        if not payment:
            raise NotFoundError(f"Payment {payment_id} not found")

        # Check if already refunded
        if payment.status == PaymentStatus.REFUNDED:
            raise PaymentError("Payment already refunded")

        # Check if can refund
        if not payment.can_refund:
            raise PaymentError(f"Payment cannot be refunded (status: {payment.status})")

        # Calculate refund amount
        refund_amount = amount_cents or (payment.amount - payment.refunded_amount)

        try:
            result = None

            if payment.gateway == PaymentGateway.STRIPE:
                result = await self.stripe.create_refund(
                    payment_intent_id=payment.external_id,
                    amount_cents=refund_amount,
                    reason=reason,
                )

            elif payment.gateway == PaymentGateway.SQUARE:
                result = await self.square.create_refund(
                    payment_id=payment.external_id,
                    amount_cents=refund_amount,
                    currency=payment.currency,
                    reason=reason,
                )

            elif payment.gateway == PaymentGateway.PAYPAL:
                # Convert to decimal string
                amount_str = f"{refund_amount / 100:.2f}"
                result = await self.paypal.refund_capture(
                    capture_id=payment.external_id,
                    amount=amount_str,
                    currency=payment.currency,
                )

            elif payment.gateway == PaymentGateway.CASH_APP:
                result = await self.cashapp.create_refund(
                    payment_id=payment.external_id,
                    amount_cents=refund_amount,
                )

            # Update payment record
            payment.refunded_amount += refund_amount

            if payment.refunded_amount >= payment.amount:
                payment.status = PaymentStatus.REFUNDED
            else:
                payment.status = PaymentStatus.PARTIAL_REFUND

            payment.gateway_response = {
                **payment.gateway_response,
                "refund": result,
            }

            await db.commit()
            return payment

        except Exception as e:
            raise PaymentError(f"Refund failed: {str(e)}")


# Singleton instance
_payment_router: Optional[PaymentRouter] = None


def get_payment_router() -> PaymentRouter:
    """Get or create payment router instance"""
    global _payment_router
    if _payment_router is None:
        _payment_router = PaymentRouter()
    return _payment_router
