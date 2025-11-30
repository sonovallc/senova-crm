"""
Square payment processing integration

CRITICAL NOTES:
- NEVER handle raw card data (PCI DSS violation)
- Always use Square payment tokens from client SDK
- Use idempotency keys for all payment requests
- Verify webhook signatures
"""

from square import Square
from typing import Dict, Optional
from uuid import uuid4
from decimal import Decimal

from app.config.settings import get_settings
from app.core.exceptions import PaymentError

settings = get_settings()


class SquareService:
    """
    Square payment processing service

    Features:
    - Payment processing with tokenized cards
    - Customer management
    - Card on file
    - Refund processing
    - Webhook support
    """

    def __init__(self):
        self.access_token = settings.square_access_token
        self.location_id = settings.square_location_id
        self.environment = settings.square_environment  # "sandbox" or "production"

        # Initialize Square client
        self.client = Square(
            access_token=self.access_token,
            environment=self.environment,
        )

        self.payments_api = self.client.payments
        self.customers_api = self.client.customers
        self.cards_api = self.client.cards
        self.refunds_api = self.client.refunds

    async def create_payment(
        self,
        source_id: str,
        amount_cents: int,
        currency: str = "USD",
        customer_id: Optional[str] = None,
        reference_id: Optional[str] = None,
        note: Optional[str] = None,
        autocomplete: bool = True,
    ) -> Dict:
        """
        Process payment with Square

        Args:
            source_id: Payment token from Square SDK or card_id for card on file
            amount_cents: Amount in cents (e.g., 1000 = $10.00)
            currency: Currency code (default: USD)
            customer_id: Square customer ID (optional)
            reference_id: Custom reference ID
            note: Payment note
            autocomplete: Auto-complete payment (vs delayed capture)

        Returns:
            Dict with payment result

        Raises:
            PaymentError: If payment fails
        """
        try:
            # Generate idempotency key
            idempotency_key = str(uuid4())

            body = {
                "source_id": source_id,
                "idempotency_key": idempotency_key,
                "amount_money": {
                    "amount": amount_cents,
                    "currency": currency,
                },
                "location_id": self.location_id,
                "autocomplete": autocomplete,
            }

            if customer_id:
                body["customer_id"] = customer_id

            if reference_id:
                body["reference_id"] = reference_id

            if note:
                body["note"] = note

            # Create payment
            result = self.payments_api.create_payment(body=body)

            if result.is_success():
                payment = result.body["payment"]

                return {
                    "payment_id": payment["id"],
                    "status": payment["status"],
                    "amount": payment["amount_money"]["amount"],
                    "currency": payment["amount_money"]["currency"],
                    "receipt_number": payment.get("receipt_number"),
                    "receipt_url": payment.get("receipt_url"),
                    "card_details": {
                        "brand": payment.get("card_details", {}).get("card", {}).get("card_brand"),
                        "last_4": payment.get("card_details", {}).get("card", {}).get("last_4"),
                    } if payment.get("card_details") else None,
                }
            else:
                errors = result.errors
                error_messages = [error["detail"] for error in errors]
                raise PaymentError(f"Payment failed: {', '.join(error_messages)}")

        except Exception as e:
            if isinstance(e, PaymentError):
                raise
            raise PaymentError(f"Square payment error: {str(e)}")

    async def complete_payment(self, payment_id: str) -> Dict:
        """
        Complete delayed capture payment

        Args:
            payment_id: Square payment ID

        Returns:
            Dict with completion result
        """
        try:
            result = self.payments_api.complete_payment(payment_id=payment_id)

            if result.is_success():
                payment = result.body["payment"]
                return {
                    "payment_id": payment["id"],
                    "status": payment["status"],
                    "amount": payment["amount_money"]["amount"],
                }
            else:
                errors = result.errors
                error_messages = [error["detail"] for error in errors]
                raise PaymentError(f"Complete payment failed: {', '.join(error_messages)}")

        except Exception as e:
            if isinstance(e, PaymentError):
                raise
            raise PaymentError(f"Failed to complete payment: {str(e)}")

    async def cancel_payment(self, payment_id: str) -> Dict:
        """
        Cancel payment (before completion)

        Args:
            payment_id: Square payment ID

        Returns:
            Dict with cancellation result
        """
        try:
            result = self.payments_api.cancel_payment(payment_id=payment_id)

            if result.is_success():
                payment = result.body["payment"]
                return {
                    "payment_id": payment["id"],
                    "status": payment["status"],
                }
            else:
                errors = result.errors
                error_messages = [error["detail"] for error in errors]
                raise PaymentError(f"Cancel payment failed: {', '.join(error_messages)}")

        except Exception as e:
            if isinstance(e, PaymentError):
                raise
            raise PaymentError(f"Failed to cancel payment: {str(e)}")

    async def create_refund(
        self,
        payment_id: str,
        amount_cents: int,
        currency: str = "USD",
        reason: Optional[str] = None,
    ) -> Dict:
        """
        Create refund for payment

        Args:
            payment_id: Square payment ID
            amount_cents: Refund amount in cents
            currency: Currency code
            reason: Refund reason

        Returns:
            Dict with refund data
        """
        try:
            idempotency_key = str(uuid4())

            body = {
                "idempotency_key": idempotency_key,
                "payment_id": payment_id,
                "amount_money": {
                    "amount": amount_cents,
                    "currency": currency,
                },
            }

            if reason:
                body["reason"] = reason

            result = self.refunds_api.refund_payment(body=body)

            if result.is_success():
                refund = result.body["refund"]
                return {
                    "refund_id": refund["id"],
                    "status": refund["status"],
                    "amount": refund["amount_money"]["amount"],
                    "currency": refund["amount_money"]["currency"],
                }
            else:
                errors = result.errors
                error_messages = [error["detail"] for error in errors]
                raise PaymentError(f"Refund failed: {', '.join(error_messages)}")

        except Exception as e:
            if isinstance(e, PaymentError):
                raise
            raise PaymentError(f"Failed to create refund: {str(e)}")

    async def create_customer(
        self,
        email: str,
        given_name: Optional[str] = None,
        family_name: Optional[str] = None,
        phone_number: Optional[str] = None,
        company_name: Optional[str] = None,
        reference_id: Optional[str] = None,
    ) -> Dict:
        """
        Create Square customer

        Args:
            email: Customer email
            given_name: First name
            family_name: Last name
            phone_number: Phone number
            company_name: Company name
            reference_id: Custom reference ID

        Returns:
            Dict with customer data
        """
        try:
            idempotency_key = str(uuid4())

            body = {
                "idempotency_key": idempotency_key,
                "email_address": email,
            }

            if given_name:
                body["given_name"] = given_name
            if family_name:
                body["family_name"] = family_name
            if phone_number:
                body["phone_number"] = phone_number
            if company_name:
                body["company_name"] = company_name
            if reference_id:
                body["reference_id"] = reference_id

            result = self.customers_api.create_customer(body=body)

            if result.is_success():
                customer = result.body["customer"]
                return {
                    "customer_id": customer["id"],
                    "email": customer.get("email_address"),
                    "given_name": customer.get("given_name"),
                    "family_name": customer.get("family_name"),
                }
            else:
                errors = result.errors
                error_messages = [error["detail"] for error in errors]
                raise PaymentError(f"Create customer failed: {', '.join(error_messages)}")

        except Exception as e:
            if isinstance(e, PaymentError):
                raise
            raise PaymentError(f"Failed to create customer: {str(e)}")

    async def create_card(
        self,
        customer_id: str,
        card_nonce: str,
        billing_address: Optional[Dict] = None,
        cardholder_name: Optional[str] = None,
    ) -> Dict:
        """
        Save card on file for customer

        Args:
            customer_id: Square customer ID
            card_nonce: Card token from Square SDK
            billing_address: Billing address dict
            cardholder_name: Name on card

        Returns:
            Dict with card data
        """
        try:
            idempotency_key = str(uuid4())

            body = {
                "idempotency_key": idempotency_key,
                "source_id": card_nonce,
                "card": {
                    "customer_id": customer_id,
                },
            }

            if cardholder_name:
                body["card"]["cardholder_name"] = cardholder_name

            if billing_address:
                body["card"]["billing_address"] = billing_address

            result = self.cards_api.create_card(body=body)

            if result.is_success():
                card = result.body["card"]
                return {
                    "card_id": card["id"],
                    "brand": card.get("card_brand"),
                    "last_4": card.get("last_4"),
                    "exp_month": card.get("exp_month"),
                    "exp_year": card.get("exp_year"),
                }
            else:
                errors = result.errors
                error_messages = [error["detail"] for error in errors]
                raise PaymentError(f"Create card failed: {', '.join(error_messages)}")

        except Exception as e:
            if isinstance(e, PaymentError):
                raise
            raise PaymentError(f"Failed to save card: {str(e)}")

    async def get_payment(self, payment_id: str) -> Dict:
        """
        Retrieve payment details

        Args:
            payment_id: Square payment ID

        Returns:
            Dict with payment data
        """
        try:
            result = self.payments_api.get_payment(payment_id=payment_id)

            if result.is_success():
                payment = result.body["payment"]
                return {
                    "payment_id": payment["id"],
                    "status": payment["status"],
                    "amount": payment["amount_money"]["amount"],
                    "currency": payment["amount_money"]["currency"],
                    "created_at": payment.get("created_at"),
                    "updated_at": payment.get("updated_at"),
                }
            else:
                errors = result.errors
                error_messages = [error["detail"] for error in errors]
                raise PaymentError(f"Get payment failed: {', '.join(error_messages)}")

        except Exception as e:
            if isinstance(e, PaymentError):
                raise
            raise PaymentError(f"Failed to retrieve payment: {str(e)}")


# Singleton instance
_square_service: Optional[SquareService] = None


def get_square_service() -> SquareService:
    """Get or create Square service instance"""
    global _square_service
    if _square_service is None:
        _square_service = SquareService()
    return _square_service
