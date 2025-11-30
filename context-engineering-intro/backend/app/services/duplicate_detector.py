"""
Internal Duplicate Detection Service - Stage 1 Only

Detects duplicates WITHIN uploaded CSV (same column matching only).
Does NOT check against existing database contacts yet.
"""

import re
from typing import Dict, List, Set, Tuple, Optional
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

# Multi-value field separator regex (comma or semicolon)
MULTI_VALUE_SPLIT_REGEX = re.compile(r"[;,]")

# Fields to check for duplicates (SAME COLUMN ONLY - Stage 1)
DUPLICATE_CHECK_FIELDS = [
    "DIRECT_NUMBER",
    "MOBILE_PHONE",
    "PERSONAL_PHONE",
    "SKIPTRACE_WIRELESS_NUMBERS",
    "PERSONAL_EMAILS",
    "PERSONAL_VERIFIED_EMAILS",
    "BUSINESS_EMAIL",
    "BUSINESS_VERIFIED_EMAILS",
]


def normalize_phone(value: Optional[str]) -> Optional[str]:
    """Normalize phone number to +1XXXXXXXXXX format"""
    if not value:
        return None

    phone = str(value).strip()
    if not phone:
        return None

    # Remove all non-digit characters except +
    digits = re.sub(r"[^\d+]", "", phone).lstrip("+")

    # Format to E.164
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    if len(digits) == 10:
        return f"+1{digits}"

    return None


def normalize_email(value: Optional[str]) -> Optional[str]:
    """Normalize email to lowercase"""
    if not value:
        return None
    email = value.strip().lower()
    return email or None


def explode_field(field_name: str, value: Optional[str]) -> List[str]:
    """
    Parse comma/semicolon-separated values into individual items.

    Handles multi-value fields like:
    - MOBILE_PHONE: "+1234567890, +0987654321"
    - PERSONAL_EMAILS: "email1@test.com, email2@test.com"

    Returns list of normalized values (empty values filtered out).
    """
    if not value:
        return []

    chunks = MULTI_VALUE_SPLIT_REGEX.split(str(value))
    normalized = []

    # Determine if this is a phone or email field
    is_phone_field = any(x in field_name.upper() for x in ["PHONE", "NUMBER"])
    is_email_field = any(x in field_name.upper() for x in ["EMAIL"])

    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue

        if is_phone_field:
            norm = normalize_phone(chunk)
            if norm:
                normalized.append(norm)
        elif is_email_field:
            norm = normalize_email(chunk)
            if norm:
                normalized.append(norm)
        else:
            # For other fields, just use trimmed value
            if chunk:
                normalized.append(chunk)

    return normalized


def detect_internal_duplicates(rows: List[Dict], field_mapping: Dict[str, str]) -> Dict:
    """
    Detect internal duplicates within CSV rows (Stage 1 only).

    Args:
        rows: List of parsed CSV rows
        field_mapping: Mapping of CSV columns to contact fields

    Returns:
        {
            "duplicate_groups": [
                {
                    "group_id": "mobile_phone_+15551234567",
                    "field": "MOBILE_PHONE",
                    "value": "+15551234567",
                    "row_ids": [0, 3, 7],
                    "rows": [<row data>...]
                },
                ...
            ],
            "total_duplicates": 9,
            "total_groups": 3
        }
    """

    # Reverse mapping: contact field -> CSV column
    reverse_mapping = {v: k for k, v in field_mapping.items()}

    # Track values across rows: {field: {value: [row_indices]}}
    value_tracker: Dict[str, Dict[str, List[int]]] = defaultdict(lambda: defaultdict(list))

    # Process each row
    for row_idx, row in enumerate(rows):
        for field in DUPLICATE_CHECK_FIELDS:
            # Get CSV column name for this field
            csv_column = reverse_mapping.get(field.lower())
            if not csv_column or csv_column not in row:
                continue

            # Get raw value
            raw_value = row[csv_column]
            if not raw_value:
                continue

            # Explode multi-value fields
            values = explode_field(field, raw_value)

            # Track each value
            for value in values:
                if value:  # Only track non-empty values
                    value_tracker[field][value].append(row_idx)

    # Find duplicate groups (values that appear in 2+ rows)
    duplicate_groups = []

    for field, value_dict in value_tracker.items():
        for value, row_indices in value_dict.items():
            if len(row_indices) >= 2:  # Duplicate found!
                group_id = f"{field.lower()}_{value.replace('@', '_at_').replace('+', '_plus_').replace('.', '_dot_')}"

                # Get full row data for each duplicate
                duplicate_rows = [
                    {
                        "row_id": idx,
                        "data": rows[idx]
                    }
                    for idx in row_indices
                ]

                duplicate_groups.append({
                    "group_id": group_id,
                    "field": field,
                    "value": value,
                    "row_ids": row_indices,
                    "row_count": len(row_indices),
                    "rows": duplicate_rows
                })

    # Count total duplicate rows (some rows may be in multiple groups)
    all_duplicate_row_ids = set()
    for group in duplicate_groups:
        all_duplicate_row_ids.update(group["row_ids"])

    result = {
        "duplicate_groups": duplicate_groups,
        "total_duplicates": len(all_duplicate_row_ids),
        "total_groups": len(duplicate_groups),
        "validation_id": None  # Will be set by API endpoint
    }

    logger.info(f"[DUPLICATE DETECTION] Found {len(duplicate_groups)} groups with {len(all_duplicate_row_ids)} duplicate rows")

    return result


