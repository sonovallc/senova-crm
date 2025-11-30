"""
Cash App Pay integration

CRITICAL NOTES:
- Use Cash App SDK on client side to generate tokens
- Backend processes tokenized payments only
- Webhook verification required for production
"""

import httpx
from typing import Dict, Optional
from uuid import uuid4

from app.config.settings import get_settings
from app.core.exceptions import PaymentError

settings = get_settings()


class CashAppService:
    """
    Cash App Pay integration service

    Features:
    - Process tokenized Cash App payments
    - QR code payment support
    - Refund processing
    """

    def __init__(self):
        self.api_key = settings.cashapp_api_key
        self.base_url = "https://api.cash.app/v1"  # Placeholder URL

    async def create_payment(
        self,
        customer_token: str,
        amount_cents: int,
        currency: str = "USD",
        reference_id: Optional[str] = None,
        note: Optional[str] = None,
    ) -> Dict:
        """
        Process Cash App payment

        Args:
            customer_token: Cash App customer token from SDK
            amount_cents: Amount in cents
            currency: Currency code
            reference_id: Custom reference ID
            note: Payment note

        Returns:
            Dict with payment result

        Raises:
            PaymentError: If payment fails
        """
        try:
            idempotency_key = str(uuid4())

            payload = {
                "idempotency_key": idempotency_key,
                "customer_token": customer_token,
                "amount": {
                    "amount": amount_cents,
                    "currency": currency,
                },
            }

            if reference_id:
                payload["reference_id"] = reference_id

            if note:
                payload["note"] = note

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/payments",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "payment_id": data.get("id"),
                    "status": data.get("status"),
                    "amount": amount_cents,
                    "currency": currency,
                    "customer_token": customer_token,
                }

        except httpx.HTTPStatusError as e:
            raise PaymentError(
                f"Cash App payment failed: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise PaymentError(f"Failed to process Cash App payment: {str(e)}")

    async def create_qr_code(
        self,
        amount_cents: int,
        currency: str = "USD",
        note: Optional[str] = None,
    ) -> Dict:
        """
        Generate Cash App QR code for payment

        Args:
            amount_cents: Amount in cents
            currency: Currency code
            note: Payment note

        Returns:
            Dict with QR code data
        """
        try:
            payload = {
                "amount": {
                    "amount": amount_cents,
                    "currency": currency,
                },
            }

            if note:
                payload["note"] = note

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/qr-codes",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "qr_code_id": data.get("id"),
                    "qr_code_url": data.get("qr_code_url"),
                    "deep_link": data.get("deep_link"),
                    "amount": amount_cents,
                    "currency": currency,
                }

        except httpx.HTTPStatusError as e:
            raise PaymentError(
                f"Cash App QR code creation failed: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise PaymentError(f"Failed to create QR code: {str(e)}")

    async def get_payment(self, payment_id: str) -> Dict:
        """
        Get Cash App payment details

        Args:
            payment_id: Payment ID

        Returns:
            Dict with payment data
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/payments/{payment_id}",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                    },
                    timeout=10.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "payment_id": data.get("id"),
                    "status": data.get("status"),
                    "amount": data.get("amount", {}).get("amount"),
                    "currency": data.get("amount", {}).get("currency"),
                }

        except httpx.HTTPStatusError as e:
            raise PaymentError(
                f"Cash App get payment failed: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise PaymentError(f"Failed to get Cash App payment: {str(e)}")

    async def create_refund(
        self,
        payment_id: str,
        amount_cents: Optional[int] = None,
    ) -> Dict:
        """
        Create refund for Cash App payment

        Args:
            payment_id: Original payment ID
            amount_cents: Refund amount (None = full refund)

        Returns:
            Dict with refund data
        """
        try:
            payload = {"payment_id": payment_id}

            if amount_cents:
                payload["amount"] = amount_cents

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/refunds",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "refund_id": data.get("id"),
                    "status": data.get("status"),
                    "amount": data.get("amount"),
                }

        except httpx.HTTPStatusError as e:
            raise PaymentError(
                f"Cash App refund failed: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise PaymentError(f"Failed to create refund: {str(e)}")


# Singleton instance
_cashapp_service: Optional[CashAppService] = None


def get_cashapp_service() -> CashAppService:
    """Get or create Cash App service instance"""
    global _cashapp_service
    if _cashapp_service is None:
        _cashapp_service = CashAppService()
    return _cashapp_service
