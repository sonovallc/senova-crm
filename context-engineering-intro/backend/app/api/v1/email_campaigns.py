"""
Email Campaigns API endpoints

Features:
- Create/update/delete campaigns
- List campaigns with filtering
- Filter contacts for recipients
- Schedule and send campaigns
- View campaign statistics
- Manage campaign recipients
- Unsubscribe handling
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
import math
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.user import User
from app.models.email_campaign import EmailCampaign, CampaignRecipient, CampaignStatus, CampaignRecipientStatus
from app.models.email_templates import EmailTemplate
from app.models.contact import Contact
from app.models.contact_tag import ContactTag
from app.schemas.email_campaigns import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignList,
    CampaignListItem,
    RecipientResponse,
    RecipientList,
    ContactFilterRequest,
    ContactFilterResponse,
    ScheduleCampaignRequest,
    SendCampaignRequest,
    CampaignStatsResponse,
    UnsubscribeRequest,
    UnsubscribeResponse,
)
from app.core.exceptions import NotFoundError, ValidationError
from app.services.email_campaign_service import send_campaign_batch

router = APIRouter(prefix="/campaigns", tags=["Email Campaigns"])


# Helper Functions
def calculate_rates(campaign: EmailCampaign) -> dict:
    """Calculate campaign performance rates"""
    delivery_rate = (campaign.delivered_count / campaign.sent_count * 100) if campaign.sent_count > 0 else 0
    open_rate = (campaign.opened_count / campaign.delivered_count * 100) if campaign.delivered_count > 0 else 0
    click_rate = (campaign.clicked_count / campaign.opened_count * 100) if campaign.opened_count > 0 else 0
    bounce_rate = (campaign.bounced_count / campaign.sent_count * 100) if campaign.sent_count > 0 else 0

    return {
        "delivery_rate": round(delivery_rate, 2),
        "open_rate": round(open_rate, 2),
        "click_rate": round(click_rate, 2),
        "bounce_rate": round(bounce_rate, 2),
    }


async def filter_contacts_query(
    db: AsyncSession,
    user_id: UUID,
    filter_params: dict
) -> List[Contact]:
    """
    Filter contacts based on criteria.

    Returns list of contacts matching the filter.
    Note: Contacts are not user-scoped, so we filter by deleted_at IS NULL instead.
    """
    query = select(Contact).where(Contact.deleted_at.is_(None))

    # Filter by tags
    if filter_params.get('tags') or filter_params.get('tag_ids'):
        # Join with contact_tags to filter by tags
        if filter_params.get('tag_ids'):
            tag_ids = filter_params['tag_ids']
            query = query.join(ContactTag).where(ContactTag.tag_id.in_(tag_ids))

    # Filter by status
    if filter_params.get('status'):
        query = query.where(Contact.status == filter_params['status'])

    # Filter by date range
    if filter_params.get('date_added_start'):
        query = query.where(Contact.created_at >= filter_params['date_added_start'])
    if filter_params.get('date_added_end'):
        query = query.where(Contact.created_at <= filter_params['date_added_end'])

    # Filter by assigned user
    if filter_params.get('assigned_user_id'):
        query = query.where(Contact.assigned_user_id == filter_params['assigned_user_id'])

    # Only contacts with email
    if filter_params.get('has_email', True):
        query = query.where(Contact.email.isnot(None), Contact.email != '')

    # Exclude unsubscribed
    if filter_params.get('exclude_unsubscribed', True):
        query = query.where(Contact.unsubscribed == False)

    result = await db.execute(query)
    contacts = result.scalars().all()

    return contacts


# Campaign Management Endpoints
@router.get("", response_model=CampaignList)
async def list_campaigns(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all campaigns for current user with pagination and filtering.
    """
    # Build query
    query = select(EmailCampaign).where(EmailCampaign.user_id == current_user.id)

    # Filter by status
    if status:
        try:
            status_enum = CampaignStatus(status)
            query = query.where(EmailCampaign.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status}"
            )

    # Search by name
    if search:
        query = query.where(EmailCampaign.name.ilike(f"%{search}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Order by created_at descending
    query = query.order_by(desc(EmailCampaign.created_at))

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute
    result = await db.execute(query)
    campaigns = result.scalars().all()

    # Build response with calculated rates
    campaign_items = []
    for campaign in campaigns:
        rates = calculate_rates(campaign)
        item = CampaignListItem(
            id=campaign.id,
            name=campaign.name,
            subject=campaign.subject,
            status=campaign.status,
            recipient_count=campaign.recipient_count,
            sent_count=campaign.sent_count,
            delivered_count=campaign.delivered_count,
            opened_count=campaign.opened_count,
            clicked_count=campaign.clicked_count,
            scheduled_at=campaign.scheduled_at,
            started_at=campaign.started_at,
            completed_at=campaign.completed_at,
            created_at=campaign.created_at,
            delivery_rate=rates['delivery_rate'],
            open_rate=rates['open_rate'],
            click_rate=rates['click_rate'],
        )
        campaign_items.append(item)

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return CampaignList(
        campaigns=campaign_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get single campaign by ID with full details.
    """
    query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    rates = calculate_rates(campaign)

    return CampaignResponse(
        id=campaign.id,
        user_id=campaign.user_id,
        name=campaign.name,
        subject=campaign.subject,
        template_id=campaign.template_id,
        body_html=campaign.body_html,
        body_text=campaign.body_text,
        recipient_filter=campaign.recipient_filter,
        recipient_count=campaign.recipient_count,
        status=campaign.status,
        scheduled_at=campaign.scheduled_at,
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        sent_count=campaign.sent_count,
        delivered_count=campaign.delivered_count,
        opened_count=campaign.opened_count,
        clicked_count=campaign.clicked_count,
        bounced_count=campaign.bounced_count,
        failed_count=campaign.failed_count,
        unsubscribed_count=campaign.unsubscribed_count,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        delivery_rate=rates['delivery_rate'],
        open_rate=rates['open_rate'],
        click_rate=rates['click_rate'],
        bounce_rate=rates['bounce_rate'],
    )


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign_data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create new campaign (starts as draft).
    """
    # If template_id provided, fetch template
    body_html = campaign_data.body_html
    body_text = campaign_data.body_text

    if campaign_data.template_id:
        template_query = select(EmailTemplate).where(EmailTemplate.id == campaign_data.template_id)
        template_result = await db.execute(template_query)
        template = template_result.scalar_one_or_none()

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )

        # Use template content
        body_html = template.body_html
        body_text = None  # Can add plain text extraction later

    # Validate content
    if not body_html:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign must have content (from template or body_html)"
        )

    # Filter contacts to get recipient count
    contacts = await filter_contacts_query(
        db,
        current_user.id,
        campaign_data.recipient_filter
    )
    recipient_count = len(contacts)

    # Create campaign
    campaign = EmailCampaign(
        user_id=current_user.id,
        name=campaign_data.name,
        subject=campaign_data.subject,
        template_id=campaign_data.template_id,
        body_html=body_html,
        body_text=body_text,
        recipient_filter=campaign_data.recipient_filter,
        recipient_count=recipient_count,
        status=CampaignStatus.DRAFT,
        scheduled_at=campaign_data.scheduled_at,
    )

    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    rates = calculate_rates(campaign)

    return CampaignResponse(
        id=campaign.id,
        user_id=campaign.user_id,
        name=campaign.name,
        subject=campaign.subject,
        template_id=campaign.template_id,
        body_html=campaign.body_html,
        body_text=campaign.body_text,
        recipient_filter=campaign.recipient_filter,
        recipient_count=campaign.recipient_count,
        status=campaign.status,
        scheduled_at=campaign.scheduled_at,
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        sent_count=campaign.sent_count,
        delivered_count=campaign.delivered_count,
        opened_count=campaign.opened_count,
        clicked_count=campaign.clicked_count,
        bounced_count=campaign.bounced_count,
        failed_count=campaign.failed_count,
        unsubscribed_count=campaign.unsubscribed_count,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        delivery_rate=rates['delivery_rate'],
        open_rate=rates['open_rate'],
        click_rate=rates['click_rate'],
        bounce_rate=rates['bounce_rate'],
    )


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: UUID,
    campaign_data: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update campaign (only drafts can be updated).
    """
    query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status != CampaignStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft campaigns can be updated"
        )

    # Update fields
    update_data = campaign_data.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(campaign, field, value)

    # Recalculate recipient count if filter changed
    if campaign_data.recipient_filter is not None:
        contacts = await filter_contacts_query(
            db,
            current_user.id,
            campaign.recipient_filter
        )
        campaign.recipient_count = len(contacts)

    await db.commit()
    await db.refresh(campaign)

    rates = calculate_rates(campaign)

    return CampaignResponse(
        id=campaign.id,
        user_id=campaign.user_id,
        name=campaign.name,
        subject=campaign.subject,
        template_id=campaign.template_id,
        body_html=campaign.body_html,
        body_text=campaign.body_text,
        recipient_filter=campaign.recipient_filter,
        recipient_count=campaign.recipient_count,
        status=campaign.status,
        scheduled_at=campaign.scheduled_at,
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        sent_count=campaign.sent_count,
        delivered_count=campaign.delivered_count,
        opened_count=campaign.opened_count,
        clicked_count=campaign.clicked_count,
        bounced_count=campaign.bounced_count,
        failed_count=campaign.failed_count,
        unsubscribed_count=campaign.unsubscribed_count,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        delivery_rate=rates['delivery_rate'],
        open_rate=rates['open_rate'],
        click_rate=rates['click_rate'],
        bounce_rate=rates['bounce_rate'],
    )


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete campaign (only drafts or cancelled campaigns can be deleted).
    """
    try:
        query = select(EmailCampaign).where(
            EmailCampaign.id == campaign_id,
            EmailCampaign.user_id == current_user.id
        )
        result = await db.execute(query)
        campaign = result.scalar_one_or_none()

        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )

        if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft or cancelled campaigns can be deleted"
            )

        # The cascade="all, delete-orphan" on the recipients relationship
        # should handle deleting recipients automatically, but we'll do it
        # explicitly to ensure proper cleanup
        from sqlalchemy import delete as sql_delete
        await db.execute(
            sql_delete(CampaignRecipient).where(CampaignRecipient.campaign_id == campaign_id)
        )

        # Flush to apply recipient deletions before deleting the campaign
        await db.flush()

        # Delete the campaign
        await db.delete(campaign)

        # Commit the transaction
        await db.commit()

        return None

    except HTTPException:
        # Re-raise HTTP exceptions (404, 400, etc.)
        await db.rollback()
        raise
    except Exception as e:
        # Rollback on any other error
        await db.rollback()
        # Log the error and return a proper error message
        import logging
        logging.error(f"Error deleting campaign {campaign_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete campaign: {str(e)}"
        )


