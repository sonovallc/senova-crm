"""Wallet management service for credits and payments"""

from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.wallet import Wallet
from app.models.wallet_transaction import WalletTransaction
from app.models.payment_method import PaymentMethod
from app.services.stripe_payment_service import StripePaymentService
from app.core.exceptions import PaymentError, ValidationError


class WalletService:
    """Service for managing wallets and transactions"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.stripe_service = StripePaymentService(db)

    async def get_or_create_wallet(
        self,
        object_id: UUID,
        owner_type: str = "object",
        owner_user_id: Optional[UUID] = None
    ) -> Wallet:
        """
        Get existing wallet or create new one

        Args:
            object_id: Object/tenant ID
            owner_type: Type of owner ('object' or 'user')
            owner_user_id: User ID if owner_type is 'user'

        Returns:
            Wallet instance
        """
        try:
            # Try to find existing wallet
            query = select(Wallet).where(Wallet.object_id == object_id)
            if owner_type == "user" and owner_user_id:
                query = query.where(
                    Wallet.owner_type == "user",
                    Wallet.owner_user_id == owner_user_id
                )
            else:
                query = query.where(Wallet.owner_type == "object")

            result = await self.db.execute(query)
            wallet = result.scalar_one_or_none()

            if wallet:
                return wallet

            # Create new wallet
            wallet = Wallet(
                object_id=object_id,
                owner_type=owner_type,
                owner_user_id=owner_user_id if owner_type == "user" else None,
                balance=Decimal("0.00"),
                currency="USD",
                auto_recharge_enabled=False,
                auto_recharge_threshold=Decimal("10.00"),
                auto_recharge_amount=Decimal("50.00")
            )

            self.db.add(wallet)
            await self.db.commit()
            await self.db.refresh(wallet)

            return wallet

        except Exception as e:
            await self.db.rollback()
            raise PaymentError(f"Failed to get or create wallet: {str(e)}")

    async def get_wallet(self, wallet_id: UUID) -> Optional[Wallet]:
        """
        Get wallet by ID

        Args:
            wallet_id: Wallet UUID

        Returns:
            Wallet instance or None
        """
        result = await self.db.execute(
            select(Wallet)
            .options(selectinload(Wallet.payment_methods))
            .where(Wallet.id == wallet_id)
        )
        return result.scalar_one_or_none()

    async def add_funds(
        self,
        wallet_id: UUID,
        amount: Decimal,
        payment_method_id: UUID
    ) -> WalletTransaction:
        """
        Charge payment method and add funds to wallet

        Args:
            wallet_id: Wallet UUID
            amount: Amount to add
            payment_method_id: Payment method UUID

        Returns:
            WalletTransaction instance

        Raises:
            PaymentError: If charge fails
            ValidationError: If validation fails
        """
        # Validate amount
        if amount < Decimal("5.00"):
            raise ValidationError("Minimum funding amount is $5.00")
        if amount > Decimal("1000.00"):
            raise ValidationError("Maximum funding amount is $1000.00")

        try:
            # Get wallet and payment method
            result = await self.db.execute(
                select(Wallet)
                .options(selectinload(Wallet.payment_methods))
                .where(Wallet.id == wallet_id)
            )
            wallet = result.scalar_one_or_none()

            if not wallet:
                raise ValidationError("Wallet not found")

            result = await self.db.execute(
                select(PaymentMethod).where(
                    PaymentMethod.id == payment_method_id,
                    PaymentMethod.wallet_id == wallet_id,
                    PaymentMethod.is_active == True
                )
            )
            payment_method = result.scalar_one_or_none()

            if not payment_method:
                raise ValidationError("Payment method not found or inactive")

            # Create Stripe customer if not exists
            if not wallet.stripe_customer_id:
                # This would typically get email/name from the object/user
                # For now, using placeholder
                customer_id = await self.stripe_service.create_customer(
                    wallet_id=wallet_id,
                    email=f"wallet_{wallet_id}@example.com",
                    name=f"Wallet {wallet_id}"
                )
                wallet.stripe_customer_id = customer_id
                await self.db.commit()

            # Charge via Stripe
            charge_id = await self.stripe_service.charge_customer(
                stripe_customer_id=wallet.stripe_customer_id,
                amount=amount,
                description=f"Add funds to wallet {wallet_id}",
                payment_method_id=payment_method.stripe_payment_method_id,
                metadata={"wallet_id": str(wallet_id)}
            )

            # Update wallet balance
            new_balance = wallet.balance + amount
            wallet.balance = new_balance

            # Create transaction record
            transaction = WalletTransaction(
                wallet_id=wallet_id,
                transaction_type="credit_card_charge",
                amount=amount,  # Positive for credit
                balance_after=new_balance,
                description=f"Added ${amount:.2f} via {payment_method.display_name}",
                reference_type="stripe_charge",
                reference_id=charge_id,
                stripe_charge_id=charge_id
            )

            self.db.add(transaction)
            await self.db.commit()
            await self.db.refresh(transaction)

            return transaction

        except PaymentError:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise PaymentError(f"Failed to add funds: {str(e)}")

    async def deduct_funds(
        self,
        wallet_id: UUID,
        amount: Decimal,
        transaction_type: str,
        description: str,
        reference_type: Optional[str] = None,
        reference_id: Optional[str] = None
    ) -> WalletTransaction:
        """
        Deduct funds from wallet (for usage charges)

        Args:
            wallet_id: Wallet UUID
            amount: Amount to deduct (positive number)
            transaction_type: Type of transaction
            description: Transaction description
            reference_type: Optional reference type
            reference_id: Optional reference ID

        Returns:
            WalletTransaction instance

        Raises:
            ValidationError: If insufficient funds
        """
        if amount <= 0:
            raise ValidationError("Deduction amount must be positive")

        try:
            # Get wallet
            result = await self.db.execute(
                select(Wallet).where(Wallet.id == wallet_id).with_for_update()
            )
            wallet = result.scalar_one_or_none()

            if not wallet:
                raise ValidationError("Wallet not found")

            # Verify sufficient balance
            if wallet.balance < amount:
                raise ValidationError(
                    f"Insufficient funds. Balance: ${wallet.balance:.2f}, "
                    f"Required: ${amount:.2f}"
                )

            # Update wallet balance
            new_balance = wallet.balance - amount
            wallet.balance = new_balance

            # Create transaction record (negative amount for debit)
            transaction = WalletTransaction(
                wallet_id=wallet_id,
                transaction_type=transaction_type,
                amount=-amount,  # Negative for debit
                balance_after=new_balance,
                description=description,
                reference_type=reference_type,
                reference_id=reference_id
            )

            self.db.add(transaction)
            await self.db.commit()
            await self.db.refresh(transaction)

            # Check if auto-recharge is needed
            if wallet.needs_recharge:
                await self.process_auto_recharge(wallet_id)

            return transaction

        except ValidationError:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise PaymentError(f"Failed to deduct funds: {str(e)}")

    async def check_balance(self, wallet_id: UUID, required_amount: Decimal) -> bool:
        """
        Check if wallet has sufficient funds

        Args:
            wallet_id: Wallet UUID
            required_amount: Amount required

        Returns:
            True if sufficient funds available
        """
        wallet = await self.get_wallet(wallet_id)
        if not wallet:
            return False
        return wallet.balance >= required_amount

    async def process_auto_recharge(self, wallet_id: UUID) -> Optional[WalletTransaction]:
        """
        Process auto-recharge if enabled and below threshold

        Args:
            wallet_id: Wallet UUID

        Returns:
            WalletTransaction if recharge processed, None otherwise
        """
        try:
            # Get wallet with payment methods
            result = await self.db.execute(
                select(Wallet)
                .options(selectinload(Wallet.payment_methods))
                .where(Wallet.id == wallet_id)
            )
            wallet = result.scalar_one_or_none()

            if not wallet:
                return None

            # Check if auto-recharge is needed
            if not wallet.auto_recharge_enabled:
                return None

            if wallet.balance >= wallet.auto_recharge_threshold:
                return None

            # Find default payment method
            default_method = None
            for pm in wallet.payment_methods:
                if pm.is_default and pm.is_active and not pm.is_expired:
                    default_method = pm
                    break

            if not default_method:
                # No valid default payment method
                return None

            # Process auto-recharge
            return await self.add_funds(
                wallet_id=wallet_id,
                amount=wallet.auto_recharge_amount,
                payment_method_id=default_method.id
            )

        except Exception:
            # Don't fail the main transaction if auto-recharge fails
            return None

    async def get_transactions(
        self,
        wallet_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[WalletTransaction]:
        """
        Get transaction history for a wallet

        Args:
            wallet_id: Wallet UUID
            limit: Maximum number of transactions
            offset: Number of transactions to skip

        Returns:
            List of WalletTransaction instances
        """
        result = await self.db.execute(
            select(WalletTransaction)
            .where(WalletTransaction.wallet_id == wallet_id)
            .order_by(WalletTransaction.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def update_settings(
        self,
        wallet_id: UUID,
        auto_recharge_enabled: Optional[bool] = None,
        auto_recharge_threshold: Optional[Decimal] = None,
        auto_recharge_amount: Optional[Decimal] = None
    ) -> bool:
        """
        Update wallet auto-recharge settings

        Args:
            wallet_id: Wallet UUID
            auto_recharge_enabled: Enable/disable auto-recharge
            auto_recharge_threshold: New threshold amount
            auto_recharge_amount: New recharge amount

        Returns:
            True if updated successfully
        """
        try:
            result = await self.db.execute(
                select(Wallet).where(Wallet.id == wallet_id)
            )
            wallet = result.scalar_one_or_none()

            if not wallet:
                return False

            if auto_recharge_enabled is not None:
                wallet.auto_recharge_enabled = auto_recharge_enabled

            if auto_recharge_threshold is not None:
                if auto_recharge_threshold < 0 or auto_recharge_threshold > 100:
                    raise ValidationError("Threshold must be between $0 and $100")
                wallet.auto_recharge_threshold = auto_recharge_threshold

            if auto_recharge_amount is not None:
                if auto_recharge_amount < 10 or auto_recharge_amount > 500:
                    raise ValidationError("Recharge amount must be between $10 and $500")
                wallet.auto_recharge_amount = auto_recharge_amount

            await self.db.commit()
            return True

        except ValidationError:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise PaymentError(f"Failed to update wallet settings: {str(e)}")