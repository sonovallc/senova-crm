import re
from typing import List, Dict, Tuple, Optional, Iterable, Any
from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact import Contact


MULTI_VALUE_SPLIT_REGEX = re.compile(r"[;,]")


def normalize_email(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    email = value.strip().lower()
    return email or None


def normalize_phone(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    phone = str(value).strip()
    if not phone:
        return None

    digits = re.sub(r"[^\d+]", "", phone).lstrip("+")

    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    if len(digits) == 10:
        return f"+1{digits}"

    return None


def explode_emails(value: Optional[str]) -> List[str]:
    if not value:
        return []

    chunks = MULTI_VALUE_SPLIT_REGEX.split(str(value))
    normalized = []
    for chunk in chunks:
        email = normalize_email(chunk)
        if email:
            normalized.append(email)
    return normalized


def explode_phones(value: Optional[str]) -> List[str]:
    if not value:
        return []

    chunks = MULTI_VALUE_SPLIT_REGEX.split(str(value))
    normalized = []
    for chunk in chunks:
        phone = normalize_phone(chunk)
        if phone:
            normalized.append(phone)
    return normalized


async def find_contacts_by_identifiers(
    db: AsyncSession,
    emails: List[str],
    phones: List[str],
) -> List[Contact]:
    filters = []
    if emails:
        filters.append(func.lower(Contact.email).in_(emails))
    if phones:
        filters.append(Contact.normalized_phone.in_(phones))

    if not filters:
        return []

    query = select(Contact).where(
        Contact.is_active.is_(True),
        or_(*filters)
    )
    result = await db.execute(query)
    return result.scalars().all()


class DuplicateMatch:
    def __init__(self, contacts: List[Contact]):
        self.contacts = contacts

    @property
    def status(self) -> str:
        if not self.contacts:
            return "none"
        if len(self.contacts) == 1:
            return "single"
        return "multiple"

    @property
    def contact(self) -> Optional[Contact]:
        return self.contacts[0] if self.contacts else None


async def classify_contact(
    db: AsyncSession,
    emails: List[str],
    phones: List[str],
) -> DuplicateMatch:
    contacts = await find_contacts_by_identifiers(db, emails, phones)
    return DuplicateMatch(contacts)


def summarize_contact(contact: Contact) -> Dict[str, Optional[str]]:
    return {
        "id": str(contact.id),
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "email": contact.email,
        "phone": contact.phone,
        "company": contact.company,
        "status": contact.status.value if contact.status else None,
        "assigned_to_id": str(contact.assigned_to_id) if contact.assigned_to_id else None,
    }


def apply_normalized_identifiers(data: Dict[str, any]) -> Dict[str, any]:
    if "phone" in data and data["phone"]:
        data["normalized_phone"] = normalize_phone(data["phone"])
    elif "normalized_phone" in data and not data["normalized_phone"]:
        data["normalized_phone"] = None
    return data


def compute_field_diffs(
    contact: Contact,
    incoming: Dict[str, Any],
    fields: Iterable[str],
) -> List[Dict[str, Any]]:
    diffs: List[Dict[str, Any]] = []
    for field in fields:
        existing_value = getattr(contact, field, None)
        incoming_value = incoming.get(field)
        is_equal = (existing_value == incoming_value)
        diffs.append(
            {
                "field": field,
                "existing_value": existing_value,
                "incoming_value": incoming_value,
                "is_equal": is_equal,
            }
        )
    return diffs


async def load_contact(db: AsyncSession, contact_id: str) -> Optional[Contact]:
    try:
        uuid_val = UUID(contact_id)
    except Exception:
        return None
    result = await db.execute(select(Contact).where(Contact.id == uuid_val))
    return result.scalar_one_or_none()


async def detect_identifier_conflicts(
    db: AsyncSession,
    target_contact_id: Optional[UUID],
    contact_data: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Detect whether the provided identifiers (primary email / phone) belong to other active contacts.
    """
    conflicts: List[Dict[str, Any]] = []

    normalized_email = normalize_email(contact_data.get("email"))
    normalized_phone = contact_data.get("normalized_phone")
    if not normalized_phone and contact_data.get("phone"):
        normalized_phone = normalize_phone(contact_data.get("phone"))

    def build_conflict(field: str, value: Optional[str], contact: Contact) -> Dict[str, Any]:
        display_name = " ".join(filter(None, [contact.first_name, contact.last_name])).strip()
        if not display_name:
            display_name = contact.email or contact.phone or "Existing contact"
        return {
            "field": field,
            "value": value,
            "conflicting_contact_id": str(contact.id),
            "conflicting_contact_name": display_name,
        }

    if normalized_email:
        query = select(Contact).where(
            Contact.is_active.is_(True),
            func.lower(Contact.email) == normalized_email,
        )
        if target_contact_id:
            query = query.where(Contact.id != target_contact_id)
        result = await db.execute(query)
        conflict = result.scalar_one_or_none()
        if conflict:
            conflicts.append(build_conflict("primary_email", normalized_email, conflict))

    if normalized_phone:
        query = select(Contact).where(
            Contact.is_active.is_(True),
            Contact.normalized_phone == normalized_phone,
        )
        if target_contact_id:
            query = query.where(Contact.id != target_contact_id)
        result = await db.execute(query)
        conflict = result.scalar_one_or_none()
        if conflict:
            conflicts.append(build_conflict("primary_phone", normalized_phone, conflict))

    return conflicts