@router.post("/{campaign_id}/duplicate", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Duplicate an existing campaign.
    Creates a new draft campaign with the same content and settings.
    """
    # Fetch original campaign
    query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    result = await db.execute(query)
    original_campaign = result.scalar_one_or_none()

    if not original_campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    # Filter contacts to get recipient count
    contacts = await filter_contacts_query(
        db,
        current_user.id,
        original_campaign.recipient_filter or {}
    )
    recipient_count = len(contacts)

    # Create duplicate campaign
    duplicate = EmailCampaign(
        user_id=current_user.id,
        name=f"{original_campaign.name} (Copy)",
        subject=original_campaign.subject,
        template_id=original_campaign.template_id,
        body_html=original_campaign.body_html,
        body_text=original_campaign.body_text,
        recipient_filter=original_campaign.recipient_filter,
        recipient_count=recipient_count,
        status=CampaignStatus.DRAFT,
        scheduled_at=None,  # Don't copy schedule
    )

    db.add(duplicate)
    await db.commit()
    await db.refresh(duplicate)

    rates = calculate_rates(duplicate)

    return CampaignResponse(
        id=duplicate.id,
        user_id=duplicate.user_id,
        name=duplicate.name,
        subject=duplicate.subject,
        template_id=duplicate.template_id,
        body_html=duplicate.body_html,
        body_text=duplicate.body_text,
        recipient_filter=duplicate.recipient_filter,
        recipient_count=duplicate.recipient_count,
        status=duplicate.status,
        scheduled_at=duplicate.scheduled_at,
        started_at=duplicate.started_at,
        completed_at=duplicate.completed_at,
        sent_count=duplicate.sent_count,
        delivered_count=duplicate.delivered_count,
        opened_count=duplicate.opened_count,
        clicked_count=duplicate.clicked_count,
        bounced_count=duplicate.bounced_count,
        failed_count=duplicate.failed_count,
        unsubscribed_count=duplicate.unsubscribed_count,
        created_at=duplicate.created_at,
        updated_at=duplicate.updated_at,
        delivery_rate=rates['delivery_rate'],
        open_rate=rates['open_rate'],
        click_rate=rates['click_rate'],
        bounce_rate=rates['bounce_rate'],
    )

# Contact Filtering
@router.post("/filter-contacts", response_model=ContactFilterResponse)
async def filter_contacts(
    filter_params: ContactFilterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Filter contacts based on criteria and return count + preview.
    """
    contacts = await filter_contacts_query(
        db,
        current_user.id,
        filter_params.dict()
    )

    # Build preview (first 10 contacts)
    preview = []
    for contact in contacts[:10]:
        preview.append({
            "id": str(contact.id),
            "first_name": contact.first_name,
            "last_name": contact.last_name,
            "email": contact.email,
            "phone": contact.phone,
            "company": contact.company,
        })

    return ContactFilterResponse(
        total_count=len(contacts),
        preview=preview
    )


# Campaign Execution
@router.post("/{campaign_id}/send", response_model=CampaignResponse)
async def send_campaign(
    campaign_id: UUID,
    send_request: SendCampaignRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Start sending campaign immediately.
    """
    query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.PAUSED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or paused campaigns can be sent"
        )

    # Get contacts
    contacts = await filter_contacts_query(
        db,
        current_user.id,
        campaign.recipient_filter
    )

    if not contacts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No contacts match the filter criteria"
        )

    # Create recipient records
    for contact in contacts:
        recipient = CampaignRecipient(
            campaign_id=campaign.id,
            contact_id=contact.id,
            email=contact.email,
            status=CampaignRecipientStatus.PENDING,
        )
        db.add(recipient)

    # Update campaign status
    campaign.status = CampaignStatus.SENDING
    campaign.started_at = datetime.utcnow()
    campaign.recipient_count = len(contacts)

    await db.commit()
    await db.refresh(campaign)

    # Queue batch sending as background task
    background_tasks.add_task(
        send_campaign_batch,
        campaign_id=str(campaign.id),
        batch_size=send_request.batch_size
    )

    rates = calculate_rates(campaign)

    return CampaignResponse(
        id=campaign.id,
        user_id=campaign.user_id,
        name=campaign.name,
        subject=campaign.subject,
        template_id=campaign.template_id,
        body_html=campaign.body_html,
        body_text=campaign.body_text,
        recipient_filter=campaign.recipient_filter,
        recipient_count=campaign.recipient_count,
        status=campaign.status,
        scheduled_at=campaign.scheduled_at,
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        sent_count=campaign.sent_count,
        delivered_count=campaign.delivered_count,
        opened_count=campaign.opened_count,
        clicked_count=campaign.clicked_count,
        bounced_count=campaign.bounced_count,
        failed_count=campaign.failed_count,
        unsubscribed_count=campaign.unsubscribed_count,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        delivery_rate=rates['delivery_rate'],
        open_rate=rates['open_rate'],
        click_rate=rates['click_rate'],
        bounce_rate=rates['bounce_rate'],
    )


@router.post("/{campaign_id}/schedule", response_model=CampaignResponse)
async def schedule_campaign(
    campaign_id: UUID,
    schedule_request: ScheduleCampaignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Schedule campaign for later.
    """
    query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status != CampaignStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft campaigns can be scheduled"
        )

    # Validate scheduled time is in future
    if schedule_request.scheduled_at <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scheduled time must be in the future"
        )

    campaign.scheduled_at = schedule_request.scheduled_at
    campaign.status = CampaignStatus.SCHEDULED

    await db.commit()
    await db.refresh(campaign)

    rates = calculate_rates(campaign)

    return CampaignResponse(
        id=campaign.id,
        user_id=campaign.user_id,
        name=campaign.name,
        subject=campaign.subject,
        template_id=campaign.template_id,
        body_html=campaign.body_html,
        body_text=campaign.body_text,
        recipient_filter=campaign.recipient_filter,
        recipient_count=campaign.recipient_count,
        status=campaign.status,
        scheduled_at=campaign.scheduled_at,
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        sent_count=campaign.sent_count,
        delivered_count=campaign.delivered_count,
        opened_count=campaign.opened_count,
        clicked_count=campaign.clicked_count,
        bounced_count=campaign.bounced_count,
        failed_count=campaign.failed_count,
        unsubscribed_count=campaign.unsubscribed_count,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        delivery_rate=rates['delivery_rate'],
        open_rate=rates['open_rate'],
        click_rate=rates['click_rate'],
        bounce_rate=rates['bounce_rate'],
    )


