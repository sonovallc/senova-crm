"""Wallet Management API endpoints for credit-based billing"""

from typing import List, Optional, Literal
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentUser, DatabaseSession
from app.models.user import UserRole
from app.schemas.wallet import (
    WalletResponse,
    WalletWithPaymentMethods,
    WalletFundRequest,
    WalletSettingsUpdate,
    WalletTransactionResponse,
    WalletTransactionListResponse,
    WalletBalanceResponse
)
from app.services.wallet_service import WalletService
from app.services.object_service import ObjectService
from app.core.exceptions import (
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
    PaymentError
)

router = APIRouter(prefix="/wallets", tags=["Wallets"])


@router.get("/{owner_type}/{owner_id}", response_model=WalletResponse)
async def get_wallet(
    owner_type: Literal["object", "user"],
    owner_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> WalletResponse:
    """
    Get wallet for an object or user

    Creates wallet if it doesn't exist.
    Users can only access wallets they have permission for.

    Args:
        owner_type: "object" or "user"
        owner_id: UUID of the object or user

    Returns:
        Wallet information including balance and settings

    Raises:
        403: No permission to access this wallet
        404: Owner not found
    """
    # Validate access based on owner type
    if owner_type == "object":
        # Check if user has access to the object
        object_service = ObjectService(db)
        try:
            await object_service.get_object(current_user, owner_id)
        except NotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Object {owner_id} not found"
            )
        except PermissionDeniedError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this object's wallet"
            )
        object_id = owner_id
        owner_user_id = None
    else:  # owner_type == "user"
        # Users can only access their own wallet or if they're an admin/owner
        if str(owner_id) != str(current_user.id) and current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own wallet"
            )
        # Get the user's primary object (assuming one object per user for now)
        # TODO: Handle multiple objects per user
        object_service = ObjectService(db)
        objects, _ = await object_service.list_objects(current_user, limit=1)
        if not objects:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No object found for user"
            )
        object_id = objects[0].id
        owner_user_id = owner_id

    # Get or create wallet
    service = WalletService(db)
    wallet = await service.get_or_create_wallet(
        object_id=object_id,
        owner_type=owner_type,
        owner_user_id=owner_user_id
    )

    return WalletResponse.model_validate(wallet)


@router.post("/{owner_type}/{owner_id}/fund", response_model=WalletTransactionResponse)
async def fund_wallet(
    fund_request: WalletFundRequest,
    owner_type: Literal["object", "user"],
    owner_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> WalletTransactionResponse:
    """
    Add funds to a wallet

    Only wallet owners can add funds.
    Processes payment through Stripe and credits wallet.

    Args:
        fund_request: Amount and payment method
        owner_type: "object" or "user"
        owner_id: UUID of the owner

    Returns:
        Transaction details

    Raises:
        403: Not the wallet owner
        404: Wallet or payment method not found
        400: Payment failed
    """
    # Only owners can fund wallets
    if current_user.role != UserRole.OWNER:
        # Regular users can fund their own wallet
        if owner_type != "user" or str(owner_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only wallet owners can add funds"
            )

    # Get wallet (verifies access)
    wallet_response = await get_wallet(owner_type, owner_id, current_user, db)

    # Process funding
    service = WalletService(db)
    try:
        transaction = await service.add_funds(
            wallet_id=UUID(str(wallet_response.id)),
            amount=fund_request.amount,
            payment_method_id=fund_request.payment_method_id,
            description=fund_request.description
        )

        return WalletTransactionResponse.model_validate(transaction)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PaymentError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment failed: {str(e)}"
        )


@router.get("/{owner_type}/{owner_id}/transactions", response_model=WalletTransactionListResponse)
async def get_wallet_transactions(
    owner_type: Literal["object", "user"],
    owner_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    limit: int = 50,
    offset: int = 0
) -> WalletTransactionListResponse:
    """
    Get transaction history for a wallet

    Returns paginated list of all wallet transactions.

    Args:
        owner_type: "object" or "user"
        owner_id: UUID of the owner
        limit: Max transactions to return (default 50, max 100)
        offset: Number of transactions to skip

    Returns:
        List of transactions with pagination info

    Raises:
        403: No permission to access this wallet
        404: Wallet not found
    """
    # Get wallet (verifies access)
    wallet_response = await get_wallet(owner_type, owner_id, current_user, db)

    # Get transactions
    service = WalletService(db)
    transactions, total = await service.get_transactions(
        wallet_id=UUID(str(wallet_response.id)),
        limit=limit,
        offset=offset
    )

    return WalletTransactionListResponse(
        transactions=[WalletTransactionResponse.model_validate(t) for t in transactions],
        total=total,
        limit=limit,
        offset=offset
    )


@router.patch("/{owner_type}/{owner_id}/settings", response_model=WalletResponse)
async def update_wallet_settings(
    settings: WalletSettingsUpdate,
    owner_type: Literal["object", "user"],
    owner_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> WalletResponse:
    """
    Update auto-recharge settings for a wallet

    Only wallet owners can update settings.

    Args:
        settings: New auto-recharge settings
        owner_type: "object" or "user"
        owner_id: UUID of the owner

    Returns:
        Updated wallet information

    Raises:
        403: Not the wallet owner
        404: Wallet not found
        400: Invalid settings
    """
    # Only owners can update wallet settings
    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only wallet owners can update settings"
        )

    # Get wallet (verifies access)
    wallet_response = await get_wallet(owner_type, owner_id, current_user, db)

    # Update settings
    service = WalletService(db)
    try:
        wallet = await service.update_auto_recharge(
            wallet_id=UUID(str(wallet_response.id)),
            auto_recharge_enabled=settings.auto_recharge_enabled,
            auto_recharge_threshold=settings.auto_recharge_threshold,
            auto_recharge_amount=settings.auto_recharge_amount
        )

        return WalletResponse.model_validate(wallet)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{owner_type}/{owner_id}/balance", response_model=WalletBalanceResponse)
async def get_wallet_balance(
    owner_type: Literal["object", "user"],
    owner_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> WalletBalanceResponse:
    """
    Quick balance check for a wallet

    Returns just the current balance and currency.

    Args:
        owner_type: "object" or "user"
        owner_id: UUID of the owner

    Returns:
        Current balance and currency

    Raises:
        403: No permission to access this wallet
        404: Wallet not found
    """
    # Get wallet (verifies access)
    wallet_response = await get_wallet(owner_type, owner_id, current_user, db)

    return WalletBalanceResponse(
        balance=str(wallet_response.balance),
        currency=wallet_response.currency
    )