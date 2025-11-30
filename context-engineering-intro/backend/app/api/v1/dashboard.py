"""Dashboard statistics API endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select, func
from typing import Optional

from app.api.dependencies import DatabaseSession, CurrentUser
from app.models.contact import Contact, ContactStatus
from app.models.communication import Communication
from app.models.contact_activity import ContactActivity


router = APIRouter(tags=["Dashboard"])


class DashboardStats(BaseModel):
    """Dashboard statistics response model."""
    total_contacts: int = 0
    active_contacts: int = 0
    leads: int = 0
    prospects: int = 0
    customers: int = 0
    inactive_contacts: int = 0
    total_communications: int = 0
    recent_activity_count: int = 0


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: DatabaseSession,
    current_user: CurrentUser,
) -> DashboardStats:
    """
    Get dashboard statistics.

    Returns counts of contacts by status, communications, and recent activity.
    """
    # Count total contacts (excluding deleted)
    total_query = select(func.count(Contact.id)).where(Contact.is_deleted.is_(False))
    total_result = await db.execute(total_query)
    total_contacts = total_result.scalar_one()

    # Count contacts by status
    lead_query = select(func.count(Contact.id)).where(
        Contact.is_deleted.is_(False),
        Contact.status == ContactStatus.LEAD
    )
    lead_result = await db.execute(lead_query)
    leads = lead_result.scalar_one()

    prospect_query = select(func.count(Contact.id)).where(
        Contact.is_deleted.is_(False),
        Contact.status == ContactStatus.PROSPECT
    )
    prospect_result = await db.execute(prospect_query)
    prospects = prospect_result.scalar_one()

    customer_query = select(func.count(Contact.id)).where(
        Contact.is_deleted.is_(False),
        Contact.status == ContactStatus.CUSTOMER
    )
    customer_result = await db.execute(customer_query)
    customers = customer_result.scalar_one()

    inactive_query = select(func.count(Contact.id)).where(
        Contact.is_deleted.is_(False),
        Contact.status == ContactStatus.INACTIVE
    )
    inactive_result = await db.execute(inactive_query)
    inactive_contacts = inactive_result.scalar_one()

    # Active contacts = all non-inactive
    active_contacts = total_contacts - inactive_contacts

    # Count total communications
    comm_query = select(func.count(Communication.id))
    comm_result = await db.execute(comm_query)
    total_communications = comm_result.scalar_one()

    # Count recent activity (last 7 days)
    from datetime import datetime, timedelta
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    activity_query = select(func.count(ContactActivity.id)).where(
        ContactActivity.created_at >= seven_days_ago
    )
    activity_result = await db.execute(activity_query)
    recent_activity_count = activity_result.scalar_one()

    return DashboardStats(
        total_contacts=total_contacts,
        active_contacts=active_contacts,
        leads=leads,
        prospects=prospects,
        customers=customers,
        inactive_contacts=inactive_contacts,
        total_communications=total_communications,
        recent_activity_count=recent_activity_count,
    )