@router.post("/{campaign_id}/pause", response_model=CampaignResponse)
async def pause_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Pause sending campaign.
    """
    query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status != CampaignStatus.SENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only sending campaigns can be paused"
        )

    campaign.status = CampaignStatus.PAUSED

    await db.commit()
    await db.refresh(campaign)

    rates = calculate_rates(campaign)

    return CampaignResponse(
        id=campaign.id,
        user_id=campaign.user_id,
        name=campaign.name,
        subject=campaign.subject,
        template_id=campaign.template_id,
        body_html=campaign.body_html,
        body_text=campaign.body_text,
        recipient_filter=campaign.recipient_filter,
        recipient_count=campaign.recipient_count,
        status=campaign.status,
        scheduled_at=campaign.scheduled_at,
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        sent_count=campaign.sent_count,
        delivered_count=campaign.delivered_count,
        opened_count=campaign.opened_count,
        clicked_count=campaign.clicked_count,
        bounced_count=campaign.bounced_count,
        failed_count=campaign.failed_count,
        unsubscribed_count=campaign.unsubscribed_count,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        delivery_rate=rates['delivery_rate'],
        open_rate=rates['open_rate'],
        click_rate=rates['click_rate'],
        bounce_rate=rates['bounce_rate'],
    )


@router.post("/{campaign_id}/resume", response_model=CampaignResponse)
async def resume_campaign(
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Resume paused campaign.
    """
    query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status != CampaignStatus.PAUSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only paused campaigns can be resumed"
        )

    campaign.status = CampaignStatus.SENDING

    await db.commit()
    await db.refresh(campaign)

    # Resume batch sending
    background_tasks.add_task(
        send_campaign_batch,
        campaign_id=str(campaign.id),
        batch_size=50
    )

    rates = calculate_rates(campaign)

    return CampaignResponse(
        id=campaign.id,
        user_id=campaign.user_id,
        name=campaign.name,
        subject=campaign.subject,
        template_id=campaign.template_id,
        body_html=campaign.body_html,
        body_text=campaign.body_text,
        recipient_filter=campaign.recipient_filter,
        recipient_count=campaign.recipient_count,
        status=campaign.status,
        scheduled_at=campaign.scheduled_at,
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        sent_count=campaign.sent_count,
        delivered_count=campaign.delivered_count,
        opened_count=campaign.opened_count,
        clicked_count=campaign.clicked_count,
        bounced_count=campaign.bounced_count,
        failed_count=campaign.failed_count,
        unsubscribed_count=campaign.unsubscribed_count,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        delivery_rate=rates['delivery_rate'],
        open_rate=rates['open_rate'],
        click_rate=rates['click_rate'],
        bounce_rate=rates['bounce_rate'],
    )


