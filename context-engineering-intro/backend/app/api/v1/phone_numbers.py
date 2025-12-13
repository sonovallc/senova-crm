"""
Phone Number Management API endpoints

Features:
- Search available numbers
- Purchase numbers
- List owned numbers inventory
- Release numbers
- Assign to campaigns

RBAC Permissions:
- Owner: Full access (search, purchase, release)
- Admin: View numbers for their objects
- User: No access
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from pydantic import BaseModel, Field
import logging
import uuid as uuid_lib

from app.api.dependencies import CurrentUser, DatabaseSession
from app.services.telnyx_service import TelnyxService
from app.utils.encryption import decrypt_api_key
from app.core.exceptions import IntegrationError

router = APIRouter(prefix="/phone-numbers", tags=["Phone Numbers"])
logger = logging.getLogger(__name__)


# =========================================================================
# SCHEMAS
# =========================================================================

class AvailableNumberResponse(BaseModel):
    """Available number from search"""
    phone_number: str
    type: str
    region: Optional[str] = None
    locality: Optional[str] = None
    features: List[str]
    monthly_cost: Optional[str] = None
    upfront_cost: Optional[str] = None


class OwnedNumberResponse(BaseModel):
    """Owned phone number"""
    id: UUID
    phone_number: str
    friendly_name: Optional[str] = None
    external_id: Optional[str] = None
    messaging_profile_id: Optional[str] = None
    phone_number_type: Optional[str] = None
    capabilities: dict
    campaign_id: Optional[UUID] = None
    campaign_name: Optional[str] = None
    status: str
    object_id: UUID
    object_name: Optional[str] = None
    purchased_at: Optional[datetime] = None
    created_at: datetime


class SearchNumbersRequest(BaseModel):
    """Search available numbers request"""
    object_id: UUID = Field(..., description="Object to use for Telnyx credentials")
    area_code: Optional[str] = Field(None, min_length=3, max_length=3, description="3-digit area code")
    city: Optional[str] = Field(None, description="City name")
    state: Optional[str] = Field(None, max_length=2, description="State code (e.g., CA)")
    number_type: str = Field("local", description="local or toll_free")
    features: Optional[List[str]] = Field(None, description="Required features: sms, mms, voice")
    limit: int = Field(20, ge=1, le=100, description="Max results")


class PurchaseNumberRequest(BaseModel):
    """Purchase phone number request"""
    object_id: UUID = Field(..., description="Object (tenant) for this number")
    phone_number: str = Field(..., description="Phone number to purchase (E.164 format)")
    friendly_name: Optional[str] = Field(None, description="Display name for the number")


class UpdateNumberRequest(BaseModel):
    """Update phone number request"""
    friendly_name: Optional[str] = Field(None, description="Display name")
    campaign_id: Optional[UUID] = Field(None, description="10DLC campaign to assign")


# =========================================================================
# HELPER FUNCTIONS
# =========================================================================

async def get_telnyx_service(db: DatabaseSession, object_id: UUID) -> TelnyxService:
    """Get Telnyx service for an object"""
    query = text("""
        SELECT api_key, messaging_profile_id
        FROM object_telnyx_settings
        WHERE object_id = :object_id AND is_active = true
    """)
    result = await db.execute(query, {"object_id": str(object_id)})
    settings = result.fetchone()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telnyx settings not configured for this object"
        )

    decrypted_key = decrypt_api_key(settings.api_key)
    return TelnyxService(
        api_key=decrypted_key,
        messaging_profile_id=settings.messaging_profile_id,
    )


# =========================================================================
# ENDPOINTS
# =========================================================================

@router.post("/search", response_model=List[AvailableNumberResponse])
async def search_available_numbers(
    data: SearchNumbersRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Search for available phone numbers to purchase (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can search for phone numbers"
        )

    service = await get_telnyx_service(db, data.object_id)

    try:
        numbers = await service.search_available_numbers(
            area_code=data.area_code,
            city=data.city,
            state=data.state,
            number_type=data.number_type,
            features=data.features,
            limit=data.limit,
        )

        return [AvailableNumberResponse(**num) for num in numbers]

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/purchase", response_model=OwnedNumberResponse, status_code=status.HTTP_201_CREATED)
async def purchase_phone_number(
    data: PurchaseNumberRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Purchase a phone number (Owner only).
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can purchase phone numbers"
        )

    # Get Telnyx settings
    settings_query = text("""
        SELECT id, api_key, messaging_profile_id
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

    decrypted_key = decrypt_api_key(settings.api_key)
    service = TelnyxService(
        api_key=decrypted_key,
        messaging_profile_id=settings.messaging_profile_id,
    )

    # Purchase on Telnyx
    try:
        purchase_result = await service.purchase_number(
            phone_number=data.phone_number,
            messaging_profile_id=settings.messaging_profile_id,
        )
    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Get object name
    obj_query = text("SELECT name FROM objects WHERE id = :object_id")
    obj_result = await db.execute(obj_query, {"object_id": str(data.object_id)})
    obj = obj_result.fetchone()

    # Save to database
    number_id = uuid_lib.uuid4()
    insert_query = text("""
        INSERT INTO telnyx_phone_numbers (
            id, object_id, telnyx_settings_id, phone_number, external_id,
            messaging_profile_id, friendly_name, status, capabilities,
            purchased_at, created_at, updated_at
        )
        VALUES (
            :id, :object_id, :telnyx_settings_id, :phone_number, :external_id,
            :messaging_profile_id, :friendly_name, 'active', :capabilities,
            NOW(), NOW(), NOW()
        )
        RETURNING id, object_id, phone_number, external_id, messaging_profile_id,
                  friendly_name, phone_number_type, capabilities, campaign_id,
                  status, purchased_at, created_at
    """)

    result = await db.execute(insert_query, {
        "id": str(number_id),
        "object_id": str(data.object_id),
        "telnyx_settings_id": str(settings.id),
        "phone_number": data.phone_number,
        "external_id": purchase_result.get("phone_number_id"),
        "messaging_profile_id": settings.messaging_profile_id,
        "friendly_name": data.friendly_name,
        "capabilities": {"sms": True, "mms": True, "voice": True},
    })

    await db.commit()
    row = result.fetchone()

    return OwnedNumberResponse(
        id=row.id,
        phone_number=row.phone_number,
        friendly_name=row.friendly_name,
        external_id=row.external_id,
        messaging_profile_id=row.messaging_profile_id,
        phone_number_type=row.phone_number_type,
        capabilities=row.capabilities or {},
        campaign_id=row.campaign_id,
        campaign_name=None,
        status=row.status,
        object_id=data.object_id,
        object_name=obj.name if obj else None,
        purchased_at=row.purchased_at,
        created_at=row.created_at,
    )


