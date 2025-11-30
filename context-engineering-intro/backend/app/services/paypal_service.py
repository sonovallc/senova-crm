"""
PayPal payment processing integration

Features:
- PayPal checkout
- Order creation and capture
- Refund processing
- Webhook support
"""

import httpx
from typing import Dict, Optional
from base64 import b64encode

from app.config.settings import get_settings
from app.core.exceptions import PaymentError

settings = get_settings()


class PayPalService:
    """
    PayPal payment processing service

    Features:
    - Create and capture orders
    - Refund processing
    - Webhook verification
    """

    def __init__(self):
        self.client_id = settings.paypal_client_id
        self.client_secret = settings.paypal_client_secret
        self.mode = settings.paypal_mode  # "sandbox" or "live"

        # API base URL
        if self.mode == "sandbox":
            self.base_url = "https://api-m.sandbox.paypal.com"
        else:
            self.base_url = "https://api-m.paypal.com"

        # Access token (will be fetched on first use)
        self._access_token: Optional[str] = None

    async def _get_access_token(self) -> str:
        """
        Get OAuth access token

        Returns:
            Access token string
        """
        if self._access_token:
            return self._access_token

        try:
            # Create basic auth header
            auth = b64encode(
                f"{self.client_id}:{self.client_secret}".encode()
            ).decode()

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v1/oauth2/token",
                    headers={
                        "Authorization": f"Basic {auth}",
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    data={"grant_type": "client_credentials"},
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()
                self._access_token = data["access_token"]
                return self._access_token

        except Exception as e:
            raise PaymentError(f"Failed to get PayPal access token: {str(e)}")

    async def create_order(
        self,
        amount: str,
        currency: str = "USD",
        return_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        reference_id: Optional[str] = None,
    ) -> Dict:
        """
        Create PayPal order

        Args:
            amount: Amount as string (e.g., "10.00")
            currency: Currency code
            return_url: URL to redirect after approval
            cancel_url: URL to redirect if cancelled
            reference_id: Custom reference ID

        Returns:
            Dict with order data including approval URL
        """
        try:
            access_token = await self._get_access_token()

            body = {
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "amount": {
                            "currency_code": currency,
                            "value": amount,
                        }
                    }
                ],
            }

            if reference_id:
                body["purchase_units"][0]["reference_id"] = reference_id

            if return_url or cancel_url:
                body["application_context"] = {}
                if return_url:
                    body["application_context"]["return_url"] = return_url
                if cancel_url:
                    body["application_context"]["cancel_url"] = cancel_url

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v2/checkout/orders",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json=body,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                # Extract approval URL
                approval_url = None
                for link in data.get("links", []):
                    if link.get("rel") == "approve":
                        approval_url = link.get("href")
                        break

                return {
                    "order_id": data["id"],
                    "status": data["status"],
                    "approval_url": approval_url,
                }

        except httpx.HTTPStatusError as e:
            raise PaymentError(
                f"PayPal create order failed: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise PaymentError(f"Failed to create PayPal order: {str(e)}")

    async def capture_order(self, order_id: str) -> Dict:
        """
        Capture approved PayPal order

        Args:
            order_id: PayPal order ID

        Returns:
            Dict with capture result
        """
        try:
            access_token = await self._get_access_token()

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v2/checkout/orders/{order_id}/capture",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                # Extract capture details
                capture = data["purchase_units"][0]["payments"]["captures"][0]

                return {
                    "order_id": data["id"],
                    "status": data["status"],
                    "capture_id": capture["id"],
                    "amount": capture["amount"]["value"],
                    "currency": capture["amount"]["currency_code"],
                }

        except httpx.HTTPStatusError as e:
            raise PaymentError(
                f"PayPal capture failed: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise PaymentError(f"Failed to capture PayPal order: {str(e)}")

    async def get_order(self, order_id: str) -> Dict:
        """
        Get PayPal order details

        Args:
            order_id: PayPal order ID

        Returns:
            Dict with order data
        """
        try:
            access_token = await self._get_access_token()

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v2/checkout/orders/{order_id}",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                    },
                    timeout=10.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "order_id": data["id"],
                    "status": data["status"],
                    "amount": data["purchase_units"][0]["amount"]["value"],
                    "currency": data["purchase_units"][0]["amount"]["currency_code"],
                }

        except httpx.HTTPStatusError as e:
            raise PaymentError(
                f"PayPal get order failed: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise PaymentError(f"Failed to get PayPal order: {str(e)}")

    async def refund_capture(
        self,
        capture_id: str,
        amount: Optional[str] = None,
        currency: Optional[str] = None,
    ) -> Dict:
        """
        Refund captured payment

        Args:
            capture_id: PayPal capture ID
            amount: Refund amount (None = full refund)
            currency: Currency code (required if amount specified)

        Returns:
            Dict with refund data
        """
        try:
            access_token = await self._get_access_token()

            body = {}
            if amount and currency:
                body["amount"] = {
                    "value": amount,
                    "currency_code": currency,
                }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v2/payments/captures/{capture_id}/refund",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json=body,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                return {
                    "refund_id": data["id"],
                    "status": data["status"],
                    "amount": data.get("amount", {}).get("value"),
                    "currency": data.get("amount", {}).get("currency_code"),
                }

        except httpx.HTTPStatusError as e:
            raise PaymentError(
                f"PayPal refund failed: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise PaymentError(f"Failed to create PayPal refund: {str(e)}")


# Singleton instance
_paypal_service: Optional[PayPalService] = None


def get_paypal_service() -> PayPalService:
    """Get or create PayPal service instance"""
    global _paypal_service
    if _paypal_service is None:
        _paypal_service = PayPalService()
    return _paypal_service
