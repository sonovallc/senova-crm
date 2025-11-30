"""
Stripe payment processing integration

CRITICAL NOTES:
- NEVER handle raw card data (PCI DSS violation)
- Always use Stripe tokens or payment methods
- Use idempotency keys for all payment requests
- Implement webhook signature verification
"""

import stripe
from typing import Dict, Optional
from uuid import uuid4
from decimal import Decimal

from app.config.settings import get_settings
from app.core.exceptions import PaymentError

settings = get_settings()

# Configure Stripe
stripe.api_key = settings.stripe_api_key


class StripeService:
    """
    Stripe payment processing service

    Features:
    - Payment intent creation
    - Customer management
    - Payment method storage
    - Refund processing
    - Subscription support
    """

    def __init__(self):
        self.api_key = settings.stripe_api_key
        stripe.api_key = self.api_key

    async def create_payment_intent(
        self,
        amount_cents: int,
        currency: str = "usd",
        customer_id: Optional[str] = None,
        payment_method: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict] = None,
        capture_method: str = "automatic",
    ) -> Dict:
        """
        Create Stripe payment intent

        Args:
            amount_cents: Amount in cents (e.g., 1000 = $10.00)
            currency: Currency code (default: USD)
            customer_id: Stripe customer ID (optional)
            payment_method: Payment method ID from Stripe.js
            description: Payment description
            metadata: Custom metadata dict
            capture_method: "automatic" or "manual"

        Returns:
            Dict with payment intent data

        Raises:
            PaymentError: If payment creation fails
        """
        try:
            params = {
                "amount": amount_cents,
                "currency": currency.lower(),
                "capture_method": capture_method,
            }

            if customer_id:
                params["customer"] = customer_id

            if payment_method:
                params["payment_method"] = payment_method
                params["confirm"] = True  # Auto-confirm if payment method provided

            if description:
                params["description"] = description

            if metadata:
                params["metadata"] = metadata

            # Create payment intent
            intent = stripe.PaymentIntent.create(**params)

            return {
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
                "status": intent.status,
                "amount": intent.amount,
                "currency": intent.currency,
                "requires_action": intent.status == "requires_action",
                "next_action": intent.next_action,
            }

        except stripe.error.CardError as e:
            # Card was declined
            raise PaymentError(f"Card declined: {e.user_message}")
        except stripe.error.InvalidRequestError as e:
            raise PaymentError(f"Invalid request: {str(e)}")
        except stripe.error.StripeError as e:
            raise PaymentError(f"Stripe error: {str(e)}")
        except Exception as e:
            raise PaymentError(f"Payment failed: {str(e)}")

    async def confirm_payment_intent(
        self,
        payment_intent_id: str,
        payment_method: Optional[str] = None,
    ) -> Dict:
        """
        Confirm payment intent

        Args:
            payment_intent_id: Payment intent ID
            payment_method: Payment method ID (if not already attached)

        Returns:
            Dict with payment intent status
        """
        try:
            params = {}
            if payment_method:
                params["payment_method"] = payment_method

            intent = stripe.PaymentIntent.confirm(payment_intent_id, **params)

            return {
                "payment_intent_id": intent.id,
                "status": intent.status,
                "amount": intent.amount,
                "currency": intent.currency,
            }

        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to confirm payment: {str(e)}")

    async def capture_payment_intent(self, payment_intent_id: str) -> Dict:
        """
        Capture previously authorized payment

        Args:
            payment_intent_id: Payment intent ID

        Returns:
            Dict with capture result
        """
        try:
            intent = stripe.PaymentIntent.capture(payment_intent_id)

            return {
                "payment_intent_id": intent.id,
                "status": intent.status,
                "amount_captured": intent.amount_received,
            }

        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to capture payment: {str(e)}")

    async def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        phone: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> Dict:
        """
        Create Stripe customer

        Args:
            email: Customer email
            name: Customer name
            phone: Customer phone
            metadata: Custom metadata

        Returns:
            Dict with customer data
        """
        try:
            params = {"email": email}

            if name:
                params["name"] = name
            if phone:
                params["phone"] = phone
            if metadata:
                params["metadata"] = metadata

            customer = stripe.Customer.create(**params)

            return {
                "customer_id": customer.id,
                "email": customer.email,
                "name": customer.name,
            }

        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to create customer: {str(e)}")

    async def attach_payment_method(
        self,
        payment_method_id: str,
        customer_id: str,
    ) -> Dict:
        """
        Attach payment method to customer

        Args:
            payment_method_id: Payment method ID from Stripe.js
            customer_id: Stripe customer ID

        Returns:
            Dict with payment method data
        """
        try:
            payment_method = stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id,
            )

            # Set as default payment method
            stripe.Customer.modify(
                customer_id,
                invoice_settings={"default_payment_method": payment_method_id},
            )

            return {
                "payment_method_id": payment_method.id,
                "type": payment_method.type,
                "card": {
                    "brand": payment_method.card.brand if payment_method.card else None,
                    "last4": payment_method.card.last4 if payment_method.card else None,
                    "exp_month": payment_method.card.exp_month if payment_method.card else None,
                    "exp_year": payment_method.card.exp_year if payment_method.card else None,
                },
            }

        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to attach payment method: {str(e)}")

    async def create_refund(
        self,
        payment_intent_id: str,
        amount_cents: Optional[int] = None,
        reason: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> Dict:
        """
        Create refund for payment

        Args:
            payment_intent_id: Payment intent ID to refund
            amount_cents: Refund amount in cents (None = full refund)
            reason: Refund reason ("duplicate", "fraudulent", "requested_by_customer")
            metadata: Custom metadata

        Returns:
            Dict with refund data
        """
        try:
            params = {"payment_intent": payment_intent_id}

            if amount_cents:
                params["amount"] = amount_cents

            if reason:
                params["reason"] = reason

            if metadata:
                params["metadata"] = metadata

            refund = stripe.Refund.create(**params)

            return {
                "refund_id": refund.id,
                "status": refund.status,
                "amount": refund.amount,
                "currency": refund.currency,
            }

        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to create refund: {str(e)}")

    async def get_payment_intent(self, payment_intent_id: str) -> Dict:
        """
        Retrieve payment intent

        Args:
            payment_intent_id: Payment intent ID

        Returns:
            Dict with payment intent data
        """
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            return {
                "payment_intent_id": intent.id,
                "status": intent.status,
                "amount": intent.amount,
                "currency": intent.currency,
                "customer": intent.customer,
                "payment_method": intent.payment_method,
                "created": intent.created,
            }

        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to retrieve payment: {str(e)}")

    @staticmethod
    def verify_webhook_signature(
        payload: bytes,
        signature: str,
        webhook_secret: str,
    ) -> Dict:
        """
        Verify Stripe webhook signature

        CRITICAL: Always verify webhook signatures in production

        Args:
            payload: Request body bytes
            signature: Stripe-Signature header value
            webhook_secret: Webhook signing secret

        Returns:
            Verified event dict

        Raises:
            PaymentError: If signature verification fails
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                webhook_secret,
            )
            return event

        except ValueError:
            raise PaymentError("Invalid webhook payload")
        except stripe.error.SignatureVerificationError:
            raise PaymentError("Invalid webhook signature")

    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        trial_days: Optional[int] = None,
        metadata: Optional[Dict] = None,
    ) -> Dict:
        """
        Create subscription

        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID
            trial_days: Trial period in days
            metadata: Custom metadata

        Returns:
            Dict with subscription data
        """
        try:
            params = {
                "customer": customer_id,
                "items": [{"price": price_id}],
            }

            if trial_days:
                params["trial_period_days"] = trial_days

            if metadata:
                params["metadata"] = metadata

            subscription = stripe.Subscription.create(**params)

            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_start": subscription.current_period_start,
                "current_period_end": subscription.current_period_end,
            }

        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to create subscription: {str(e)}")


# Singleton instance
_stripe_service: Optional[StripeService] = None


def get_stripe_service() -> StripeService:
    """Get or create Stripe service instance"""
    global _stripe_service
    if _stripe_service is None:
        _stripe_service = StripeService()
    return _stripe_service
