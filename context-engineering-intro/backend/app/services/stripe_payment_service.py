"""Stripe payment processing service for wallet system"""

import stripe
from typing import Optional, List, Dict
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config.settings import get_settings
from app.models.wallet import Wallet
from app.models.payment_method import PaymentMethod
from app.core.exceptions import PaymentError

settings = get_settings()

# Initialize Stripe with API key
stripe.api_key = settings.stripe_api_key if hasattr(settings, 'stripe_api_key') else ""


class StripePaymentService:
    """Service for managing Stripe payments and payment methods"""

    def __init__(self, db: AsyncSession):
        self.db = db
        # Ensure Stripe is configured
        if not stripe.api_key:
            raise PaymentError("Stripe API key not configured")

    async def create_customer(
        self,
        wallet_id: UUID,
        email: str,
        name: str,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Create a Stripe customer and return customer ID

        Args:
            wallet_id: Wallet UUID
            email: Customer email
            name: Customer name
            metadata: Additional metadata

        Returns:
            Stripe customer ID

        Raises:
            PaymentError: If customer creation fails
        """
        try:
            # Create Stripe customer
            customer_data = {
                "email": email,
                "name": name,
                "metadata": metadata or {"wallet_id": str(wallet_id)}
            }

            customer = stripe.Customer.create(**customer_data)

            # Update wallet with Stripe customer ID
            result = await self.db.execute(
                select(Wallet).where(Wallet.id == wallet_id)
            )
            wallet = result.scalar_one_or_none()

            if wallet:
                wallet.stripe_customer_id = customer.id
                await self.db.commit()

            return customer.id

        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to create Stripe customer: {str(e)}")
        except Exception as e:
            await self.db.rollback()
            raise PaymentError(f"Unexpected error creating customer: {str(e)}")

    async def add_payment_method(
        self,
        wallet_id: UUID,
        stripe_customer_id: str,
        payment_method_id: str,
        set_as_default: bool = False
    ) -> PaymentMethod:
        """
        Attach a payment method to customer and save to DB

        Args:
            wallet_id: Wallet UUID
            stripe_customer_id: Stripe customer ID
            payment_method_id: Stripe payment method ID
            set_as_default: Whether to set as default

        Returns:
            PaymentMethod instance

        Raises:
            PaymentError: If attachment fails
        """
        try:
            # Attach payment method to customer in Stripe
            pm = stripe.PaymentMethod.attach(
                payment_method_id,
                customer=stripe_customer_id
            )

            # Set as default if requested
            if set_as_default:
                stripe.Customer.modify(
                    stripe_customer_id,
                    invoice_settings={"default_payment_method": payment_method_id}
                )

                # Unset other defaults in database
                await self.db.execute(
                    update(PaymentMethod)
                    .where(PaymentMethod.wallet_id == wallet_id)
                    .values(is_default=False)
                )

            # Save to database
            payment_method = PaymentMethod(
                wallet_id=wallet_id,
                stripe_payment_method_id=payment_method_id,
                card_brand=pm.card.brand,
                card_last_four=pm.card.last4,
                card_exp_month=pm.card.exp_month,
                card_exp_year=pm.card.exp_year,
                is_default=set_as_default,
                is_active=True
            )

            self.db.add(payment_method)
            await self.db.commit()
            await self.db.refresh(payment_method)

            # Update wallet's default payment method if needed
            if set_as_default:
                result = await self.db.execute(
                    select(Wallet).where(Wallet.id == wallet_id)
                )
                wallet = result.scalar_one_or_none()
                if wallet:
                    wallet.default_payment_method_id = payment_method_id
                    await self.db.commit()

            return payment_method

        except stripe.error.StripeError as e:
            await self.db.rollback()
            raise PaymentError(f"Failed to add payment method: {str(e)}")
        except Exception as e:
            await self.db.rollback()
            raise PaymentError(f"Unexpected error adding payment method: {str(e)}")

    async def list_payment_methods(
        self,
        wallet_id: UUID
    ) -> List[PaymentMethod]:
        """
        List all payment methods for a wallet

        Args:
            wallet_id: Wallet UUID

        Returns:
            List of PaymentMethod instances
        """
        result = await self.db.execute(
            select(PaymentMethod)
            .where(
                PaymentMethod.wallet_id == wallet_id,
                PaymentMethod.is_active == True
            )
            .order_by(PaymentMethod.is_default.desc(), PaymentMethod.created_at.desc())
        )
        return result.scalars().all()

    async def delete_payment_method(self, payment_method_id: UUID) -> bool:
        """
        Remove a payment method

        Args:
            payment_method_id: Payment method UUID

        Returns:
            True if deleted successfully

        Raises:
            PaymentError: If deletion fails
        """
        try:
            # Get payment method from database
            result = await self.db.execute(
                select(PaymentMethod).where(PaymentMethod.id == payment_method_id)
            )
            payment_method = result.scalar_one_or_none()

            if not payment_method:
                return False

            # Detach from Stripe
            stripe.PaymentMethod.detach(payment_method.stripe_payment_method_id)

            # Mark as inactive in database
            payment_method.is_active = False
            await self.db.commit()

            return True

        except stripe.error.StripeError as e:
            await self.db.rollback()
            raise PaymentError(f"Failed to delete payment method: {str(e)}")
        except Exception as e:
            await self.db.rollback()
            raise PaymentError(f"Unexpected error deleting payment method: {str(e)}")

    async def set_default_payment_method(
        self,
        wallet_id: UUID,
        payment_method_id: UUID
    ) -> bool:
        """
        Set default payment method for a wallet

        Args:
            wallet_id: Wallet UUID
            payment_method_id: Payment method UUID

        Returns:
            True if set successfully
        """
        try:
            # Get wallet and payment method
            result = await self.db.execute(
                select(Wallet).where(Wallet.id == wallet_id)
            )
            wallet = result.scalar_one_or_none()

            result = await self.db.execute(
                select(PaymentMethod).where(
                    PaymentMethod.id == payment_method_id,
                    PaymentMethod.wallet_id == wallet_id
                )
            )
            payment_method = result.scalar_one_or_none()

            if not wallet or not payment_method:
                return False

            # Update Stripe
            if wallet.stripe_customer_id:
                stripe.Customer.modify(
                    wallet.stripe_customer_id,
                    invoice_settings={
                        "default_payment_method": payment_method.stripe_payment_method_id
                    }
                )

            # Update database
            await self.db.execute(
                update(PaymentMethod)
                .where(PaymentMethod.wallet_id == wallet_id)
                .values(is_default=False)
            )

            payment_method.is_default = True
            wallet.default_payment_method_id = payment_method.stripe_payment_method_id

            await self.db.commit()
            return True

        except Exception as e:
            await self.db.rollback()
            raise PaymentError(f"Failed to set default payment method: {str(e)}")

    async def charge_customer(
        self,
        stripe_customer_id: str,
        amount: Decimal,
        description: str,
        payment_method_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Charge customer and return charge ID

        Args:
            stripe_customer_id: Stripe customer ID
            amount: Amount to charge (in dollars)
            description: Charge description
            payment_method_id: Specific payment method to use
            metadata: Additional metadata

        Returns:
            Stripe charge/payment intent ID

        Raises:
            PaymentError: If charge fails
        """
        try:
            # Convert decimal dollars to integer cents
            amount_cents = int(amount * 100)

            # Create payment intent
            intent_data = {
                "amount": amount_cents,
                "currency": "usd",
                "customer": stripe_customer_id,
                "description": description,
                "confirm": True,
                "metadata": metadata or {}
            }

            if payment_method_id:
                intent_data["payment_method"] = payment_method_id
            else:
                # Use customer's default payment method
                intent_data["payment_method_types"] = ["card"]

            intent = stripe.PaymentIntent.create(**intent_data)

            if intent.status != "succeeded":
                raise PaymentError(f"Payment failed with status: {intent.status}")

            return intent.id

        except stripe.error.CardError as e:
            # Card was declined
            raise PaymentError(f"Card declined: {e.user_message}")
        except stripe.error.StripeError as e:
            raise PaymentError(f"Payment failed: {str(e)}")
        except Exception as e:
            raise PaymentError(f"Unexpected error during charge: {str(e)}")

    async def create_setup_intent(self, stripe_customer_id: str) -> str:
        """
        Create setup intent for adding a new payment method

        Args:
            stripe_customer_id: Stripe customer ID

        Returns:
            Setup intent client secret

        Raises:
            PaymentError: If setup intent creation fails
        """
        try:
            setup_intent = stripe.SetupIntent.create(
                customer=stripe_customer_id,
                payment_method_types=["card"],
                usage="off_session"
            )
            return setup_intent.client_secret

        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to create setup intent: {str(e)}")
        except Exception as e:
            raise PaymentError(f"Unexpected error creating setup intent: {str(e)}")

    async def process_refund(
        self,
        charge_id: str,
        amount: Optional[Decimal] = None,
        reason: str = "requested_by_customer"
    ) -> str:
        """
        Process a refund for a charge

        Args:
            charge_id: Stripe charge/payment intent ID
            amount: Amount to refund (None for full refund)
            reason: Refund reason

        Returns:
            Refund ID

        Raises:
            PaymentError: If refund fails
        """
        try:
            refund_data = {
                "charge": charge_id,
                "reason": reason
            }

            if amount is not None:
                # Convert to cents
                refund_data["amount"] = int(amount * 100)

            refund = stripe.Refund.create(**refund_data)
            return refund.id

        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to process refund: {str(e)}")
        except Exception as e:
            raise PaymentError(f"Unexpected error processing refund: {str(e)}")