@router.get("/", response_model=List[OwnedNumberResponse])
async def list_owned_numbers(
    db: DatabaseSession,
    current_user: CurrentUser,
    object_id: Optional[UUID] = None,
    status_filter: Optional[str] = None,
):
    """
    List owned phone numbers.

    - Owner: See all numbers
    - Admin: See numbers for objects they have access to
    - User: No access
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role == 'user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users cannot view phone numbers"
        )

    query = """
        SELECT
            tpn.id,
            tpn.phone_number,
            tpn.friendly_name,
            tpn.external_id,
            tpn.messaging_profile_id,
            tpn.phone_number_type,
            tpn.capabilities,
            tpn.campaign_id,
            tc.name as campaign_name,
            tpn.status,
            tpn.object_id,
            o.name as object_name,
            tpn.purchased_at,
            tpn.created_at
        FROM telnyx_phone_numbers tpn
        INNER JOIN objects o ON tpn.object_id = o.id
        LEFT JOIN telnyx_campaigns tc ON tpn.campaign_id = tc.id
    """

    params = {}
    conditions = []

    if user_role != 'owner':
        # Admin: Filter by objects they have access to
        query += " INNER JOIN object_users ou ON tpn.object_id = ou.object_id"
        conditions.append("ou.user_id = :user_id")
        params["user_id"] = str(current_user.id)

    if object_id:
        conditions.append("tpn.object_id = :object_id")
        params["object_id"] = str(object_id)

    if status_filter:
        conditions.append("tpn.status = :status_filter")
        params["status_filter"] = status_filter

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY tpn.created_at DESC"

    result = await db.execute(text(query), params)
    rows = result.fetchall()

    return [
        OwnedNumberResponse(
            id=row.id,
            phone_number=row.phone_number,
            friendly_name=row.friendly_name,
            external_id=row.external_id,
            messaging_profile_id=row.messaging_profile_id,
            phone_number_type=row.phone_number_type,
            capabilities=row.capabilities or {},
            campaign_id=row.campaign_id,
            campaign_name=row.campaign_name,
            status=row.status,
            object_id=row.object_id,
            object_name=row.object_name,
            purchased_at=row.purchased_at,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.get("/{number_id}", response_model=OwnedNumberResponse)
async def get_phone_number(
    number_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Get a specific phone number by ID."""
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role == 'user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Users cannot view phone numbers"
        )

    query = text("""
        SELECT
            tpn.id,
            tpn.phone_number,
            tpn.friendly_name,
            tpn.external_id,
            tpn.messaging_profile_id,
            tpn.phone_number_type,
            tpn.capabilities,
            tpn.campaign_id,
            tc.name as campaign_name,
            tpn.status,
            tpn.object_id,
            o.name as object_name,
            tpn.purchased_at,
            tpn.created_at
        FROM telnyx_phone_numbers tpn
        INNER JOIN objects o ON tpn.object_id = o.id
        LEFT JOIN telnyx_campaigns tc ON tpn.campaign_id = tc.id
        WHERE tpn.id = :number_id
    """)

    result = await db.execute(query, {"number_id": str(number_id)})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
        )

    # Check access for non-owners
    if user_role != 'owner':
        access_query = text("""
            SELECT 1 FROM object_users
            WHERE user_id = :user_id AND object_id = :object_id
        """)
        access_result = await db.execute(access_query, {
            "user_id": str(current_user.id),
            "object_id": str(row.object_id),
        })
        if not access_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this phone number"
            )

    return OwnedNumberResponse(
        id=row.id,
        phone_number=row.phone_number,
        friendly_name=row.friendly_name,
        external_id=row.external_id,
        messaging_profile_id=row.messaging_profile_id,
        phone_number_type=row.phone_number_type,
        capabilities=row.capabilities or {},
        campaign_id=row.campaign_id,
        campaign_name=row.campaign_name,
        status=row.status,
        object_id=row.object_id,
        object_name=row.object_name,
        purchased_at=row.purchased_at,
        created_at=row.created_at,
    )


