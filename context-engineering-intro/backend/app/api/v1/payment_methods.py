"""Payment Methods API endpoints for managing Stripe payment methods"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentUser, DatabaseSession
from app.models.user import UserRole
from app.schemas.payment_method import (
    PaymentMethodCreate,
    PaymentMethodResponse,
    PaymentMethodListResponse,
    PaymentMethodDeleteResponse,
    SetupIntentRequest,
    SetupIntentResponse
)
from app.services.wallet_service import WalletService
from app.services.stripe_payment_service import StripePaymentService
from app.core.exceptions import (
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
    PaymentError
)

router = APIRouter(prefix="/payment-methods", tags=["Payment Methods"])


@router.get("/{wallet_id}", response_model=PaymentMethodListResponse)
async def list_payment_methods(
    wallet_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> PaymentMethodListResponse:
    """
    List all payment methods for a wallet

    Users can only view payment methods for wallets they have access to.

    Args:
        wallet_id: UUID of the wallet

    Returns:
        List of payment methods with default method indicated

    Raises:
        403: No permission to access this wallet
        404: Wallet not found
    """
    # Get wallet and verify access
    wallet_service = WalletService(db)
    wallet = await wallet_service.get_wallet_by_id(wallet_id)

    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found"
        )

    # Check permission based on wallet ownership
    if wallet.owner_type == "user":
        # User wallets - only the user or admins can view
        if (str(wallet.owner_user_id) != str(current_user.id) and
            current_user.role not in [UserRole.OWNER, UserRole.ADMIN]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view these payment methods"
            )
    else:  # object wallet
        # Object wallets - check object access
        from app.services.object_service import ObjectService
        object_service = ObjectService(db)
        try:
            await object_service.get_object(current_user, wallet.object_id)
        except (NotFoundError, PermissionDeniedError):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view these payment methods"
            )

    # Get payment methods
    payment_methods = await wallet_service.get_payment_methods(wallet_id)

    # Find default method
    default_method_id = None
    for method in payment_methods:
        if method.is_default:
            default_method_id = method.id
            break

    return PaymentMethodListResponse(
        payment_methods=[PaymentMethodResponse.model_validate(m) for m in payment_methods],
        default_method_id=default_method_id,
        total=len(payment_methods)
    )


@router.post("/{wallet_id}/setup", response_model=SetupIntentResponse)
async def create_setup_intent(
    wallet_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> SetupIntentResponse:
    """
    Create Stripe SetupIntent for adding new card

    Creates a SetupIntent to securely collect card details on the frontend.
    Only wallet owners can add payment methods.

    Args:
        wallet_id: UUID of the wallet

    Returns:
        SetupIntent client secret for Stripe.js

    Raises:
        403: Not the wallet owner
        404: Wallet not found
        400: Stripe error
    """
    # Only owners can add payment methods
    if current_user.role != UserRole.OWNER:
        # Regular users can add to their own wallet
        wallet_service = WalletService(db)
        wallet = await wallet_service.get_wallet_by_id(wallet_id)

        if not wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wallet not found"
            )

        if wallet.owner_type != "user" or str(wallet.owner_user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only wallet owners can add payment methods"
            )

    # Create SetupIntent through Stripe service
    stripe_service = StripePaymentService(db)
    try:
        setup_intent = await stripe_service.create_setup_intent(wallet_id)

        return SetupIntentResponse(
            client_secret=setup_intent["client_secret"],
            wallet_id=wallet_id,
            stripe_customer_id=setup_intent["customer_id"]
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PaymentError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )


@router.post("/{wallet_id}", response_model=PaymentMethodResponse)
async def add_payment_method(
    payment_method: PaymentMethodCreate,
    wallet_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> PaymentMethodResponse:
    """
    Add a payment method after Stripe.js confirms it

    After the frontend confirms the SetupIntent with Stripe.js,
    call this endpoint to save the payment method to the wallet.

    Args:
        payment_method: Stripe payment method ID (pm_xxx)
        wallet_id: UUID of the wallet

    Returns:
        Saved payment method details

    Raises:
        403: Not the wallet owner
        404: Wallet not found
        400: Invalid payment method or Stripe error
    """
    # Only owners can add payment methods
    if current_user.role != UserRole.OWNER:
        # Regular users can add to their own wallet
        wallet_service = WalletService(db)
        wallet = await wallet_service.get_wallet_by_id(wallet_id)

        if not wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wallet not found"
            )

        if wallet.owner_type != "user" or str(wallet.owner_user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only wallet owners can add payment methods"
            )

    # Add payment method through wallet service
    wallet_service = WalletService(db)
    try:
        saved_method = await wallet_service.add_payment_method(
            wallet_id=wallet_id,
            stripe_payment_method_id=payment_method.payment_method_id
        )

        return PaymentMethodResponse.model_validate(saved_method)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PaymentError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add payment method: {str(e)}"
        )


@router.delete("/{id}", response_model=PaymentMethodDeleteResponse)
async def delete_payment_method(
    id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> PaymentMethodDeleteResponse:
    """
    Remove a payment method

    Only wallet owners can remove payment methods.
    Cannot remove the default payment method if auto-recharge is enabled.

    Args:
        id: UUID of the payment method

    Returns:
        Success confirmation

    Raises:
        403: Not the wallet owner
        404: Payment method not found
        400: Cannot remove default method with auto-recharge enabled
    """
    # Get payment method and wallet
    wallet_service = WalletService(db)
    payment_method = await wallet_service.get_payment_method_by_id(id)

    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )

    # Get wallet to check ownership
    wallet = await wallet_service.get_wallet_by_id(payment_method.wallet_id)

    # Only owners can remove payment methods
    if current_user.role != UserRole.OWNER:
        # Regular users can remove from their own wallet
        if wallet.owner_type != "user" or str(wallet.owner_user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only wallet owners can remove payment methods"
            )

    # Check if it's the default method with auto-recharge enabled
    if payment_method.is_default and wallet.auto_recharge_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove default payment method while auto-recharge is enabled. Disable auto-recharge first."
        )

    # Remove payment method
    try:
        await wallet_service.remove_payment_method(id)

        return PaymentMethodDeleteResponse(
            success=True,
            message="Payment method removed successfully",
            deleted_id=id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove payment method: {str(e)}"
        )


@router.post("/{id}/default", response_model=PaymentMethodResponse)
async def set_default_payment_method(
    id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession
) -> PaymentMethodResponse:
    """
    Set as default payment method

    Only wallet owners can change the default payment method.

    Args:
        id: UUID of the payment method

    Returns:
        Updated payment method details

    Raises:
        403: Not the wallet owner
        404: Payment method not found
    """
    # Get payment method and wallet
    wallet_service = WalletService(db)
    payment_method = await wallet_service.get_payment_method_by_id(id)

    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )

    # Get wallet to check ownership
    wallet = await wallet_service.get_wallet_by_id(payment_method.wallet_id)

    # Only owners can change default payment method
    if current_user.role != UserRole.OWNER:
        # Regular users can change default for their own wallet
        if wallet.owner_type != "user" or str(wallet.owner_user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only wallet owners can change default payment method"
            )

    # Set as default
    try:
        updated_method = await wallet_service.set_default_payment_method(id)

        return PaymentMethodResponse.model_validate(updated_method)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )