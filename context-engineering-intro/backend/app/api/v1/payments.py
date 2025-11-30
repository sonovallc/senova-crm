"""
Payment API endpoints

Features:
- Process payments through multiple gateways
- Payment history
- Refund processing
- Payment method management
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.payment import Payment, PaymentGateway, PaymentStatus
from app.models.contact import Contact
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentList,
    RefundRequest,
)
from app.services.payment_router import get_payment_router
from app.core.exceptions import NotFoundError, ValidationError, PaymentError

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/process", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def process_payment(
    data: PaymentCreate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Process payment through payment gateway

    Supports:
    - Stripe
    - Square
    - PayPal
    - Cash App

    Automatically selects gateway or uses specified one
    Implements fallback logic if primary gateway fails
    """
    # Validate contact exists
    contact = await db.get(Contact, data.contact_id)
    if not contact:
        raise NotFoundError(f"Contact {data.contact_id} not found")

    # Validate amount
    if data.amount_cents <= 0:
        raise ValidationError("Amount must be greater than 0")

    # Process payment through router
    payment_router = get_payment_router()

    try:
        payment = await payment_router.process_payment(
            contact_id=data.contact_id,
            amount_cents=data.amount_cents,
            currency=data.currency,
            payment_method_token=data.payment_method_token,
            gateway=data.gateway,
            description=data.description,
            metadata=data.metadata,
            db=db,
        )

        return PaymentResponse.model_validate(payment)

    except PaymentError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("", response_model=PaymentList)
async def get_payments(
    db: DatabaseSession,
    current_user: CurrentUser,
    contact_id: Optional[UUID] = Query(None, description="Filter by contact"),
    gateway: Optional[PaymentGateway] = Query(None, description="Filter by gateway"),
    status_filter: Optional[PaymentStatus] = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Get payment history with filtering options

    Returns paginated list of payments
    """
    # Build query
    query = select(Payment).options(
        selectinload(Payment.contact),
    )

    # Apply filters
    filters = []

    if contact_id:
        filters.append(Payment.contact_id == contact_id)

    if gateway:
        filters.append(Payment.gateway == gateway)

    if status_filter:
        filters.append(Payment.status == status_filter)

    if filters:
        query = query.where(and_(*filters))

    # Order by newest first
    query = query.order_by(Payment.created_at.desc())

    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(Payment).where(and_(*filters) if filters else True)
    )
    total = count_result.scalar()

    # Apply pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    result = await db.execute(query)
    payments = result.scalars().all()

    return PaymentList(
        items=[PaymentResponse.model_validate(p) for p in payments],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Get single payment by ID"""
    payment = await db.get(Payment, payment_id)

    if not payment:
        raise NotFoundError(f"Payment {payment_id} not found")

    return PaymentResponse.model_validate(payment)


@router.post("/{payment_id}/refund", response_model=PaymentResponse)
async def refund_payment(
    payment_id: UUID,
    refund_data: RefundRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Refund payment (full or partial)

    Supports:
    - Full refund (no amount specified)
    - Partial refund (amount specified)
    """
    # Get payment
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise NotFoundError(f"Payment {payment_id} not found")

    # Check if can refund
    if not payment.can_refund:
        raise ValidationError(f"Payment cannot be refunded (status: {payment.status})")

    # Validate refund amount
    if refund_data.amount_cents:
        if refund_data.amount_cents <= 0:
            raise ValidationError("Refund amount must be greater than 0")

        max_refund = payment.amount - payment.refunded_amount
        if refund_data.amount_cents > max_refund:
            raise ValidationError(
                f"Refund amount ({refund_data.amount_cents}) exceeds available amount ({max_refund})"
            )

    # Process refund
    payment_router = get_payment_router()

    try:
        updated_payment = await payment_router.refund_payment(
            payment_id=payment_id,
            amount_cents=refund_data.amount_cents,
            reason=refund_data.reason,
            db=db,
        )

        return PaymentResponse.model_validate(updated_payment)

    except PaymentError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/contact/{contact_id}", response_model=PaymentList)
async def get_contact_payments(
    contact_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Get all payments for a specific contact

    Returns payment history for contact
    """
    # Validate contact exists
    contact = await db.get(Contact, contact_id)
    if not contact:
        raise NotFoundError(f"Contact {contact_id} not found")

    # Get payments
    query = (
        select(Payment)
        .where(Payment.contact_id == contact_id)
        .order_by(Payment.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    payments = result.scalars().all()

    # Get total count
    count_result = await db.execute(
        select(func.count()).where(Payment.contact_id == contact_id)
    )
    total = count_result.scalar()

    return PaymentList(
        items=[PaymentResponse.model_validate(p) for p in payments],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/stats/summary", response_model=dict)
async def get_payment_stats(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get payment statistics

    Returns summary of payments by gateway and status
    """
    # Get total payments
    total_result = await db.execute(select(func.count()).select_from(Payment))
    total_payments = total_result.scalar()

    # Get total revenue (completed payments only)
    revenue_result = await db.execute(
        select(func.sum(Payment.amount)).where(
            Payment.status.in_([PaymentStatus.COMPLETED, PaymentStatus.APPROVED])
        )
    )
    total_revenue = revenue_result.scalar() or 0

    # Get total refunds
    refund_result = await db.execute(
        select(func.sum(Payment.refunded_amount))
    )
    total_refunded = refund_result.scalar() or 0

    # Get counts by gateway
    gateway_stats = {}
    for gateway in PaymentGateway:
        count_result = await db.execute(
            select(func.count()).where(Payment.gateway == gateway)
        )
        gateway_stats[gateway.value] = count_result.scalar()

    # Get counts by status
    status_stats = {}
    for payment_status in PaymentStatus:
        count_result = await db.execute(
            select(func.count()).where(Payment.status == payment_status)
        )
        status_stats[payment_status.value] = count_result.scalar()

    return {
        "total_payments": total_payments,
        "total_revenue_cents": total_revenue,
        "total_revenue_dollars": total_revenue / 100.0,
        "total_refunded_cents": total_refunded,
        "total_refunded_dollars": total_refunded / 100.0,
        "net_revenue_cents": total_revenue - total_refunded,
        "net_revenue_dollars": (total_revenue - total_refunded) / 100.0,
        "by_gateway": gateway_stats,
        "by_status": status_stats,
    }