@router.put("/{number_id}", response_model=OwnedNumberResponse)
async def update_phone_number(
    number_id: UUID,
    data: UpdateNumberRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """Update a phone number (Owner only)."""
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can update phone numbers"
        )

    updates = []
    params = {"number_id": str(number_id)}

    if data.friendly_name is not None:
        updates.append("friendly_name = :friendly_name")
        params["friendly_name"] = data.friendly_name

    if data.campaign_id is not None:
        updates.append("campaign_id = :campaign_id")
        params["campaign_id"] = str(data.campaign_id)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    updates.append("updated_at = NOW()")

    query = text(f"""
        UPDATE telnyx_phone_numbers
        SET {', '.join(updates)}
        WHERE id = :number_id
        RETURNING id, object_id, phone_number, friendly_name, external_id,
                  messaging_profile_id, phone_number_type, capabilities,
                  campaign_id, status, purchased_at, created_at
    """)

    result = await db.execute(query, params)
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
        )

    await db.commit()

    # Get related data
    obj_query = text("SELECT name FROM objects WHERE id = :object_id")
    obj_result = await db.execute(obj_query, {"object_id": str(row.object_id)})
    obj = obj_result.fetchone()

    campaign_name = None
    if row.campaign_id:
        campaign_query = text("SELECT name FROM telnyx_campaigns WHERE id = :campaign_id")
        campaign_result = await db.execute(campaign_query, {"campaign_id": str(row.campaign_id)})
        campaign = campaign_result.fetchone()
        campaign_name = campaign.name if campaign else None

    return OwnedNumberResponse(
        id=row.id,
        phone_number=row.phone_number,
        friendly_name=row.friendly_name,
        external_id=row.external_id,
        messaging_profile_id=row.messaging_profile_id,
        phone_number_type=row.phone_number_type,
        capabilities=row.capabilities or {},
        campaign_id=row.campaign_id,
        campaign_name=campaign_name,
        status=row.status,
        object_id=row.object_id,
        object_name=obj.name if obj else None,
        purchased_at=row.purchased_at,
        created_at=row.created_at,
    )