@router.post("/{campaign_id}/cancel", response_model=CampaignResponse)
async def cancel_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a campaign. Cancelled campaigns can be deleted.
    """
    query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status == CampaignStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign is already cancelled"
        )

    campaign.status = CampaignStatus.CANCELLED

    await db.commit()
    await db.refresh(campaign)

    rates = calculate_rates(campaign)

    return CampaignResponse(
        id=campaign.id,
        user_id=campaign.user_id,
        name=campaign.name,
        subject=campaign.subject,
        template_id=campaign.template_id,
        body_html=campaign.body_html,
        body_text=campaign.body_text,
        recipient_filter=campaign.recipient_filter,
        recipient_count=campaign.recipient_count,
        status=campaign.status,
        scheduled_at=campaign.scheduled_at,
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        sent_count=campaign.sent_count,
        delivered_count=campaign.delivered_count,
        opened_count=campaign.opened_count,
        clicked_count=campaign.clicked_count,
        bounced_count=campaign.bounced_count,
        failed_count=campaign.failed_count,
        unsubscribed_count=campaign.unsubscribed_count,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        delivery_rate=rates['delivery_rate'],
        open_rate=rates['open_rate'],
        click_rate=rates['click_rate'],
        bounce_rate=rates['bounce_rate'],
    )


@router.delete("/{campaign_id}/recipients", status_code=status.HTTP_204_NO_CONTENT)
async def clear_campaign_recipients(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Clear all recipients from a campaign.
    """
    query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    # Delete all recipients
    from sqlalchemy import delete as sql_delete
    await db.execute(
        sql_delete(CampaignRecipient).where(CampaignRecipient.campaign_id == campaign_id)
    )

    # Reset recipient count
    campaign.recipient_count = 0
    campaign.sent_count = 0
    campaign.delivered_count = 0
    campaign.opened_count = 0
    campaign.clicked_count = 0
    campaign.bounced_count = 0
    campaign.failed_count = 0

    await db.commit()

    return None


