"""
10DLC Brand and Campaign Registration API endpoints

Required for A2P SMS compliance in the United States.
Brands must be registered and verified before campaigns can be created.
Phone numbers must be assigned to approved campaigns.

Flow:
1. Register Brand (company info, EIN, etc.)
2. Wait for brand vetting (automatic or manual)
3. Create Campaign (use case, sample messages)
4. Wait for campaign approval
5. Assign phone numbers to approved campaign
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from pydantic import BaseModel, Field, EmailStr
import logging
import uuid as uuid_lib

from app.api.dependencies import CurrentUser, DatabaseSession
from app.services.telnyx_service import TelnyxService
from app.utils.encryption import decrypt_api_key
from app.core.exceptions import IntegrationError

router = APIRouter(prefix="/10dlc", tags=["10DLC Registration"])
logger = logging.getLogger(__name__)


# =========================================================================
# SCHEMAS
# =========================================================================

class BrandResponse(BaseModel):
    """10DLC Brand response"""
    id: UUID
    object_id: UUID
    object_name: Optional[str] = None
    external_brand_id: Optional[str] = None
    company_name: str
    display_name: Optional[str] = None
    ein: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    vertical: Optional[str] = None
    entity_type: Optional[str] = None
    status: str
    vetting_status: Optional[str] = None
    vetting_score: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CreateBrandRequest(BaseModel):
    """Create 10DLC brand request"""
    object_id: UUID = Field(..., description="Object (tenant) for this brand")
    company_name: str = Field(..., min_length=1, max_length=255, description="Legal company name")
    display_name: Optional[str] = Field(None, max_length=255, description="Brand display name")
    ein: Optional[str] = Field(None, pattern=r"^\d{2}-?\d{7}$", description="Employer ID Number")
    website: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    street: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: str = Field("US", max_length=2)
    vertical: Optional[str] = Field(None, description="Industry vertical")
    entity_type: str = Field("PRIVATE_PROFIT", description="PRIVATE_PROFIT, PUBLIC_PROFIT, NON_PROFIT, GOVERNMENT")


class CampaignResponse(BaseModel):
    """10DLC Campaign response"""
    id: UUID
    brand_id: UUID
    brand_name: Optional[str] = None
    external_campaign_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    use_case: str
    sub_use_case: Optional[str] = None
    sample_messages: List[str]
    opt_in_message: Optional[str] = None
    opt_out_message: Optional[str] = None
    help_message: Optional[str] = None
    subscriber_optin: bool
    subscriber_optout: bool
    subscriber_help: bool
    number_pool: bool
    embedded_link: bool
    embedded_phone: bool
    status: str
    rejection_reason: Optional[str] = None
    phone_number_count: int = 0
    created_at: datetime
    updated_at: datetime


class CreateCampaignRequest(BaseModel):
    """Create 10DLC campaign request"""
    brand_id: UUID = Field(..., description="Associated brand ID")
    name: str = Field(..., min_length=1, max_length=255, description="Campaign name")
    description: Optional[str] = Field(None, description="Campaign description")
    use_case: str = Field(..., description="Use case: MARKETING, CUSTOMER_CARE, 2FA, etc.")
    sub_use_case: Optional[str] = None
    sample_messages: List[str] = Field(..., min_items=2, max_items=5, description="2-5 sample messages")
    opt_in_message: Optional[str] = Field(None, description="Message sent when user opts in")
    opt_out_message: Optional[str] = Field(None, description="Message sent when user opts out")
    help_message: Optional[str] = Field(None, description="Message sent when user texts HELP")
    subscriber_optin: bool = Field(True, description="Requires opt-in")
    subscriber_optout: bool = Field(True, description="Allows opt-out")
    subscriber_help: bool = Field(True, description="Provides help")
    number_pool: bool = Field(False, description="Uses multiple numbers")
    embedded_link: bool = Field(False, description="Contains links")
    embedded_phone: bool = Field(False, description="Contains phone numbers")


# =========================================================================
# BRAND ENDPOINTS
# =========================================================================

@router.get("/brands", response_model=List[BrandResponse])
async def list_brands(
    db: DatabaseSession,
    current_user: CurrentUser,
    object_id: Optional[UUID] = None,
):
    """
    List 10DLC brands.

    - Owner: See all brands
    - Admin: See brands for objects they have access to
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role == 'user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users cannot view 10DLC brands"
        )

    query = """
        SELECT
            tb.id,
            tb.object_id,
            o.name as object_name,
            tb.external_brand_id,
            tb.company_name,
            tb.display_name,
            tb.ein,
            tb.website,
            tb.phone,
            tb.email,
            tb.street,
            tb.city,
            tb.state,
            tb.postal_code,
            tb.country,
            tb.vertical,
            tb.entity_type,
            tb.status,
            tb.vetting_status,
            tb.vetting_score,
            tb.rejection_reason,
            tb.created_at,
            tb.updated_at
        FROM telnyx_brands tb
        INNER JOIN objects o ON tb.object_id = o.id
    """

    params = {}
    conditions = []

    if user_role != 'owner':
        query += " INNER JOIN object_users ou ON tb.object_id = ou.object_id"
        conditions.append("ou.user_id = :user_id")
        params["user_id"] = str(current_user.id)

    if object_id:
        conditions.append("tb.object_id = :object_id")
        params["object_id"] = str(object_id)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY tb.created_at DESC"

    result = await db.execute(text(query), params)
    rows = result.fetchall()

    return [
        BrandResponse(
            id=row.id,
            object_id=row.object_id,
            object_name=row.object_name,
            external_brand_id=row.external_brand_id,
            company_name=row.company_name,
            display_name=row.display_name,
            ein=row.ein,
            website=row.website,
            phone=row.phone,
            email=row.email,
            street=row.street,
            city=row.city,
            state=row.state,
            postal_code=row.postal_code,
            country=row.country,
            vertical=row.vertical,
            entity_type=row.entity_type,
            status=row.status,
            vetting_status=row.vetting_status,
            vetting_score=row.vetting_score,
            rejection_reason=row.rejection_reason,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.post("/brands", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    data: CreateBrandRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Register a 10DLC brand (Owner only).

    This creates a brand registration request with Telnyx.
    The brand will be automatically vetted.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can register 10DLC brands"
        )

    # Get Telnyx settings
    settings_query = text("""
        SELECT id, api_key
        FROM object_telnyx_settings
        WHERE object_id = :object_id AND is_active = true
    """)
    result = await db.execute(settings_query, {"object_id": str(data.object_id)})
    settings = result.fetchone()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telnyx settings not configured for this object"
        )

    # Get object name
    obj_query = text("SELECT name FROM objects WHERE id = :object_id")
    obj_result = await db.execute(obj_query, {"object_id": str(data.object_id)})
    obj = obj_result.fetchone()

    # Register with Telnyx
    try:
        decrypted_key = decrypt_api_key(settings.api_key)
        service = TelnyxService(api_key=decrypted_key)
        telnyx_result = await service.create_brand(
            company_name=data.company_name,
            display_name=data.display_name,
            ein=data.ein,
            website=data.website,
            phone=data.phone,
            email=data.email,
            street=data.street,
            city=data.city,
            state=data.state,
            postal_code=data.postal_code,
            country=data.country,
            vertical=data.vertical,
            entity_type=data.entity_type,
        )
        external_brand_id = telnyx_result.get("brand_id")
        vetting_status = telnyx_result.get("vetting_status")
        brand_status = telnyx_result.get("status", "pending")
    except IntegrationError as e:
        logger.error(f"Telnyx brand registration failed: {e}")
        # Still save locally as draft
        external_brand_id = None
        vetting_status = None
        brand_status = "draft"

    # Save to database
    brand_id = uuid_lib.uuid4()
    insert_query = text("""
        INSERT INTO telnyx_brands (
            id, object_id, telnyx_settings_id, external_brand_id,
            company_name, display_name, ein, website, phone, email,
            street, city, state, postal_code, country, vertical, entity_type,
            status, vetting_status, created_at, updated_at
        )
        VALUES (
            :id, :object_id, :telnyx_settings_id, :external_brand_id,
            :company_name, :display_name, :ein, :website, :phone, :email,
            :street, :city, :state, :postal_code, :country, :vertical, :entity_type,
            :status, :vetting_status, NOW(), NOW()
        )
        RETURNING id, object_id, external_brand_id, company_name, display_name,
                  ein, website, phone, email, street, city, state, postal_code,
                  country, vertical, entity_type, status, vetting_status,
                  vetting_score, rejection_reason, created_at, updated_at
    """)

    result = await db.execute(insert_query, {
        "id": str(brand_id),
        "object_id": str(data.object_id),
        "telnyx_settings_id": str(settings.id),
        "external_brand_id": external_brand_id,
        "company_name": data.company_name,
        "display_name": data.display_name,
        "ein": data.ein,
        "website": data.website,
        "phone": data.phone,
        "email": data.email,
        "street": data.street,
        "city": data.city,
        "state": data.state,
        "postal_code": data.postal_code,
        "country": data.country,
        "vertical": data.vertical,
        "entity_type": data.entity_type,
        "status": brand_status,
        "vetting_status": vetting_status,
    })

    await db.commit()
    row = result.fetchone()

    return BrandResponse(
        id=row.id,
        object_id=row.object_id,
        object_name=obj.name if obj else None,
        external_brand_id=row.external_brand_id,
        company_name=row.company_name,
        display_name=row.display_name,
        ein=row.ein,
        website=row.website,
        phone=row.phone,
        email=row.email,
        street=row.street,
        city=row.city,
        state=row.state,
        postal_code=row.postal_code,
        country=row.country,
        vertical=row.vertical,
        entity_type=row.entity_type,
        status=row.status,
        vetting_status=row.vetting_status,
        vetting_score=row.vetting_score,
        rejection_reason=row.rejection_reason,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.post("/brands/{brand_id}/sync")
async def sync_brand(
    brand_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Sync brand status from Telnyx (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can sync brands"
        )

    # Get brand and Telnyx settings
    query = text("""
        SELECT
            tb.id,
            tb.external_brand_id,
            ots.api_key
        FROM telnyx_brands tb
        INNER JOIN object_telnyx_settings ots ON tb.telnyx_settings_id = ots.id
        WHERE tb.id = :brand_id
    """)
    result = await db.execute(query, {"brand_id": str(brand_id)})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    if not row.external_brand_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand has not been submitted to Telnyx yet"
        )

    # Fetch from Telnyx
    try:
        decrypted_key = decrypt_api_key(row.api_key)
        service = TelnyxService(api_key=decrypted_key)
        brand_data = await service.get_brand(row.external_brand_id)

        # Update local record
        update_query = text("""
            UPDATE telnyx_brands
            SET
                status = :status,
                vetting_status = :vetting_status,
                vetting_score = :vetting_score,
                updated_at = NOW()
            WHERE id = :brand_id
        """)
        await db.execute(update_query, {
            "brand_id": str(brand_id),
            "status": brand_data.get("status", "pending"),
            "vetting_status": brand_data.get("vetting_status"),
            "vetting_score": brand_data.get("vetting_score"),
        })
        await db.commit()

        return {"status": "synced", "brand_status": brand_data.get("status")}

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# =========================================================================
# CAMPAIGN ENDPOINTS
# =========================================================================

@router.get("/campaigns", response_model=List[CampaignResponse])
async def list_campaigns(
    db: DatabaseSession,
    current_user: CurrentUser,
    brand_id: Optional[UUID] = None,
):
    """
    List 10DLC campaigns.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role == 'user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users cannot view 10DLC campaigns"
        )

    query = """
        SELECT
            tc.id,
            tc.brand_id,
            tb.company_name as brand_name,
            tc.external_campaign_id,
            tc.name,
            tc.description,
            tc.use_case,
            tc.sub_use_case,
            tc.sample_messages,
            tc.opt_in_message,
            tc.opt_out_message,
            tc.help_message,
            tc.subscriber_optin,
            tc.subscriber_optout,
            tc.subscriber_help,
            tc.number_pool,
            tc.embedded_link,
            tc.embedded_phone,
            tc.status,
            tc.rejection_reason,
            tc.created_at,
            tc.updated_at,
            (SELECT COUNT(*) FROM telnyx_phone_numbers WHERE campaign_id = tc.id) as phone_number_count
        FROM telnyx_campaigns tc
        INNER JOIN telnyx_brands tb ON tc.brand_id = tb.id
    """

    params = {}
    conditions = []

    if user_role != 'owner':
        query += " INNER JOIN object_users ou ON tb.object_id = ou.object_id"
        conditions.append("ou.user_id = :user_id")
        params["user_id"] = str(current_user.id)

    if brand_id:
        conditions.append("tc.brand_id = :brand_id")
        params["brand_id"] = str(brand_id)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY tc.created_at DESC"

    result = await db.execute(text(query), params)
    rows = result.fetchall()

    return [
        CampaignResponse(
            id=row.id,
            brand_id=row.brand_id,
            brand_name=row.brand_name,
            external_campaign_id=row.external_campaign_id,
            name=row.name,
            description=row.description,
            use_case=row.use_case,
            sub_use_case=row.sub_use_case,
            sample_messages=row.sample_messages or [],
            opt_in_message=row.opt_in_message,
            opt_out_message=row.opt_out_message,
            help_message=row.help_message,
            subscriber_optin=row.subscriber_optin,
            subscriber_optout=row.subscriber_optout,
            subscriber_help=row.subscriber_help,
            number_pool=row.number_pool,
            embedded_link=row.embedded_link,
            embedded_phone=row.embedded_phone,
            status=row.status,
            rejection_reason=row.rejection_reason,
            phone_number_count=row.phone_number_count,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.post("/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    data: CreateCampaignRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Create a 10DLC campaign (Owner only).

    Requires an approved brand.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can create 10DLC campaigns"
        )

    # Get brand and verify it's approved
    brand_query = text("""
        SELECT
            tb.id,
            tb.company_name,
            tb.external_brand_id,
            tb.status,
            ots.api_key
        FROM telnyx_brands tb
        INNER JOIN object_telnyx_settings ots ON tb.telnyx_settings_id = ots.id
        WHERE tb.id = :brand_id
    """)
    result = await db.execute(brand_query, {"brand_id": str(data.brand_id)})
    brand = result.fetchone()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    if brand.status not in ['verified', 'approved']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand must be verified before creating campaigns. Current status: {brand.status}"
        )

    # Create campaign on Telnyx
    try:
        decrypted_key = decrypt_api_key(brand.api_key)
        service = TelnyxService(api_key=decrypted_key)
        telnyx_result = await service.create_campaign(
            brand_id=brand.external_brand_id,
            use_case=data.use_case,
            description=data.description or data.name,
            sample_messages=data.sample_messages,
            opt_in_message=data.opt_in_message,
            opt_out_message=data.opt_out_message,
            help_message=data.help_message,
            subscriber_optin=data.subscriber_optin,
            subscriber_optout=data.subscriber_optout,
            subscriber_help=data.subscriber_help,
            number_pool=data.number_pool,
            embedded_link=data.embedded_link,
            embedded_phone=data.embedded_phone,
        )
        external_campaign_id = telnyx_result.get("campaign_id")
        campaign_status = telnyx_result.get("status", "pending")
    except IntegrationError as e:
        logger.error(f"Telnyx campaign creation failed: {e}")
        external_campaign_id = None
        campaign_status = "draft"

    # Save to database
    campaign_id = uuid_lib.uuid4()
    insert_query = text("""
        INSERT INTO telnyx_campaigns (
            id, brand_id, external_campaign_id, name, description, use_case, sub_use_case,
            sample_messages, opt_in_message, opt_out_message, help_message,
            subscriber_optin, subscriber_optout, subscriber_help,
            number_pool, embedded_link, embedded_phone, status, created_at, updated_at
        )
        VALUES (
            :id, :brand_id, :external_campaign_id, :name, :description, :use_case, :sub_use_case,
            :sample_messages, :opt_in_message, :opt_out_message, :help_message,
            :subscriber_optin, :subscriber_optout, :subscriber_help,
            :number_pool, :embedded_link, :embedded_phone, :status, NOW(), NOW()
        )
        RETURNING *
    """)

    result = await db.execute(insert_query, {
        "id": str(campaign_id),
        "brand_id": str(data.brand_id),
        "external_campaign_id": external_campaign_id,
        "name": data.name,
        "description": data.description,
        "use_case": data.use_case,
        "sub_use_case": data.sub_use_case,
        "sample_messages": data.sample_messages,
        "opt_in_message": data.opt_in_message,
        "opt_out_message": data.opt_out_message,
        "help_message": data.help_message,
        "subscriber_optin": data.subscriber_optin,
        "subscriber_optout": data.subscriber_optout,
        "subscriber_help": data.subscriber_help,
        "number_pool": data.number_pool,
        "embedded_link": data.embedded_link,
        "embedded_phone": data.embedded_phone,
        "status": campaign_status,
    })

    await db.commit()
    row = result.fetchone()

    return CampaignResponse(
        id=row.id,
        brand_id=row.brand_id,
        brand_name=brand.company_name,
        external_campaign_id=row.external_campaign_id,
        name=row.name,
        description=row.description,
        use_case=row.use_case,
        sub_use_case=row.sub_use_case,
        sample_messages=row.sample_messages or [],
        opt_in_message=row.opt_in_message,
        opt_out_message=row.opt_out_message,
        help_message=row.help_message,
        subscriber_optin=row.subscriber_optin,
        subscriber_optout=row.subscriber_optout,
        subscriber_help=row.subscriber_help,
        number_pool=row.number_pool,
        embedded_link=row.embedded_link,
        embedded_phone=row.embedded_phone,
        status=row.status,
        rejection_reason=row.rejection_reason,
        phone_number_count=0,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.post("/campaigns/{campaign_id}/assign-number")
async def assign_number_to_campaign(
    campaign_id: UUID,
    phone_number_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Assign a phone number to a campaign (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can assign numbers to campaigns"
        )

    # Get campaign and phone number details
    query = text("""
        SELECT
            tc.id as campaign_id,
            tc.external_campaign_id,
            tc.status as campaign_status,
            tpn.id as phone_number_id,
            tpn.external_id as phone_external_id,
            ots.api_key
        FROM telnyx_campaigns tc
        INNER JOIN telnyx_brands tb ON tc.brand_id = tb.id
        INNER JOIN object_telnyx_settings ots ON tb.telnyx_settings_id = ots.id
        CROSS JOIN telnyx_phone_numbers tpn
        WHERE tc.id = :campaign_id AND tpn.id = :phone_number_id
    """)
    result = await db.execute(query, {
        "campaign_id": str(campaign_id),
        "phone_number_id": str(phone_number_id),
    })
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign or phone number not found"
        )

    if row.campaign_status != 'approved':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campaign must be approved before assigning numbers. Current status: {row.campaign_status}"
        )

    # Assign on Telnyx
    if row.external_campaign_id and row.phone_external_id:
        try:
            decrypted_key = decrypt_api_key(row.api_key)
            service = TelnyxService(api_key=decrypted_key)
            await service.assign_number_to_campaign(
                phone_number_id=row.phone_external_id,
                campaign_id=row.external_campaign_id,
            )
        except IntegrationError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    # Update local record
    update_query = text("""
        UPDATE telnyx_phone_numbers
        SET campaign_id = :campaign_id, updated_at = NOW()
        WHERE id = :phone_number_id
    """)
    await db.execute(update_query, {
        "campaign_id": str(campaign_id),
        "phone_number_id": str(phone_number_id),
    })
    await db.commit()

    return {"status": "assigned", "phone_number_id": str(phone_number_id)}


@router.post("/campaigns/{campaign_id}/sync")
async def sync_campaign(
    campaign_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Sync campaign status from Telnyx (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can sync campaigns"
        )

    # Get campaign and Telnyx settings
    query = text("""
        SELECT
            tc.id,
            tc.external_campaign_id,
            ots.api_key
        FROM telnyx_campaigns tc
        INNER JOIN telnyx_brands tb ON tc.brand_id = tb.id
        INNER JOIN object_telnyx_settings ots ON tb.telnyx_settings_id = ots.id
        WHERE tc.id = :campaign_id
    """)
    result = await db.execute(query, {"campaign_id": str(campaign_id)})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if not row.external_campaign_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign has not been submitted to Telnyx yet"
        )

    # Fetch from Telnyx
    try:
        decrypted_key = decrypt_api_key(row.api_key)
        service = TelnyxService(api_key=decrypted_key)
        campaign_data = await service.get_campaign(row.external_campaign_id)

        # Update local record
        update_query = text("""
            UPDATE telnyx_campaigns
            SET status = :status, updated_at = NOW()
            WHERE id = :campaign_id
        """)
        await db.execute(update_query, {
            "campaign_id": str(campaign_id),
            "status": campaign_data.get("status", "pending"),
        })
        await db.commit()

        return {"status": "synced", "campaign_status": campaign_data.get("status")}

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
