"""
Email Templates API endpoints

Features:
- Create/update/delete email templates
- List templates with filtering and search
- Duplicate templates
- Preview templates with variable replacement
- Manage template categories
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
import re
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.models.user import User, UserRole
from app.models.email_templates import EmailTemplate
from app.schemas.email_templates import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplateResponse,
    EmailTemplateList,
    EmailTemplateListItem,
    TemplatePreviewRequest,
    TemplatePreviewResponse,
    CategoryResponse,
)
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/email-templates", tags=["Email Templates"])


# Helper Functions
def extract_variables_from_template(subject: str, body_html: str) -> List[str]:
    """
    Extract all variable placeholders from template text.

    Variables are in the format {{variable_name}}

    Args:
        subject: Email subject line
        body_html: Email HTML body

    Returns:
        List of unique variable names found in template
    """
    # Regex pattern to find {{variable_name}}
    pattern = r'\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}'

    # Find all variables in subject and body
    subject_vars = re.findall(pattern, subject)
    body_vars = re.findall(pattern, body_html)

    # Combine and deduplicate
    all_vars = list(set(subject_vars + body_vars))

    # Return as {{variable_name}} format
    return [f"{{{{{var}}}}}" for var in all_vars]


def replace_template_variables(
    template_html: str,
    contact: Optional[dict] = None,
    user: Optional[User] = None,
    extra_vars: Optional[dict] = None
) -> tuple[str, List[str]]:
    """
    Replace template variables with actual values.

    Supported variables:
    - {{contact_name}} - Contact first + last name
    - {{first_name}} - Contact first name
    - {{last_name}} - Contact last name
    - {{email}} - Contact email
    - {{phone}} - Contact phone
    - {{company_name}} - Contact company
    - {{user_name}} - Current user's full name
    - {{user_email}} - Current user's email
    - Custom variables from extra_vars

    Args:
        template_html: Template text with {{variable}} placeholders
        contact: Contact data dict (optional)
        user: User model instance (optional)
        extra_vars: Additional custom variables (optional)

    Returns:
        Tuple of (rendered_text, missing_variables)
    """
    if not template_html:
        return "", []

    rendered = template_html
    missing_vars = []

    # Build variable replacement map
    replacements = {}

    # Contact variables
    if contact:
        replacements['{{first_name}}'] = contact.get('first_name', '')
        replacements['{{last_name}}'] = contact.get('last_name', '')

        # Construct full name
        first = contact.get('first_name', '')
        last = contact.get('last_name', '')
        contact_name = f"{first} {last}".strip() if first or last else ''
        replacements['{{contact_name}}'] = contact_name

        replacements['{{email}}'] = contact.get('email', '')
        replacements['{{phone}}'] = contact.get('phone', '')
        replacements['{{company_name}}'] = contact.get('company', '')

    # User variables
    if user:
        replacements['{{user_name}}'] = user.full_name or f"{user.first_name or ''} {user.last_name or ''}".strip()
        replacements['{{user_email}}'] = user.email or ''

    # Extra custom variables
    if extra_vars:
        for key, value in extra_vars.items():
            # Ensure key is in {{variable}} format
            var_key = key if key.startswith('{{') else f"{{{{{key}}}}}"
            replacements[var_key] = str(value) if value is not None else ''

    # Find all variables in template
    pattern = r'\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}'
    found_vars = re.findall(pattern, rendered)

    # Track which variables were not replaced
    for var in found_vars:
        var_formatted = f"{{{{{var}}}}}"
        if var_formatted not in replacements or not replacements[var_formatted]:
            missing_vars.append(var_formatted)

    # Perform replacements
    for var_key, value in replacements.items():
        rendered = rendered.replace(var_key, value)

    return rendered, missing_vars


def check_template_permission(template: EmailTemplate, user: User, action: str = "edit") -> bool:
    """
    Check if user has permission to perform action on template.

    Rules:
    - System templates: Cannot be edited/deleted by anyone, only duplicated
    - User templates: Only creator or admin/owner can edit/delete

    Args:
        template: EmailTemplate instance
        user: Current user
        action: Action to check ('edit', 'delete', 'view')

    Returns:
        bool: True if user has permission

    Raises:
        HTTPException: If user doesn't have permission
    """
    # System templates cannot be modified, only duplicated
    if template.is_system and action in ('edit', 'delete'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System templates cannot be modified or deleted. Please duplicate the template to create your own version."
        )

    # Template creator can always edit/delete their own templates
    if template.user_id == user.id:
        return True

    # Admin and owner can manage all non-system templates
    if user.role in ('admin', 'owner') and not template.is_system:
        return True

    # Otherwise, no permission
    if action in ('edit', 'delete'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this template"
        )

    return True


def sanitize_html(html: str) -> str:
    """
    Basic HTML sanitization to prevent XSS.

    In production, use a proper library like bleach or html-sanitizer.
    For now, we'll do basic validation.

    Args:
        html: HTML content to sanitize

    Returns:
        Sanitized HTML string
    """
    # TODO: Implement proper HTML sanitization with bleach or similar
    # For now, just strip script tags as basic protection
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'on\w+\s*=', '', html, flags=re.IGNORECASE)  # Remove inline event handlers
    return html


# Email Template Endpoints
@router.post("", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_email_template(
    data: EmailTemplateCreate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Create new email template.

    - Automatically extracts variables from subject and body
    - Sanitizes HTML content
    - Only admin/owner can create system templates

    Requires authentication
    """
    # Only admin/owner can create system templates
    if data.is_system and current_user.role not in ('admin', 'owner'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and owner users can create system templates"
        )

    # Sanitize HTML
    sanitized_body = sanitize_html(data.body_html)

    # Extract variables from template
    extracted_vars = extract_variables_from_template(data.subject, sanitized_body)

    # Create new template
    new_template = EmailTemplate(
        user_id=current_user.id,
        name=data.name,
        category=data.category,
        subject=data.subject,
        body_html=sanitized_body,
        thumbnail_url=data.thumbnail_url,
        is_system=data.is_system if current_user.role in ('admin', 'owner') else False,
        is_active=True,
        variables=extracted_vars,
        usage_count=0,
    )

    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)

    return EmailTemplateResponse.model_validate(new_template)


