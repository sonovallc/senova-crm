"""
Autoresponders API endpoints

Features:
- Create/update/delete autoresponders
- List autoresponders with filtering
- Manage sequences
- View execution history
- Toggle active status
- Test autoresponder sending
- View statistics
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy import select, and_, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.user import User
from app.models.autoresponder import (
    Autoresponder,
    AutoresponderSequence,
    AutoresponderExecution,
    TriggerType,
    ExecutionStatus,
    TimingMode,
)
from app.models.contact import Contact
from app.schemas.autoresponder import (
    AutoresponderCreate,
    AutoresponderUpdate,
    AutoresponderResponse,
    AutoresponderListResponse,
    AutoresponderSequenceCreate,
    AutoresponderSequenceUpdate,
    AutoresponderSequenceResponse,
    AutoresponderExecutionResponse,
    AutoresponderStatsResponse,
    AutoresponderTestRequest,
)
from app.core.exceptions import NotFoundError, ValidationError
from app.services.autoresponder_service import (
    queue_autoresponder,
    send_autoresponder_email,
    get_autoresponder_stats,
)

router = APIRouter(prefix="/autoresponders", tags=["Autoresponders"])


# Autoresponder Management Endpoints

@router.get("", response_model=List[AutoresponderListResponse])
async def list_autoresponders(
    current_user: CurrentUser,
    db: DatabaseSession,
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    trigger_type: Optional[TriggerType] = Query(None, description="Filter by trigger type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """
    List all autoresponders for the current user.

    Filters:
    - is_active: Filter by active/inactive status
    - trigger_type: Filter by trigger type
    """
    query = select(Autoresponder).where(
        Autoresponder.created_by == current_user.id
    )

    if is_active is not None:
        query = query.where(Autoresponder.is_active == is_active)

    if trigger_type is not None:
        query = query.where(Autoresponder.trigger_type == trigger_type)

    query = query.order_by(desc(Autoresponder.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    autoresponders = result.scalars().all()

    return autoresponders


@router.get("/{autoresponder_id}", response_model=AutoresponderResponse)
async def get_autoresponder(
    autoresponder_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """
    Get a single autoresponder by ID with sequences.
    """
    from app.models.email_templates import EmailTemplate
    from sqlalchemy import func

    query = select(Autoresponder).where(
        and_(
            Autoresponder.id == autoresponder_id,
            Autoresponder.created_by == current_user.id
        )
    ).options(selectinload(Autoresponder.sequences))

    result = await db.execute(query)
    autoresponder = result.scalar_one_or_none()

    if not autoresponder:
        raise NotFoundError("Autoresponder not found")

    # Calculate total_pending from executions
    pending_count_query = select(func.count(AutoresponderExecution.id)).where(
        and_(
            AutoresponderExecution.autoresponder_id == autoresponder_id,
            AutoresponderExecution.status == ExecutionStatus.PENDING
        )
    )
    pending_result = await db.execute(pending_count_query)
    total_pending = pending_result.scalar() or 0

    # Get template name if template_id exists
    template_name = None
    if autoresponder.template_id:
        template_query = select(EmailTemplate.name).where(EmailTemplate.id == autoresponder.template_id)
        template_result = await db.execute(template_query)
        template_name = template_result.scalar_one_or_none()

    # Extract trigger config fields based on trigger type
    trigger_tag = None
    trigger_date_field = None
    trigger_days_offset = None

    if autoresponder.trigger_type == TriggerType.TAG_ADDED:
        trigger_tag = autoresponder.trigger_config.get('tag_id')
    elif autoresponder.trigger_type == TriggerType.DATE_BASED:
        trigger_date_field = autoresponder.trigger_config.get('field')
        trigger_days_offset = autoresponder.trigger_config.get('days_before')

    # Convert to dict and add computed fields
    response_data = {
        **autoresponder.__dict__,
        'total_pending': total_pending,
        'template_name': template_name,
        'trigger_tag': trigger_tag,
        'trigger_date_field': trigger_date_field,
        'trigger_days_offset': trigger_days_offset,
        'sequences': autoresponder.sequences
    }

    return response_data


@router.post("", response_model=AutoresponderResponse, status_code=status.HTTP_201_CREATED)
async def create_autoresponder(
    data: AutoresponderCreate,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """
    Create a new autoresponder.

    Requires either template_id OR subject + body_html.
    """
    # Validate subject or template
    if not data.template_id and not data.subject:
        raise ValidationError("Either template_id or subject must be provided")

    autoresponder = Autoresponder(
        name=data.name,
        description=data.description,
        trigger_type=data.trigger_type,
        trigger_config=data.trigger_config,
        is_active=data.is_active,
        template_id=data.template_id,
        subject=data.subject,
        body_html=data.body_html,
        send_from_user=data.send_from_user,
        sequence_enabled=data.sequence_enabled,
        created_by=current_user.id,
    )

    db.add(autoresponder)
    await db.commit()
    await db.refresh(autoresponder)

    return autoresponder


@router.put("/{autoresponder_id}", response_model=AutoresponderResponse)
async def update_autoresponder(
    autoresponder_id: UUID,
    data: AutoresponderUpdate,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """
    Update an autoresponder.
    """
    query = select(Autoresponder).where(
        and_(
            Autoresponder.id == autoresponder_id,
            Autoresponder.created_by == current_user.id
        )
    ).options(selectinload(Autoresponder.sequences))

    result = await db.execute(query)
    autoresponder = result.scalar_one_or_none()

    if not autoresponder:
        raise NotFoundError("Autoresponder not found")

    # Update fields (excluding sequence_steps which needs special handling)
    update_data = data.model_dump(exclude_unset=True)
    sequence_steps_data = update_data.pop('sequence_steps', None)

    for field, value in update_data.items():
        setattr(autoresponder, field, value)

    autoresponder.updated_at = datetime.utcnow()

    # BUG FIX: Handle sequence_steps update - delete old sequences and create new ones
    if sequence_steps_data is not None:
        # Delete all existing sequences for this autoresponder
        from sqlalchemy import delete as sql_delete
        await db.execute(
            sql_delete(AutoresponderSequence).where(
                AutoresponderSequence.autoresponder_id == autoresponder_id
            )
        )

        # Create new sequences from the provided data
        for step_data in sequence_steps_data:
            # Normalize timing_mode to lowercase to handle both "BOTH" and "both"
            timing_mode_str = step_data.get('timing_mode', 'fixed_duration')
            if timing_mode_str:
                timing_mode_str = timing_mode_str.lower()

            new_sequence = AutoresponderSequence(
                autoresponder_id=autoresponder_id,
                sequence_order=step_data.get('sequence_order', 1),
                timing_mode=TimingMode(timing_mode_str),
                delay_days=step_data.get('delay_days', 0),
                delay_hours=step_data.get('delay_hours', 0),
                wait_trigger_type=step_data.get('wait_trigger_type'),
                wait_trigger_config=step_data.get('wait_trigger_config', {}),
                template_id=step_data.get('template_id'),
                subject=step_data.get('subject', ''),
                body_html=step_data.get('body_html', ''),
            )
            db.add(new_sequence)

    await db.commit()
    await db.refresh(autoresponder)

    return autoresponder


@router.delete("/{autoresponder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_autoresponder(
    autoresponder_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """
    Delete an autoresponder and all its sequences and executions.
    """
    query = select(Autoresponder).where(
        and_(
            Autoresponder.id == autoresponder_id,
            Autoresponder.created_by == current_user.id
        )
    )

    result = await db.execute(query)
    autoresponder = result.scalar_one_or_none()

    if not autoresponder:
        raise NotFoundError("Autoresponder not found")

    await db.delete(autoresponder)
    await db.commit()

    return None


@router.post("/{autoresponder_id}/toggle", response_model=AutoresponderResponse)
async def toggle_autoresponder(
    autoresponder_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """
    Toggle autoresponder active status (activate/deactivate).
    """
    query = select(Autoresponder).where(
        and_(
            Autoresponder.id == autoresponder_id,
            Autoresponder.created_by == current_user.id
        )
    ).options(selectinload(Autoresponder.sequences))

    result = await db.execute(query)
    autoresponder = result.scalar_one_or_none()

    if not autoresponder:
        raise NotFoundError("Autoresponder not found")

    autoresponder.is_active = not autoresponder.is_active
    autoresponder.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(autoresponder)

    return autoresponder


# Sequence Management Endpoints

@router.post("/{autoresponder_id}/sequences", response_model=AutoresponderSequenceResponse, status_code=status.HTTP_201_CREATED)
async def add_sequence_step(
    autoresponder_id: UUID,
    data: AutoresponderSequenceCreate,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """
    Add a sequence step to an autoresponder.
    """
    # Verify autoresponder exists and belongs to user
    query = select(Autoresponder).where(
        and_(
            Autoresponder.id == autoresponder_id,
            Autoresponder.created_by == current_user.id
        )
    )

    result = await db.execute(query)
    autoresponder = result.scalar_one_or_none()

    if not autoresponder:
        raise NotFoundError("Autoresponder not found")

    # Validate subject or template
    if not data.template_id and not data.subject:
        raise ValidationError("Either template_id or subject must be provided")

    # Normalize timing_mode to lowercase to handle both "BOTH" and "both"
    timing_mode_str = data.timing_mode.lower() if data.timing_mode else 'fixed_duration'

    sequence = AutoresponderSequence(
        autoresponder_id=autoresponder_id,
        sequence_order=data.sequence_order,
        timing_mode=TimingMode(timing_mode_str),
        delay_days=data.delay_days,
        delay_hours=data.delay_hours,
        wait_trigger_type=data.wait_trigger_type,
        wait_trigger_config=data.wait_trigger_config,
        template_id=data.template_id,
        subject=data.subject,
        body_html=data.body_html,
    )

    db.add(sequence)
    await db.commit()
    await db.refresh(sequence)

    return sequence


@router.put("/{autoresponder_id}/sequences/{sequence_id}", response_model=AutoresponderSequenceResponse)
async def update_sequence_step(
    autoresponder_id: UUID,
    sequence_id: UUID,
    data: AutoresponderSequenceUpdate,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """
    Update a sequence step.
    """
    # Verify autoresponder belongs to user
    autoresponder_query = select(Autoresponder).where(
        and_(
            Autoresponder.id == autoresponder_id,
            Autoresponder.created_by == current_user.id
        )
    )

    autoresponder_result = await db.execute(autoresponder_query)
    autoresponder = autoresponder_result.scalar_one_or_none()

    if not autoresponder:
        raise NotFoundError("Autoresponder not found")

    # Get sequence
    sequence_query = select(AutoresponderSequence).where(
        and_(
            AutoresponderSequence.id == sequence_id,
            AutoresponderSequence.autoresponder_id == autoresponder_id
        )
    )

    sequence_result = await db.execute(sequence_query)
    sequence = sequence_result.scalar_one_or_none()

    if not sequence:
        raise NotFoundError("Sequence step not found")

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sequence, field, value)

    await db.commit()
    await db.refresh(sequence)

    return sequence


@router.delete("/{autoresponder_id}/sequences/{sequence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sequence_step(
    autoresponder_id: UUID,
    sequence_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """
    Delete a sequence step.
    """
    # Verify autoresponder belongs to user
    autoresponder_query = select(Autoresponder).where(
        and_(
            Autoresponder.id == autoresponder_id,
            Autoresponder.created_by == current_user.id
        )
    )

    autoresponder_result = await db.execute(autoresponder_query)
    autoresponder = autoresponder_result.scalar_one_or_none()

    if not autoresponder:
        raise NotFoundError("Autoresponder not found")

    # Get sequence
    sequence_query = select(AutoresponderSequence).where(
        and_(
            AutoresponderSequence.id == sequence_id,
            AutoresponderSequence.autoresponder_id == autoresponder_id
        )
    )

    sequence_result = await db.execute(sequence_query)
    sequence = sequence_result.scalar_one_or_none()

    if not sequence:
        raise NotFoundError("Sequence step not found")

    await db.delete(sequence)
    await db.commit()

    return None


# Execution & Analytics Endpoints

@router.get("/{autoresponder_id}/executions", response_model=List[AutoresponderExecutionResponse])
async def get_autoresponder_executions(
    autoresponder_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    status_filter: Optional[ExecutionStatus] = Query(None, description="Filter by execution status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Get execution history for an autoresponder.

    Paginated results with optional status filtering.
    """
    # Verify autoresponder belongs to user
    autoresponder_query = select(Autoresponder).where(
        and_(
            Autoresponder.id == autoresponder_id,
            Autoresponder.created_by == current_user.id
        )
    )

    autoresponder_result = await db.execute(autoresponder_query)
    autoresponder = autoresponder_result.scalar_one_or_none()

    if not autoresponder:
        raise NotFoundError("Autoresponder not found")

    # Get executions with contact information
    query = select(AutoresponderExecution).where(
        AutoresponderExecution.autoresponder_id == autoresponder_id
    ).options(selectinload(AutoresponderExecution.contact))

    if status_filter is not None:
        query = query.where(AutoresponderExecution.status == status_filter)

    query = query.order_by(desc(AutoresponderExecution.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    executions = result.scalars().all()

    # Transform executions to include contact info
    execution_list = []
    for execution in executions:
        contact_name = ""
        contact_email = ""
        if execution.contact:
            contact_name = f"{execution.contact.first_name or ''} {execution.contact.last_name or ''}".strip()
            contact_email = execution.contact.email or ""

        execution_data = {
            'id': execution.id,
            'autoresponder_id': execution.autoresponder_id,
            'contact_id': execution.contact_id,
            'contact_name': contact_name,
            'contact_email': contact_email,
            'sequence_step': execution.sequence_step,
            'status': execution.status.value if hasattr(execution.status, 'value') else str(execution.status),
            'sent_at': execution.executed_at if execution.status == ExecutionStatus.SENT else None,
            'failed_at': execution.executed_at if execution.status == ExecutionStatus.FAILED else None,
            'error_message': execution.error_message,
            'created_at': execution.created_at
        }
        execution_list.append(execution_data)

    return execution_list


@router.get("/{autoresponder_id}/stats", response_model=AutoresponderStatsResponse)
async def get_autoresponder_statistics(
    autoresponder_id: UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """
    Get statistics for an autoresponder.

    Includes:
    - Total executions, sent, pending, failed, skipped
    - Success rate
    - Executions in last 7 and 30 days
    """
    # Verify autoresponder belongs to user
    autoresponder_query = select(Autoresponder).where(
        and_(
            Autoresponder.id == autoresponder_id,
            Autoresponder.created_by == current_user.id
        )
    )

    autoresponder_result = await db.execute(autoresponder_query)
    autoresponder = autoresponder_result.scalar_one_or_none()

    if not autoresponder:
        raise NotFoundError("Autoresponder not found")

    # Get stats from service
    stats = await get_autoresponder_stats(autoresponder_id, db)

    return stats


@router.post("/{autoresponder_id}/test", status_code=status.HTTP_200_OK)
async def test_autoresponder(
    autoresponder_id: UUID,
    data: AutoresponderTestRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
    background_tasks: BackgroundTasks,
):
    """
    Send a test email for this autoresponder to the current user.

    Optionally specify a contact_id to use that contact's data for variable replacement.
    """
    # Verify autoresponder belongs to user
    query = select(Autoresponder).where(
        and_(
            Autoresponder.id == autoresponder_id,
            Autoresponder.created_by == current_user.id
        )
    ).options(selectinload(Autoresponder.sequences))

    result = await db.execute(query)
    autoresponder = result.scalar_one_or_none()

    if not autoresponder:
        raise NotFoundError("Autoresponder not found")

    # Get contact for testing (use specified contact or create dummy)
    contact_id = data.contact_id

    if contact_id:
        # Verify contact exists
        contact_query = select(Contact).where(Contact.id == contact_id)
        contact_result = await db.execute(contact_query)
        contact = contact_result.scalar_one_or_none()

        if not contact:
            raise NotFoundError("Contact not found")
    else:
        # Use current user as dummy contact
        # Create temporary contact for testing
        contact = Contact(
            id=current_user.id,  # Temporary
            email=current_user.email,
            first_name=current_user.first_name or "Test",
            last_name=current_user.last_name or "User",
        )

    # Queue test execution
    execution = await queue_autoresponder(
        autoresponder_id=autoresponder_id,
        contact_id=contact.id if contact_id else current_user.id,
        db=db,
        scheduled_for=datetime.utcnow()
    )

    # Send in background
    background_tasks.add_task(send_autoresponder_email, execution.id, None)

    return {
        "message": "Test email queued",
        "execution_id": execution.id,
        "test_email": current_user.email
    }