async def detect_external_duplicates(
    rows: List[Dict],
    field_mapping: Dict[str, str],
    db_session
) -> Dict:
    """
    Detect duplicates between CSV rows and existing database contacts (Stage 2).

    Compares CSV data against existing CRM contacts using same-column matching.
    For each duplicate field (phone/email), checks if any CSV value matches
    existing contacts in the database.

    Args:
        rows: List of parsed CSV rows
        field_mapping: Mapping of CSV columns to contact fields
        db_session: Database session for querying contacts

    Returns:
        {
            "external_groups": [
                {
                    "duplicate_group_id": "ext_0",
                    "duplicate_type": "external",
                    "duplicate_field": "MOBILE_PHONE",
                    "duplicate_value": "+15551234567",
                    "csv_rows": [{"csv_row_index": 0, "data": {...}}],
                    "existing_contacts": [{"contact_id": "uuid", "data": {...}}]
                }
            ],
            "total_external_groups": 2
        }
    """
    from app.models.contact import Contact
    from sqlalchemy import select, or_

    # Map to database field names (lowercase)
    DUPLICATE_FIELDS_DB = [
        'direct_number',
        'mobile_phone',
        'personal_phone',
        'skiptrace_wireless_numbers',
        'personal_emails',
        'personal_verified_emails',
        'business_email',
        'business_verified_emails'
    ]

    # Reverse mapping: contact field -> CSV column
    reverse_mapping = {v: k for k, v in field_mapping.items()}

    external_groups = []
    group_id = 0

    logger.info(f"[EXTERNAL DETECTION] Starting external duplicate detection for {len(rows)} rows")

    for db_field in DUPLICATE_FIELDS_DB:
        # Get CSV column name for this field
        csv_column = reverse_mapping.get(db_field)
        if not csv_column:
            continue

        # Collect all values from CSV for this field
        csv_values = set()
        csv_row_map = {}  # value -> [row indices with data]

        for idx, row in enumerate(rows):
            if csv_column not in row:
                continue

            raw_value = row[csv_column]
            if not raw_value:
                continue

            # Explode multi-value fields
            values = explode_field(db_field.upper(), raw_value)

            for value in values:
                if value:
                    csv_values.add(value)
                    if value not in csv_row_map:
                        csv_row_map[value] = []
                    csv_row_map[value].append(idx)

        if not csv_values:
            continue

        logger.info(f"[EXTERNAL DETECTION] Checking {db_field}: {len(csv_values)} unique values")

        # CRITICAL FIX: Batch queries to avoid PostgreSQL parameter limit (32767)
        # Process in chunks of 500 values to stay well under the limit
        BATCH_SIZE = 500
        csv_values_list = list(csv_values)
        contacts = []

        for batch_start in range(0, len(csv_values_list), BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, len(csv_values_list))
            batch_values = csv_values_list[batch_start:batch_end]

            logger.info(f"[EXTERNAL DETECTION] Processing batch {batch_start//BATCH_SIZE + 1}: {len(batch_values)} values")

            # Query database for matching contacts in this batch
            # Build OR condition for batch values only
            conditions = []
            for value in batch_values:
                # Use ILIKE for case-insensitive matching
                conditions.append(getattr(Contact, db_field).ilike(f"%{value}%"))

            if conditions:
                result = await db_session.execute(
                    select(Contact).where(or_(*conditions)).where(Contact.is_active == True)
                )
                batch_contacts = result.scalars().all()
                contacts.extend(batch_contacts)
                logger.info(f"[EXTERNAL DETECTION] Batch {batch_start//BATCH_SIZE + 1}: Found {len(batch_contacts)} matching contacts")

        logger.info(f"[EXTERNAL DETECTION] Total found {len(contacts)} matching contacts for {db_field}")

        # Group by matching value
        for contact in contacts:
            contact_field_value = getattr(contact, db_field)
            if not contact_field_value:
                continue

            # Parse contact's field value
            contact_values = explode_field(db_field.upper(), contact_field_value)

            for value in contact_values:
                if value in csv_row_map:
                    # Found external duplicate!
                    external_groups.append({
                        'duplicate_group_id': f'ext_{group_id}',
                        'duplicate_type': 'external',
                        'duplicate_field': db_field.upper(),
                        'duplicate_value': value,
                        'csv_rows': [
                            {
                                'csv_row_index': idx,
                                'data': rows[idx]
                            }
                            for idx in csv_row_map[value]
                        ],
                        'existing_contacts': [
                            {
                                'contact_id': str(contact.id),
                                'data': {
                                    'first_name': contact.first_name,
                                    'last_name': contact.last_name,
                                    'mobile_phone': contact.mobile_phone,
                                    'personal_phone': contact.personal_phone,
                                    'direct_number': contact.direct_number,
                                    'personal_emails': contact.personal_emails,
                                    'business_email': contact.business_email,
                                    'company': contact.company,
                                    'job_title': contact.job_title,
                                    'status': contact.status.value if contact.status else None,
                                },
                                'last_updated': contact.updated_at.isoformat() if contact.updated_at else None
                            }
                        ]
                    })
                    group_id += 1
                    logger.info(f"[EXTERNAL DETECTION] Match found: {db_field}={value} in row(s) {csv_row_map[value]} and contact {contact.id}")

    logger.info(f"[EXTERNAL DETECTION] Found {len(external_groups)} external duplicate groups")

    return {
        'external_groups': external_groups,
        'total_external_groups': len(external_groups)
    }