@router.delete("/{number_id}", status_code=status.HTTP_204_NO_CONTENT)
async def release_phone_number(
    number_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Release (cancel) a phone number (Owner only).
    This releases the number on Telnyx and marks it as released in our database.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can release phone numbers"
        )

    # Get the number details
    query = text("""
        SELECT
            tpn.id,
            tpn.external_id,
            tpn.object_id,
            ots.api_key
        FROM telnyx_phone_numbers tpn
        INNER JOIN object_telnyx_settings ots ON tpn.telnyx_settings_id = ots.id
        WHERE tpn.id = :number_id AND tpn.status = 'active'
    """)
    result = await db.execute(query, {"number_id": str(number_id)})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found or already released"
        )

    # Release on Telnyx
    if row.external_id:
        try:
            decrypted_key = decrypt_api_key(row.api_key)
            service = TelnyxService(api_key=decrypted_key)
            await service.release_number(row.external_id)
        except IntegrationError as e:
            logger.error(f"Failed to release number on Telnyx: {e}")
            # Continue to mark as released locally even if Telnyx fails

    # Mark as released in database
    update_query = text("""
        UPDATE telnyx_phone_numbers
        SET status = 'released', released_at = NOW(), updated_at = NOW()
        WHERE id = :number_id
    """)
    await db.execute(update_query, {"number_id": str(number_id)})
    await db.commit()


@router.post("/{number_id}/sync")
async def sync_phone_number(
    number_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    """
    Sync phone number details from Telnyx (Owner only).
    Updates capabilities and status from Telnyx API.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if user_role != 'owner':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can sync phone numbers"
        )

    # Get the number and Telnyx settings
    query = text("""
        SELECT
            tpn.id,
            tpn.external_id,
            ots.api_key
        FROM telnyx_phone_numbers tpn
        INNER JOIN object_telnyx_settings ots ON tpn.telnyx_settings_id = ots.id
        WHERE tpn.id = :number_id
    """)
    result = await db.execute(query, {"number_id": str(number_id)})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
        )

    if not row.external_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number has no external ID"
        )

    # Fetch from Telnyx
    try:
        decrypted_key = decrypt_api_key(row.api_key)
        service = TelnyxService(api_key=decrypted_key)
        numbers = await service.list_owned_numbers()

        # Find this number in the list
        telnyx_number = next(
            (n for n in numbers if n["id"] == row.external_id),
            None
        )

        if not telnyx_number:
            # Number not found on Telnyx, mark as released
            update_query = text("""
                UPDATE telnyx_phone_numbers
                SET status = 'released', released_at = NOW(), updated_at = NOW()
                WHERE id = :number_id
            """)
            await db.execute(update_query, {"number_id": str(number_id)})
            await db.commit()
            return {"status": "released", "message": "Number no longer exists on Telnyx"}

        # Update local record
        update_query = text("""
            UPDATE telnyx_phone_numbers
            SET
                messaging_profile_id = :messaging_profile_id,
                status = :status,
                updated_at = NOW()
            WHERE id = :number_id
        """)
        await db.execute(update_query, {
            "number_id": str(number_id),
            "messaging_profile_id": telnyx_number.get("messaging_profile_id"),
            "status": telnyx_number.get("status", "active"),
        })
        await db.commit()

        return {"status": "synced", "telnyx_status": telnyx_number.get("status")}

    except IntegrationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