# Analytics
@router.get("/{campaign_id}/stats", response_model=CampaignStatsResponse)
async def get_campaign_stats(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed campaign statistics.
    """
    query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    result = await db.execute(query)
    campaign = result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    rates = calculate_rates(campaign)

    # Calculate pending count
    pending_count = campaign.recipient_count - (
        campaign.sent_count +
        campaign.failed_count
    )

    # Estimate completion time
    estimated_completion = None
    if campaign.status == CampaignStatus.SENDING and campaign.started_at:
        # Rough estimate: assume 50 emails per minute
        emails_per_minute = 50
        remaining = pending_count
        minutes_left = remaining / emails_per_minute
        estimated_completion = datetime.utcnow() + timedelta(minutes=minutes_left)

    # Calculate progress
    total = campaign.recipient_count
    completed = campaign.sent_count + campaign.failed_count
    progress = (completed / total * 100) if total > 0 else 0

    return CampaignStatsResponse(
        campaign_id=campaign.id,
        campaign_name=campaign.name,
        status=campaign.status,
        total_recipients=campaign.recipient_count,
        sent_count=campaign.sent_count,
        delivered_count=campaign.delivered_count,
        opened_count=campaign.opened_count,
        clicked_count=campaign.clicked_count,
        bounced_count=campaign.bounced_count,
        failed_count=campaign.failed_count,
        unsubscribed_count=campaign.unsubscribed_count,
        pending_count=pending_count,
        delivery_rate=rates['delivery_rate'],
        open_rate=rates['open_rate'],
        click_rate=rates['click_rate'],
        bounce_rate=rates['bounce_rate'],
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        estimated_completion=estimated_completion,
        progress_percentage=round(progress, 2),
    )


@router.get("/{campaign_id}/recipients", response_model=RecipientList)
async def get_campaign_recipients(
    campaign_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, description="Filter by recipient status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get campaign recipients with pagination.
    """
    # Verify campaign ownership
    campaign_query = select(EmailCampaign).where(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    )
    campaign_result = await db.execute(campaign_query)
    campaign = campaign_result.scalar_one_or_none()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    # Build query
    query = select(CampaignRecipient).where(CampaignRecipient.campaign_id == campaign_id)

    # Filter by status
    if status_filter:
        try:
            status_enum = CampaignRecipientStatus(status_filter)
            query = query.where(CampaignRecipient.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}"
            )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Order by created_at
    query = query.order_by(desc(CampaignRecipient.created_at))

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute
    result = await db.execute(query)
    recipients = result.scalars().all()

    recipient_items = [
        RecipientResponse(
            id=r.id,
            campaign_id=r.campaign_id,
            contact_id=r.contact_id,
            email=r.email,
            status=r.status,
            sent_at=r.sent_at,
            delivered_at=r.delivered_at,
            opened_at=r.opened_at,
            clicked_at=r.clicked_at,
            bounced_at=r.bounced_at,
            error_message=r.error_message,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in recipients
    ]

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return RecipientList(
        recipients=recipient_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# Unsubscribe
@router.post("/unsubscribe", response_model=UnsubscribeResponse)
async def unsubscribe_from_campaigns(
    unsubscribe_data: UnsubscribeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Unsubscribe contact from future campaigns.

    Token format: base64(contact_id:email)
    """
    import base64

    try:
        # Decode token
        decoded = base64.b64decode(unsubscribe_data.token).decode('utf-8')
        contact_id_str, email = decoded.split(':', 1)
        contact_id = UUID(contact_id_str)

        # Find contact
        query = select(Contact).where(Contact.id == contact_id, Contact.email == email)
        result = await db.execute(query)
        contact = result.scalar_one_or_none()

        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )

        # Mark as unsubscribed
        contact.unsubscribed = True
        contact.unsubscribed_at = datetime.utcnow()

        await db.commit()

        return UnsubscribeResponse(
            success=True,
            message="You have been successfully unsubscribed from future emails.",
            email=email
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid unsubscribe token"
        )