@router.get("", response_model=EmailTemplateList)
async def list_email_templates(
    db: DatabaseSession,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_system: Optional[bool] = Query(None, description="Filter by system templates"),
    search: Optional[str] = Query(None, description="Search in name or subject"),
    sort_by: str = Query("created_at", description="Sort field: created_at, updated_at, usage_count, name"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    include_inactive: bool = Query(False, description="Include inactive (deleted) templates"),
):
    """
    List email templates with filtering, search, and pagination.

    - Returns user's templates + system templates
    - Supports filtering by category and system flag
    - Supports search by name or subject
    - Sortable by multiple fields

    Requires authentication
    """
    # Build query: user's templates + system templates
    query = select(EmailTemplate).where(
        or_(
            EmailTemplate.user_id == current_user.id,
            EmailTemplate.is_system == True
        )
    )

    # Filter by active status
    if not include_inactive:
        query = query.where(EmailTemplate.is_active == True)

    # Filter by category
    if category:
        query = query.where(EmailTemplate.category == category)

    # Filter by is_system
    if is_system is not None:
        query = query.where(EmailTemplate.is_system == is_system)

    # Search in name or subject
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                EmailTemplate.name.ilike(search_pattern),
                EmailTemplate.subject.ilike(search_pattern)
            )
        )

    # Get total count before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply sorting
    sort_column = {
        'created_at': EmailTemplate.created_at,
        'updated_at': EmailTemplate.updated_at,
        'usage_count': EmailTemplate.usage_count,
        'name': EmailTemplate.name,
    }.get(sort_by, EmailTemplate.created_at)

    if sort_order == 'asc':
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Apply pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    result = await db.execute(query)
    templates = result.scalars().all()

    # Convert to list items
    items = [EmailTemplateListItem.model_validate(t) for t in templates]

    return EmailTemplateList(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/categories", response_model=CategoryResponse)
async def list_template_categories(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    List available template categories.

    Returns unique categories from user's templates + system templates.

    Requires authentication
    """
    # Query distinct categories
    query = select(EmailTemplate.category).where(
        and_(
            or_(
                EmailTemplate.user_id == current_user.id,
                EmailTemplate.is_system == True
            ),
            EmailTemplate.is_active == True
        )
    ).distinct()

    result = await db.execute(query)
    categories = [row[0] for row in result.all()]

    # Sort alphabetically
    categories.sort()

    return CategoryResponse(categories=categories)


@router.get("/{template_id}", response_model=EmailTemplateResponse)
async def get_email_template(
    template_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Get single email template by ID.

    - User can access their own templates and system templates

    Requires authentication
    """
    template = await db.get(EmailTemplate, template_id)

    if not template:
        raise NotFoundError("Email template not found")

    # Check access: user's template or system template
    if template.user_id != current_user.id and not template.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this template"
        )

    return EmailTemplateResponse.model_validate(template)


@router.patch("/{template_id}", response_model=EmailTemplateResponse)
async def update_email_template(
    template_id: UUID,
    data: EmailTemplateUpdate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Update email template.

    - Only creator or admin/owner can update
    - System templates cannot be updated
    - Re-extracts variables if subject/body changed

    Requires authentication
    """
    template = await db.get(EmailTemplate, template_id)

    if not template:
        raise NotFoundError("Email template not found")

    # Check permissions
    check_template_permission(template, current_user, action='edit')

    # Track if content changed (to re-extract variables)
    content_changed = False

    # Update fields
    if data.name is not None:
        template.name = data.name

    if data.category is not None:
        template.category = data.category

    if data.subject is not None:
        template.subject = data.subject
        content_changed = True

    if data.body_html is not None:
        template.body_html = sanitize_html(data.body_html)
        content_changed = True

    if data.thumbnail_url is not None:
        template.thumbnail_url = data.thumbnail_url

    if data.variables is not None:
        template.variables = data.variables

    # Re-extract variables if content changed
    if content_changed:
        extracted_vars = extract_variables_from_template(
            template.subject,
            template.body_html
        )
        template.variables = extracted_vars

    await db.commit()
    await db.refresh(template)

    return EmailTemplateResponse.model_validate(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email_template(
    template_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Delete email template (soft delete by setting is_active=False).

    - Only creator or admin/owner can delete
    - System templates cannot be deleted

    Requires authentication
    """
    template = await db.get(EmailTemplate, template_id)

    if not template:
        raise NotFoundError("Email template not found")

    # Check permissions
    check_template_permission(template, current_user, action='delete')

    # Soft delete
    template.is_active = False

    await db.commit()


@router.post("/{template_id}/duplicate", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_email_template(
    template_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Duplicate an existing template.

    - Creates a copy owned by current user
    - Works with both user templates and system templates
    - New template is always non-system (even if duplicating system template)
    - Appends " (Copy)" to name

    Requires authentication
    """
    # Get original template
    original = await db.get(EmailTemplate, template_id)

    if not original:
        raise NotFoundError("Email template not found")

    # Check access to original template
    if original.user_id != current_user.id and not original.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this template"
        )

    # Create duplicate
    duplicate = EmailTemplate(
        user_id=current_user.id,
        name=f"{original.name} (Copy)",
        category=original.category,
        subject=original.subject,
        body_html=original.body_html,
        thumbnail_url=original.thumbnail_url,
        is_system=False,  # Duplicates are never system templates
        is_active=True,
        variables=original.variables,
        usage_count=0,  # Reset usage count
    )

    db.add(duplicate)
    await db.commit()
    await db.refresh(duplicate)

    return EmailTemplateResponse.model_validate(duplicate)


@router.post("/{template_id}/preview", response_model=TemplatePreviewResponse)
async def preview_email_template(
    template_id: UUID,
    data: TemplatePreviewRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Preview template with variable replacement.

    - Replaces variables with provided sample data
    - Returns both rendered subject and body
    - Lists any missing variables

    Requires authentication
    """
    # Get template
    template = await db.get(EmailTemplate, template_id)

    if not template:
        raise NotFoundError("Email template not found")

    # Check access
    if template.user_id != current_user.id and not template.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this template"
        )

    # Replace variables in subject
    rendered_subject, missing_subject = replace_template_variables(
        template.subject,
        contact=data.contact_data,
        user=current_user,
        extra_vars=data.extra_variables
    )

    # Replace variables in body
    rendered_body, missing_body = replace_template_variables(
        template.body_html,
        contact=data.contact_data,
        user=current_user,
        extra_vars=data.extra_variables
    )

    # Combine missing variables from both
    all_missing = list(set(missing_subject + missing_body))

    return TemplatePreviewResponse(
        subject=rendered_subject,
        body_html=rendered_body,
        missing_variables=all_missing
    )


@router.post("/{template_id}/increment-usage", status_code=status.HTTP_204_NO_CONTENT)
async def increment_template_usage(
    template_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Increment template usage count.

    Called when template is used in compose or campaigns.
    This is an internal endpoint for tracking template popularity.

    Requires authentication
    """
    template = await db.get(EmailTemplate, template_id)

    if not template:
        raise NotFoundError("Email template not found")

    # Check access
    if template.user_id != current_user.id and not template.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this template"
        )

    # Increment usage
    template.usage_count += 1

    await db.commit()


@router.post("/seed-starter-templates", status_code=status.HTTP_201_CREATED)
async def seed_starter_templates(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Seed pre-built starter email templates for medical aesthetics business.

    Creates 10 professional templates with realistic content:
    1. Welcome Email
    2. Appointment Reminder
    3. Follow-Up Email
    4. Promotion Announcement
    5. Newsletter Template
    6. Thank You Email
    7. Re-Engagement Email
    8. Event Invitation
    9. Birthday/Anniversary
    10. New Service Announcement

    Only admin/owner can seed system templates.

    Requires authentication
    """
    # Only admin/owner can seed system templates
    if current_user.role not in ('admin', 'owner'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and owner users can seed starter templates"
        )

    # Check if starter templates already exist (avoid duplicates)
    existing_query = select(func.count()).select_from(EmailTemplate).where(
        EmailTemplate.is_system == True
    )
    result = await db.execute(existing_query)
    existing_count = result.scalar()

    if existing_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Starter templates already exist ({existing_count} found). Delete existing system templates first if you want to re-seed."
        )

    # Define starter templates
    starter_templates = [
        {
            "name": "Welcome Email",
            "category": "welcome",
            "subject": "Welcome to {{company_name}}, {{first_name}}!",
            "body_html": """<p>Hi {{first_name}},</p>
<p>Welcome to {{company_name}}! We're thrilled to have you as part of our community.</p>
<p>Our team of experienced aestheticians is dedicated to helping you look and feel your absolute best. Whether you're interested in facials, injectables, laser treatments, or skincare consultations, we're here to create a personalized treatment plan just for you.</p>
<p><strong>What to expect next:</strong></p>
<ul>
<li>Personalized treatment recommendations</li>
<li>Exclusive member-only promotions</li>
<li>Expert skincare tips and advice</li>
<li>Priority booking for new services</li>
</ul>
<p>If you have any questions or would like to schedule your first appointment, please don't hesitate to reach out!</p>
<p>Best regards,<br>{{user_name}}<br>{{company_name}}</p>""",
        },
        {
            "name": "Appointment Reminder",
            "category": "appointment",
            "subject": "Reminder: Your appointment at {{company_name}}",
            "body_html": """<p>Hi {{first_name}},</p>
<p>This is a friendly reminder about your upcoming appointment at {{company_name}}.</p>
<p><strong>Appointment Details:</strong></p>
<p>We're looking forward to seeing you! Please arrive 10 minutes early to complete any necessary paperwork.</p>
<p><strong>Before your appointment:</strong></p>
<ul>
<li>Avoid sun exposure 24 hours prior</li>
<li>Come with a clean face (no makeup)</li>
<li>Stay hydrated</li>
<li>Bring a list of any questions you may have</li>
</ul>
<p>Need to reschedule? Please give us at least 24 hours notice by replying to this email or calling us.</p>
<p>See you soon!<br>{{user_name}}<br>{{company_name}}</p>""",
        },
        {
            "name": "Post-Treatment Follow-Up",
            "category": "follow_up",
            "subject": "How are you feeling, {{first_name}}?",
            "body_html": """<p>Hi {{first_name}},</p>
<p>Thank you for choosing {{company_name}} for your recent treatment! We hope you're already seeing wonderful results.</p>
<p><strong>Post-treatment care reminder:</strong></p>
<ul>
<li>Keep the treated area clean and moisturized</li>
<li>Avoid direct sun exposure and wear SPF 30+</li>
<li>Stay hydrated by drinking plenty of water</li>
<li>Avoid strenuous exercise for 24-48 hours</li>
<li>Do not touch or massage the treated area</li>
</ul>
<p>If you have any questions, concerns, or experience unexpected reactions, please don't hesitate to contact us immediately. Your safety and satisfaction are our top priorities.</p>
<p>We'd love to hear about your experience! If you're happy with your results, we'd appreciate a review.</p>
<p>Looking forward to seeing you again soon!<br>{{user_name}}<br>{{company_name}}</p>""",
        },
        {
            "name": "Special Promotion",
            "category": "promotion",
            "subject": "Exclusive Offer: 20% Off Your Next Treatment!",
            "body_html": """<p>Hi {{first_name}},</p>
<p>We have exciting news! As a valued client of {{company_name}}, you're invited to take advantage of our exclusive limited-time offer.</p>
<p><strong>🎉 Get 20% OFF your next treatment! 🎉</strong></p>
<p>This special offer is available for:</p>
<ul>
<li>All facial treatments</li>
<li>Chemical peels</li>
<li>Microneedling sessions</li>
<li>LED light therapy</li>
</ul>
<p><strong>Offer valid until [DATE]</strong></p>
<p>Ready to book? Reply to this email or give us a call to schedule your appointment and claim your discount. Appointments are limited, so don't wait!</p>
<p><em>This offer cannot be combined with other promotions and is valid for one treatment per client.</em></p>
<p>We can't wait to see you!<br>{{user_name}}<br>{{company_name}}</p>""",
        },
        {
            "name": "Monthly Newsletter",
            "category": "newsletter",
            "subject": "Your Monthly Glow-Up: Tips, Trends & Treatments",
            "body_html": """<p>Hi {{first_name}},</p>
<p>Welcome to this month's newsletter from {{company_name}}! Here's what's new in the world of medical aesthetics.</p>
<p><strong>📰 This Month's Highlights:</strong></p>
<p><strong>1. Treatment Spotlight: [Featured Treatment]</strong><br>
Discover how this innovative treatment can help you achieve your aesthetic goals.</p>
<p><strong>2. Skincare Tip of the Month</strong><br>
As the seasons change, so should your skincare routine. Here's what you need to know...</p>
<p><strong>3. Before & After Success Stories</strong><br>
See the amazing transformations our clients have achieved (with their permission, of course!).</p>
<p><strong>4. Upcoming Events & Workshops</strong><br>
Join us for our free skincare consultation event on [DATE]!</p>
<p><strong>5. Product Recommendation</strong><br>
This month we're loving: [Product Name] - Ask us how to get 15% off!</p>
<p>Have questions about any of these topics? Reply to this email - we're here to help!</p>
<p>Stay beautiful,<br>{{user_name}}<br>{{company_name}}</p>""",
        },
        {
            "name": "Thank You Email",
            "category": "general",
            "subject": "Thank you for choosing {{company_name}}!",
            "body_html": """<p>Dear {{first_name}},</p>
<p>We wanted to take a moment to personally thank you for choosing {{company_name}} for your aesthetic needs.</p>
<p>Your trust in our team means everything to us, and we're committed to providing you with exceptional care and outstanding results.</p>
<p><strong>Your satisfaction is our priority</strong></p>
<p>If you have any feedback about your experience, we'd love to hear from you. Your insights help us continue to improve and serve you better.</p>
<p><strong>Refer a friend and save!</strong><br>
Know someone who would benefit from our services? Refer a friend and you'll both receive a special discount on your next treatment.</p>
<p>We look forward to being part of your continued wellness journey!</p>
<p>With gratitude,<br>{{user_name}}<br>{{company_name}}</p>""",
        },
        {
            "name": "Re-Engagement Email",
            "category": "general",
            "subject": "We miss you, {{first_name}}! Special comeback offer inside",
            "body_html": """<p>Hi {{first_name}},</p>
<p>It's been a while since we've seen you at {{company_name}}, and we wanted to reach out!</p>
<p>We hope you're doing well and that you've been taking great care of your skin. We've missed having you in our clinic!</p>
<p><strong>We'd love to welcome you back with a special offer:</strong></p>
<p>💆‍♀️ <strong>15% OFF your next visit</strong> when you book within the next 2 weeks!</p>
<p><strong>What's new since your last visit:</strong></p>
<ul>
<li>New advanced treatment options</li>
<li>Updated product lines</li>
<li>Extended evening hours for your convenience</li>
<li>New team members with specialized expertise</li>
</ul>
<p>Ready to reconnect? Simply reply to this email or give us a call to schedule your appointment and claim your welcome-back discount.</p>
<p>We can't wait to see you again!<br>{{user_name}}<br>{{company_name}}</p>
<p><em>P.S. This exclusive offer expires on [DATE], so don't wait!</em></p>""",
        },
        {
            "name": "Event Invitation",
            "category": "general",
            "subject": "You're Invited: Exclusive VIP Event at {{company_name}}",
            "body_html": """<p>Dear {{first_name}},</p>
<p>You're cordially invited to an exclusive VIP event at {{company_name}}!</p>
<p><strong>🌟 VIP Client Appreciation Evening 🌟</strong></p>
<p><strong>Date:</strong> [EVENT_DATE]<br>
<strong>Time:</strong> [EVENT_TIME]<br>
<strong>Location:</strong> {{company_name}}</p>
<p><strong>Join us for an evening of:</strong></p>
<ul>
<li>Complimentary mini-consultations</li>
<li>Live treatment demonstrations</li>
<li>Exclusive event-only discounts (up to 30% off!)</li>
<li>New product launches and samples</li>
<li>Refreshments and networking</li>
<li>Raffle prizes and giveaways</li>
</ul>
<p><strong>Space is limited!</strong> Please RSVP by [RSVP_DATE] by replying to this email or calling us.</p>
<p>Feel free to bring a friend - new clients are always welcome!</p>
<p>We look forward to celebrating with you!<br>{{user_name}}<br>{{company_name}}</p>""",
        },
        {
            "name": "Birthday Wishes",
            "category": "general",
            "subject": "Happy Birthday, {{first_name}}! 🎉 Special gift inside",
            "body_html": """<p>Happy Birthday, {{first_name}}! 🎂🎉</p>
<p>The entire team at {{company_name}} wants to wish you a wonderful birthday filled with joy, laughter, and celebration!</p>
<p><strong>To help you celebrate in style, here's our gift to you:</strong></p>
<p>🎁 <strong>Complimentary add-on service</strong> with your next treatment<br>
<em>(Choose from: LED therapy, dermaplaning, or hydrating mask)</em></p>
<p><strong>PLUS</strong></p>
<p>💝 <strong>20% OFF</strong> any skincare product purchase this month!</p>
<p>Your birthday offer is valid for 30 days from today, so you have plenty of time to treat yourself!</p>
<p>Book your birthday pampering session by replying to this email or giving us a call. We'd love to help you celebrate!</p>
<p>Wishing you a year filled with confidence, beauty, and wellness!</p>
<p>Happy Birthday!<br>{{user_name}} and the team at {{company_name}}</p>
<p><em>P.S. Don't forget to bring ID to verify your birthday and claim your gift!</em></p>""",
        },
        {
            "name": "New Service Announcement",
            "category": "general",
            "subject": "Introducing Our Latest Treatment: [Service Name]",
            "body_html": """<p>Hi {{first_name}},</p>
<p>We're thrilled to announce the newest addition to our treatment menu at {{company_name}}!</p>
<p><strong>Introducing: [NEW SERVICE NAME]</strong></p>
<p>This cutting-edge treatment is designed to [BRIEF DESCRIPTION OF BENEFITS]. It's perfect for clients looking to [TARGET GOALS].</p>
<p><strong>What makes this treatment special:</strong></p>
<ul>
<li>Non-invasive with minimal downtime</li>
<li>Clinically proven results</li>
<li>Customizable to your unique needs</li>
<li>Suitable for all skin types</li>
<li>Long-lasting effects</li>
</ul>
<p><strong>Expected Results:</strong></p>
<p>[Description of expected outcomes, timeline, and what clients can expect]</p>
<p><strong>🎊 Launch Special - Limited Time Only!</strong></p>
<p>Be one of the first 20 clients to try this innovative treatment and receive:</p>
<ul>
<li>25% OFF your first session</li>
<li>Complimentary consultation (valued at $150)</li>
<li>Free take-home skincare sample</li>
</ul>
<p>Curious to learn more? Reply to this email or call us to schedule your complimentary consultation. Our experts are ready to answer all your questions!</p>
<p>Don't miss out on this exclusive launch offer!</p>
<p>Best regards,<br>{{user_name}}<br>{{company_name}}</p>""",
        },
    ]

    # Create templates
    created_templates = []
    for template_data in starter_templates:
        # Extract variables
        extracted_vars = extract_variables_from_template(
            template_data["subject"],
            template_data["body_html"]
        )

        new_template = EmailTemplate(
            user_id=current_user.id,
            name=template_data["name"],
            category=template_data["category"],
            subject=template_data["subject"],
            body_html=template_data["body_html"],
            is_system=True,
            is_active=True,
            variables=extracted_vars,
            usage_count=0,
        )
        db.add(new_template)
        created_templates.append(new_template)

    await db.commit()

    return {
        "message": f"Successfully created {len(created_templates)} starter templates",
        "count": len(created_templates),
        "templates": [
            {"id": str(t.id), "name": t.name, "category": t.category}
            for t in created_templates
        ]
    }
