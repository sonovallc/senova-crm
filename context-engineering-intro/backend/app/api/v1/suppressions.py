"""
Email Suppression List API endpoints

Provides endpoints for:
- Syncing suppressions from Mailgun
- Checking suppression status
- Viewing suppression list
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.email_suppression import EmailSuppression, SuppressionType
from app.services.suppression_sync import (
    SuppressionSyncService,
    is_suppressed,
    add_to_suppression,
    get_suppression_service,
)
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession

router = APIRouter(prefix="/suppressions", tags=["Email Suppressions"])


# ==================== REQUEST/RESPONSE MODELS ====================


class SuppressionResponse(BaseModel):
    """Suppression record response"""
    id: str
    email: str
    suppression_type: SuppressionType
    reason: Optional[str]
    mailgun_created_at: Optional[datetime]
    synced_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class SuppressionCheckResponse(BaseModel):
    """Response for suppression check"""
    email: str
    is_suppressed: bool
    suppression_type: Optional[SuppressionType] = None
    reason: Optional[str] = None


class SyncSuppressionsResponse(BaseModel):
    """Response for sync operation"""
    bounces: int
    unsubscribes: int
    complaints: int
    total: int


class AddSuppressionRequest(BaseModel):
    """Request to manually add suppression"""
    email: EmailStr
    suppression_type: SuppressionType
    reason: Optional[str] = None


# ==================== ENDPOINTS ====================


@router.post("/sync", response_model=SyncSuppressionsResponse)
async def sync_suppressions(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Sync all suppression lists from Mailgun.

    Fetches bounces, unsubscribes, and complaints from Mailgun
    and updates the local suppression list.

    Requires authentication.
    """
    try:
        service = get_suppression_service()
        results = await service.sync_all(db)

        return SyncSuppressionsResponse(
            bounces=results["bounces"],
            unsubscribes=results["unsubscribes"],
            complaints=results["complaints"],
            total=sum(results.values()),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync suppressions: {str(e)}"
        )


@router.get("/check/{email}", response_model=SuppressionCheckResponse)
async def check_suppression(
    email: str,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Check if an email address is suppressed.

    Args:
        email: Email address to check

    Returns:
        Suppression status and details if suppressed
    """
    email = email.lower().strip()

    result = await db.execute(
        select(EmailSuppression).where(EmailSuppression.email == email)
    )
    suppression = result.scalar_one_or_none()

    if suppression:
        return SuppressionCheckResponse(
            email=email,
            is_suppressed=True,
            suppression_type=suppression.suppression_type,
            reason=suppression.reason,
        )
    else:
        return SuppressionCheckResponse(
            email=email,
            is_suppressed=False,
        )


@router.get("/", response_model=List[SuppressionResponse])
async def list_suppressions(
    db: DatabaseSession,
    current_user: CurrentUser,
    suppression_type: Optional[SuppressionType] = Query(None, description="Filter by suppression type"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
):
    """
    List all suppressed email addresses.

    Args:
        suppression_type: Optional filter by type (bounce, unsubscribe, complaint)
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return (max 1000)

    Returns:
        List of suppression records
    """
    query = select(EmailSuppression)

    if suppression_type:
        query = query.where(EmailSuppression.suppression_type == suppression_type)

    query = query.order_by(EmailSuppression.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    suppressions = result.scalars().all()

    return [
        SuppressionResponse(
            id=str(s.id),
            email=s.email,
            suppression_type=s.suppression_type,
            reason=s.reason,
            mailgun_created_at=s.mailgun_created_at,
            synced_at=s.synced_at,
            created_at=s.created_at,
        )
        for s in suppressions
    ]


@router.get("/stats")
async def get_suppression_stats(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get statistics about suppression list.

    Returns:
        Counts by suppression type
    """
    total_query = select(func.count(EmailSuppression.id))
    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0

    bounces_query = select(func.count(EmailSuppression.id)).where(
        EmailSuppression.suppression_type == SuppressionType.BOUNCE
    )
    bounces_result = await db.execute(bounces_query)
    bounces = bounces_result.scalar() or 0

    unsubscribes_query = select(func.count(EmailSuppression.id)).where(
        EmailSuppression.suppression_type == SuppressionType.UNSUBSCRIBE
    )
    unsubscribes_result = await db.execute(unsubscribes_query)
    unsubscribes = unsubscribes_result.scalar() or 0

    complaints_query = select(func.count(EmailSuppression.id)).where(
        EmailSuppression.suppression_type == SuppressionType.COMPLAINT
    )
    complaints_result = await db.execute(complaints_query)
    complaints = complaints_result.scalar() or 0

    return {
        "total": total,
        "bounces": bounces,
        "unsubscribes": unsubscribes,
        "complaints": complaints,
    }


@router.post("/add", response_model=SuppressionResponse, status_code=status.HTTP_201_CREATED)
async def add_suppression(
    request: AddSuppressionRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Manually add an email to the suppression list.

    Args:
        request: Suppression details

    Returns:
        Created suppression record
    """
    try:
        suppression = await add_to_suppression(
            email=request.email,
            suppression_type=request.suppression_type,
            reason=request.reason,
            db=db,
        )

        return SuppressionResponse(
            id=str(suppression.id),
            email=suppression.email,
            suppression_type=suppression.suppression_type,
            reason=suppression.reason,
            mailgun_created_at=suppression.mailgun_created_at,
            synced_at=suppression.synced_at,
            created_at=suppression.created_at,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add suppression: {str(e)}"
        )


@router.delete("/{suppression_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_suppression(
    suppression_id: str,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Remove an email from the suppression list.

    Args:
        suppression_id: UUID of suppression record to remove

    Returns:
        204 No Content on success
    """
    from uuid import UUID

    try:
        suppression_uuid = UUID(suppression_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid suppression ID format"
        )

    result = await db.execute(
        select(EmailSuppression).where(EmailSuppression.id == suppression_uuid)
    )
    suppression = result.scalar_one_or_none()

    if not suppression:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suppression record not found"
        )

    await db.delete(suppression)
    await db.commit()

    return None
