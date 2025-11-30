"""
Contact Import Service

Handles validation and bulk import of contacts from uploaded files.
With lenient validation strategy and auto-formatting.
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from sqlalchemy import select, and_, or_, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.models.contact import Contact, ContactStatus, ContactSource
from app.models.contact_tag import ContactTag
from app.models.tag import Tag
from app.models.user import User
from app.services.contact_dedupe import (
    explode_emails,
    explode_phones,
    normalize_email,
    normalize_phone,
    summarize_contact,
    apply_normalized_identifiers,
    compute_field_diffs,
    find_contacts_by_identifiers,
    load_contact,
    detect_identifier_conflicts,
)
from app.services.activity_logger import ActivityLogger

logger = logging.getLogger(__name__)


class ValidationError:
    """Represents a validation error for a specific row"""

    def __init__(self, row_num: int, field: str, message: str, row_data: Dict[str, Any]):
        self.row_num = row_num
        self.field = field
        self.message = message
        self.row_data = row_data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "row_num": self.row_num,
            "field": self.field,
            "message": self.message,
            "row_data": self.row_data
        }


class ImportResult:
    """Result of contact import operation"""

    def __init__(self):
        self.imported = 0
        self.updated = 0
        self.skipped = 0
        self.failed = 0
        self.errors: List[ValidationError] = []
        self.conflicts: List[Dict[str, Any]] = []
        # Track IDs of contacts created during this import so the UI can apply follow-up actions
        self.imported_contact_ids: List[str] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "imported": self.imported,
            "updated": self.updated,
            "skipped": self.skipped,
            "failed": self.failed,
            "errors": [e.to_dict() for e in self.errors],
             "conflicts": self.conflicts,
            "imported_contact_ids": self.imported_contact_ids,
        }


class ValidationSummary:
    """Classification output for validation phase"""

    def __init__(self):
        self.total = 0
        self.new_rows: List[Dict[str, Any]] = []
        self.duplicate_rows: List[Dict[str, Any]] = []
        self.conflict_rows: List[Dict[str, Any]] = []
        self.invalid_rows: List[ValidationError] = []
        self.preview_rows: List[Dict[str, Any]] = []
        self.row_data_map: Dict[int, Dict[str, Any]] = {}
        self.preview_map: Dict[int, Dict[str, Any]] = {}
        self.identifiers: Dict[int, Dict[str, List[str]]] = {}
        self.duplicate_contact_map: Dict[int, Contact] = {}
        self.conflict_contact_map: Dict[int, List[Contact]] = {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total": self.total,
            "new_rows": self.new_rows,
            "duplicate_rows": self.duplicate_rows,
            "conflict_rows": self.conflict_rows,
            "invalid_rows": [err.to_dict() for err in self.invalid_rows],
            "preview_rows": self.preview_rows,
            "summary": {
                "new": len(self.new_rows),
                "duplicates": len(self.duplicate_rows),
                "conflicts": len(self.conflict_rows),
                "invalid": len(self.invalid_rows),
            },
        }


class IdentifierConflictError(Exception):
    """Raised when a payload would violate unique identifier constraints."""

    def __init__(self, conflicts: List[Dict[str, Any]]):
        super().__init__("Identifier conflict")
        self.conflicts = conflicts


class ContactImporter:
    """Service for importing contacts from file data with lenient validation"""

    COMPARE_FIELDS = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "company",
        "job_title",
        "department",
        "city",
        "state",
    ]

    # Field mapping from import columns to Contact model fields
    FIELD_MAPPINGS = {
        "first_name": "first_name",
        "last_name": "last_name",
        "email": "email",
        "phone": "phone",
        "mobile_phone": "mobile_phone",
        "company": "company",
        "company_name": "company_name",
        "job_title": "job_title",
        "person_title": "job_title",
        "street_address": "street_address",
        "city": "city",
        "state": "state",
        "zip_code": "zip_code",
        "country": "country",
        "notes": "notes",
        "direct_number": "direct_number",
        "personal_phone": "personal_phone",
        "business_email": "business_email",
        "department": "department",
        "linkedin_url": "linkedin_url",
        "facebook_url": "facebook_url",
        "twitter_url": "twitter_url",
        "interests": "interests",
        "referral_source": "referral_source",
    }

    # Field maximum character lengths based on database schema
    FIELD_MAX_LENGTHS = {
        # VARCHAR(2)
        'company_state': 2,
        'personal_state': 2,
        'skiptrace_state': 2,
        # VARCHAR(4)
        'personal_zip4': 4,
        # VARCHAR(10)
        'company_naics': 10,
        'company_sic': 10,
        'company_zip': 10,
        'personal_zip': 10,
        'skiptrace_ethnic_code': 10,
        'skiptrace_language_code': 10,
        'skiptrace_zip': 10,
        # VARCHAR(20)
        'age_range': 20,
        'company_phone': 20,
        'direct_number': 20,
        'gender': 20,
        'mobile_phone': 20,
        'personal_phone': 20,
        'phone': 20,
        'skiptrace_b2b_phone': 20,
        'skiptrace_credit_rating': 20,
        'zip_code': 20,
        # VARCHAR(45)
        'skiptrace_ip': 45,
        # VARCHAR(50)
        'children': 50,
        'company_revenue': 50,
        'creation_source': 50,
        'income_range': 50,
        'net_worth': 50,
        'seniority_level': 50,
        'state': 50,
        # VARCHAR(64)
        'sha256_business_email': 64,
        'sha256_personal_email': 64,
        # VARCHAR(100)
        'city': 100,
        'company_city': 100,
        'company_industry': 100,
        'country': 100,
        'department': 100,
        'first_name': 100,
        'last_name': 100,
        'personal_city': 100,
        'pipeline_stage': 100,
        'skiptrace_b2b_source': 100,
        'skiptrace_city': 100,
        'source_form_id': 100,
        # VARCHAR(200)
        'company': 200,
        'street_address': 200,
        # VARCHAR(255)
        'business_email': 255,
        'company_address': 255,
        'company_domain': 255,
        'company_name': 255,
        'email': 255,
        'job_title': 255,
        'personal_address': 255,
        'referral_source': 255,
        'skiptrace_address': 255,
        'skiptrace_b2b_address': 255,
        'skiptrace_b2b_website': 255,
        'skiptrace_name': 255,
        'source_form_name': 255,
        'utm_campaign': 255,
        'utm_content': 255,
        'utm_medium': 255,
        'utm_source': 255,
        'utm_term': 255,
        # VARCHAR(500)
        'company_linkedin_url': 500,
        'facebook_url': 500,
        'linkedin_url': 500,
        'twitter_url': 500,
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def is_sha256_field(field_name: str) -> bool:
        """Check if field is a SHA256 hash field (not an email)"""
        return 'sha256' in field_name.lower()

    @staticmethod
    def parse_boolean(value: str) -> bool | None:
        """
        Convert string to boolean, handling comma-separated values.

        Args:
            value (str): String value like "Y", "N", "Y, Y, Y", etc.

        Returns:
            bool | None: True for "Y", False for "N", None for empty/invalid
        """
        if not value or not isinstance(value, str):
            return None

        # Handle comma-separated values (take first value)
        first_value = value.split(',')[0].strip().upper()

        if first_value == 'Y' or first_value == 'YES' or first_value == 'TRUE' or first_value == '1':
            return True
        elif first_value == 'N' or first_value == 'NO' or first_value == 'FALSE' or first_value == '0':
            return False
        else:
            return None

    @staticmethod
    def build_preview(row: Dict[str, Any], field_mapping: Dict[str, str]) -> Dict[str, Any]:
        preview = {}
        for csv_column, contact_field in field_mapping.items():
            if contact_field in ContactImporter.COMPARE_FIELDS:
                preview[contact_field] = row.get(csv_column)
        return preview

    @staticmethod
    def extract_identifiers(
        row: Dict[str, Any],
        field_mapping: Dict[str, str]
    ) -> Tuple[List[str], List[str]]:
        emails: List[str] = []
        phones: List[str] = []

        for csv_column, contact_field in field_mapping.items():
            value = row.get(csv_column)
            if not value:
                continue

            field_lower = contact_field.lower()
            if 'email' in field_lower and 'sha256' not in field_lower and 'dnc' not in field_lower:
                emails.extend(explode_emails(value))
            elif ('phone' in field_lower or 'number' in field_lower) and 'dnc' not in field_lower and 'company' not in field_lower:
                phones.extend(explode_phones(value))

        # CRITICAL FIX: Filter out empty/whitespace-only values before deduplication
        # This ensures no empty strings slip through from any source
        emails = [e for e in emails if e and e.strip()]
        phones = [p for p in phones if p and p.strip()]

        # Deduplicate while preserving order
        unique_emails = list(dict.fromkeys(emails))
        unique_phones = list(dict.fromkeys(phones))
        return unique_emails, unique_phones

    def map_row_to_contact(
        self,
        row: Dict[str, Any],
        reverse_mapping: Dict[str, str],
        field_mapping: Dict[str, str],
    ) -> Dict[str, Any]:
        contact_data: Dict[str, Any] = {}
        overflow_data: Dict[str, Any] = {}
        has_email = False
        has_phone = False
        primary_email = None
        primary_phone = None

        for contact_field, csv_column in reverse_mapping.items():
            value = row.get(csv_column)
            if not value:
                continue

            field_lower = contact_field.lower()

            if 'email' in field_lower:
                if self.is_sha256_field(contact_field):
                    hashes = self.parse_comma_delimited(value)
                    if hashes:
                        self.explode_sha256_hashes(contact_field, hashes, contact_data)
                else:
                    emails = self.parse_comma_delimited(value)
                    if emails:
                        self.explode_emails(contact_field, emails, contact_data)
                        has_email = True
                        if not primary_email:
                            primary_email = normalize_email(emails[0])

            elif ('phone' in field_lower or 'number' in field_lower) and 'dnc' not in field_lower:
                phones = self.parse_comma_delimited(value)
                if phones:
                    dnc_field = f"{contact_field}_dnc"
                    dnc_values: List[bool] = []
                    dnc_csv_column = None
                    for csv_col, mapped_field in field_mapping.items():
                        if mapped_field == dnc_field:
                            dnc_csv_column = csv_col
                            break
                    if dnc_csv_column and dnc_csv_column in row:
                        dnc_value_str = row.get(dnc_csv_column)
                        if dnc_value_str:
                            dnc_strings = self.parse_comma_delimited(dnc_value_str)
                            for dnc_str in dnc_strings:
                                dnc_bool = self.parse_boolean(dnc_str)
                                dnc_values.append(dnc_bool if dnc_bool is not None else False)

                    self.explode_phone_with_dnc(contact_field, phones, dnc_values, contact_data)
                    has_phone = True
                    if not primary_phone:
                        normalized = normalize_phone(phones[0])
                        if normalized:
                            primary_phone = normalized

            elif ('dnc' in field_lower or field_lower in ['homeowner', 'married', 'is_active']):
                if contact_field in contact_data:
                    continue
                bool_value = self.parse_boolean(value)
                if bool_value is not None:
                    contact_data[contact_field] = bool_value

            elif field_lower in [
                'social_connections',
                'company_employee_count',
                'company_revenue',
                'inferred_years_experience',
                'skiptrace_match_score',
                'skiptrace_exact_age',
                'lead_score'
            ]:
                value_str = str(value).strip()
                try:
                    if ' to ' in value_str.lower():
                        numeric_value = int(value_str.split(' to ')[0].strip())
                    elif '-' in value_str and not value_str.startswith('+'):
                        numeric_value = int(value_str.split('-')[0].strip())
                    elif '+' in value_str:
                        numeric_value = int(value_str.replace('+', '').strip())
                    else:
                        numeric_value = int(value_str)
                    contact_data[contact_field] = numeric_value
                except (ValueError, AttributeError):
                    continue

            else:
                if isinstance(value, str):
                    max_length = self.FIELD_MAX_LENGTHS.get(contact_field, 255)
                    contact_data[contact_field] = value[:max_length]
                else:
                    contact_data[contact_field] = value

        contact_data['overflow_data'] = overflow_data

        if primary_email:
            contact_data['email'] = primary_email
        if primary_phone:
            contact_data['phone'] = primary_phone
            contact_data['normalized_phone'] = primary_phone
        elif 'phone' in contact_data:
            normalized = normalize_phone(contact_data['phone'])
            if normalized:
                contact_data['normalized_phone'] = normalized

        # CRITICAL FIX: Ensure state fields never exceed 2 characters
        for state_field in ['personal_state', 'company_state', 'skiptrace_state', 'state']:
            if state_field in contact_data and isinstance(contact_data[state_field], str):
                contact_data[state_field] = contact_data[state_field][:2]

        return {
            "contact_data": contact_data,
            "has_email": has_email,
            "has_phone": has_phone,
            "primary_email": primary_email,
            "primary_phone": primary_phone,
        }

    async def classify_rows(
        self,
        rows: List[Dict[str, Any]],
        field_mapping: Dict[str, str],
    ) -> ValidationSummary:
        summary = ValidationSummary()
        summary.total = len(rows)

        row_identifiers: Dict[int, Dict[str, List[str]]] = {}
        unique_emails: set[str] = set()
        unique_phones: set[str] = set()

        # First pass: gather identifiers and invalid rows
        for idx, row in enumerate(rows, start=2):
            emails, phones = self.extract_identifiers(row, field_mapping)
            row_id = idx
            row_identifiers[row_id] = {"emails": emails, "phones": phones}

            if not emails and not phones:
                summary.invalid_rows.append(
                    ValidationError(
                        row_num=row_id,
                        field="email/phone",
                        message="Row has no usable email or phone",
                        row_data=row,
                    )
                )
                continue

            summary.identifiers[row_id] = {"emails": emails, "phones": phones}
            unique_emails.update(emails)
            unique_phones.update(phones)

        # PHASE 2: Detect intra-file duplicates (duplicates WITHIN the CSV file)
        # Build index of which rows use which email/phone identifiers
        email_to_rows: Dict[str, List[int]] = {}
        phone_to_rows: Dict[str, List[int]] = {}
        intra_file_duplicate_rows: set[int] = set()

        for row_id, identifiers in summary.identifiers.items():
            for email in identifiers["emails"]:
                # CRITICAL FIX: Never index empty strings as duplicate identifiers
                if email and email.strip():
                    email_to_rows.setdefault(email, []).append(row_id)
            for phone in identifiers["phones"]:
                # CRITICAL FIX: Never index empty strings as duplicate identifiers
                if phone and phone.strip():
                    phone_to_rows.setdefault(phone, []).append(row_id)

        # Mark rows as intra-file duplicates if they share email/phone with other rows in the CSV
        # Keep the FIRST occurrence, mark subsequent occurrences as duplicates
        for email, row_ids in email_to_rows.items():
            if len(row_ids) > 1:
                # Keep first occurrence (row_ids[0]), mark the rest as duplicates
                for duplicate_row_id in row_ids[1:]:
                    intra_file_duplicate_rows.add(duplicate_row_id)

        for phone, row_ids in phone_to_rows.items():
            if len(row_ids) > 1:
                # Keep first occurrence (row_ids[0]), mark the rest as duplicates
                for duplicate_row_id in row_ids[1:]:
                    intra_file_duplicate_rows.add(duplicate_row_id)

        # Remove intra-file duplicates from unique sets so we don't query for them
        for duplicate_row_id in intra_file_duplicate_rows:
            identifiers = summary.identifiers[duplicate_row_id]
            for email in identifiers["emails"]:
                # Only remove if this is NOT the first occurrence
                row_ids = email_to_rows.get(email, [])
                if row_ids and row_ids[0] != duplicate_row_id:
                    unique_emails.discard(email)
            for phone in identifiers["phones"]:
                # Only remove if this is NOT the first occurrence
                row_ids = phone_to_rows.get(phone, [])
                if row_ids and row_ids[0] != duplicate_row_id:
                    unique_phones.discard(phone)

        # CRITICAL FIX: Filter out empty identifiers before database queries
        # This is a final safety check before querying the database
        unique_emails = {e for e in unique_emails if e and e.strip()}
        unique_phones = {p for p in unique_phones if p and p.strip()}

        # Fetch existing contacts once
        email_contact_map: Dict[str, Contact] = {}
        phone_contact_map: Dict[str, Contact] = {}

        if unique_emails:
            for chunk in self._chunk_list(list(unique_emails)):
                query = select(Contact).where(
                    Contact.is_active.is_(True),
                    func.lower(Contact.email).in_(chunk),
                )
                result = await self.db.execute(query)
                for contact in result.scalars().all():
                    if contact.email:
                        email_contact_map[contact.email.lower()] = contact

        if unique_phones:
            for chunk in self._chunk_list(list(unique_phones)):
                query = select(Contact).where(
                    Contact.is_active.is_(True),
                    Contact.normalized_phone.in_(chunk),
                )
                result = await self.db.execute(query)
                for contact in result.scalars().all():
                    if contact.normalized_phone:
                        phone_contact_map[contact.normalized_phone] = contact

        for idx, row in enumerate(rows, start=2):
            row_id = idx
            identifiers = summary.identifiers.get(row_id)
            if not identifiers:
                continue  # invalid row already recorded

            emails = identifiers["emails"]
            phones = identifiers["phones"]
            preview = self.build_preview(row, field_mapping)
            summary.row_data_map[row_id] = row
            summary.preview_map[row_id] = preview

            # Check if this row is an intra-file duplicate
            if row_id in intra_file_duplicate_rows:
                # Find which identifier caused the duplicate and the first occurrence
                duplicate_reason = []
                first_occurrence_row_id = None

                for email in emails:
                    if email in email_to_rows and len(email_to_rows[email]) > 1:
                        first_occurrence_row_id = email_to_rows[email][0]
                        duplicate_reason.append(f"email '{email}' (first appears in row {first_occurrence_row_id})")

                for phone in phones:
                    if phone in phone_to_rows and len(phone_to_rows[phone]) > 1:
                        first_occurrence_row_id = phone_to_rows[phone][0]
                        duplicate_reason.append(f"phone '{phone}' (first appears in row {first_occurrence_row_id})")

                # Treat as a duplicate with special indicator
                summary.duplicate_rows.append({
                    "row_id": row_id,
                    "existing_contact": None,  # No existing contact - it's an intra-file duplicate
                    "existing_contact_id": None,
                    "incoming_data": preview,
                    "field_diffs": [],  # Empty array - no field diffs for intra-file duplicates
                    "match_keys": {
                        "emails": emails,
                        "phones": phones,
                    },
                    "duplicate_type": "intra_file",  # Special marker for intra-file duplicates
                    "duplicate_reason": "; ".join(duplicate_reason),
                    "first_occurrence_row_id": first_occurrence_row_id,
                })
                continue  # Skip database lookup for intra-file duplicates

            matches = set()
            matched_emails: List[str] = []
            matched_phones: List[str] = []

            for email in emails:
                contact = email_contact_map.get(email)
                if contact:
                    matches.add(contact)
                    matched_emails.append(email)

            for phone in phones:
                contact = phone_contact_map.get(phone)
                if contact:
                    matches.add(contact)
                    matched_phones.append(phone)

            total_matches = len(matches)

            if total_matches == 0:
                summary.new_rows.append({
                    "row_id": row_id,
                    "preview": preview,
                })
                if len(summary.preview_rows) < 5:
                    summary.preview_rows.append(preview)

            elif total_matches == 1:
                contact = next(iter(matches))
                field_diffs = compute_field_diffs(contact, preview, self.COMPARE_FIELDS)
                summary.duplicate_rows.append({
                    "row_id": row_id,
                    "existing_contact": summarize_contact(contact),
                    "existing_contact_id": str(contact.id),
                    "incoming_data": preview,
                    "field_diffs": field_diffs,
                    "match_keys": {
                        "emails": matched_emails,
                        "phones": matched_phones,
                    },
                })
                summary.duplicate_contact_map[row_id] = contact

            else:
                candidates = [
                    summarize_contact(contact)
                    for contact in matches
                ]

                summary.conflict_rows.append({
                    "row_id": row_id,
                    "incoming_data": preview,
                    "candidates": candidates,
                    "match_keys": {
                        "emails": matched_emails,
                        "phones": matched_phones,
                    },
                })
                summary.conflict_contact_map[row_id] = list(matches)

        return summary

    @staticmethod
    def _chunk_list(values: List[str], chunk_size: int = 5000):
        for i in range(0, len(values), chunk_size):
            yield values[i:i + chunk_size]

    @staticmethod
    def validate_email(email: str, field_name: str = "") -> bool:
        """
        Validate email format or comma-delimited list of emails.
        Returns True if ANY email in the list is valid.

        IMPORTANT: SHA256 fields are NOT emails and should not be validated as such.

        Args:
            email (str): Single email or comma-delimited list like "a@ex.com, b@ex.com"
            field_name (str): Name of the field (to check if it's SHA256)

        Returns:
            bool: True if at least one valid email found
        """
        # Handle None, NaN, and non-string values
        if email is None or (isinstance(email, float) and str(email) == 'nan'):
            return False

        # Convert to string if not already
        email_str = str(email).strip()

        if not email_str or email_str == 'nan':
            return False

        # SHA256 fields contain 64-char hex hashes, not emails
        if ContactImporter.is_sha256_field(field_name):
            # Accept 64-character hexadecimal strings
            if len(email_str) == 64 and re.match(r'^[a-fA-F0-9]{64}$', email_str):
                return True
            return False

        # Split by comma to handle multiple emails
        emails = [e.strip() for e in email_str.split(',')]

        # Email validation regex (RFC 5322 simplified)
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        # Return True if ANY email is valid
        for email_item in emails:
            if email_item and re.match(pattern, email_item):
                return True

        return False

    @staticmethod
    def format_phone_number(phone: str) -> Optional[str]:
        """
        Auto-format phone number to international format: +1XXXXXXXXXX

        Handles various input formats:
        - 9493461731 -> +19493461731
        - (949) 346-1731 -> +19493461731
        - 949-346-1731 -> +19493461731
        - +1 949 346 1731 -> +19493461731
        - 1-949-346-1731 -> +19493461731

        Args:
            phone (str): Phone number in any format

        Returns:
            Optional[str]: Formatted phone as +1XXXXXXXXXX or None if invalid
        """
        # Handle None, NaN, and non-string values
        if phone is None or (isinstance(phone, float) and str(phone) == 'nan'):
            return None

        # Convert to string if not already
        phone = str(phone).strip()

        if not phone or phone == 'nan':
            return None

        # Remove all non-digit characters except leading +
        digits = re.sub(r'[^\d+]', '', phone)

        # Remove + for processing
        digits = digits.lstrip('+')

        # Handle different lengths
        if len(digits) == 11 and digits.startswith('1'):
            # Already has country code: 19493461731 -> +19493461731
            return f"+{digits}"
        elif len(digits) == 10:
            # No country code: 9493461731 -> +19493461731
            return f"+1{digits}"
        else:
            # Invalid length - cannot format to US number
            return None

    @staticmethod
    def validate_phone(phone_value) -> bool:
        """
        Validate phone number or comma-delimited list of phones.
        Returns True if ANY phone in the list is valid.

        Args:
            phone_value: Single phone or comma-delimited list like "+1234567890, +0987654321"

        Returns:
            bool: True if at least one valid phone found (10-11 digits for US numbers)
        """
        if not phone_value:
            return False

        # Convert to string and check for empty/nan
        phone_str = str(phone_value).strip()
        if phone_str in ['', 'nan', 'None', 'null']:
            return False

        # Split by comma to handle multiple phones
        phones = [p.strip() for p in phone_str.split(',')]

        # Check each phone
        for phone in phones:
            if phone:
                # Remove all non-digit characters (parentheses, spaces, dashes, plus)
                cleaned = re.sub(r'[^0-9]', '', phone)
                # US phone numbers: 10-11 digits (with or without country code)
                if 10 <= len(cleaned) <= 11:
                    return True

        return False

    @staticmethod
    def collect_unique_identifiers_from_row(
        row_data: Dict[str, Any],
        email_columns: List[str],
        phone_columns: List[str],
        csv_to_contact_mapping: Dict[str, str]
    ) -> tuple[List[str], List[str]]:
        """
        Extract ALL unique emails and phones from a CSV row.

        This handles:
        1. Multiple email/phone columns
        2. Comma-delimited values within columns
        3. Deduplication within the same row

        Args:
            row_data: Dictionary of CSV column → value
            email_columns: List of CSV columns that contain emails
            phone_columns: List of CSV columns that contain phones
            csv_to_contact_mapping: CSV column → Contact field mapping (e.g., {"BUSINESS_EMAIL": "business_email"})

        Returns:
            (unique_emails, unique_phones) - Ordered de-duplicated values from THIS row
        """
        unique_emails: List[str] = []
        email_seen = set()
        unique_phones: List[str] = []
        phone_seen = set()

        # Collect all emails from all email columns
        for email_col in email_columns:
            value = row_data.get(email_col, '')
            if not value or value in ['', 'nan', 'None', 'null']:
                continue

            # Get the contact field this CSV column maps to
            contact_field = csv_to_contact_mapping.get(email_col, '')
            if not contact_field or ContactImporter.is_sha256_field(contact_field):
                continue

            # Split by comma and validate each
            emails = [e.strip() for e in str(value).split(',')]
            for email in emails:
                if not email:
                    continue
                if ContactImporter.validate_email(email, contact_field):
                    normalized = email.lower().strip()
                    if normalized not in email_seen:
                        email_seen.add(normalized)
                        unique_emails.append(normalized)
                    # Only consider first valid email per column (matches explode_emails behavior)
                    break

        # Collect all phones from all phone columns
        for phone_col in phone_columns:
            value = row_data.get(phone_col, '')
            if not value or value in ['', 'nan', 'None', 'null']:
                continue

            # Split by comma and validate each
            phones = [p.strip() for p in str(value).split(',')]
            for phone in phones:
                if phone and ContactImporter.validate_phone(phone):
                    # Normalize phone (remove formatting)
                    cleaned = re.sub(r'[^0-9]', '', phone)
                    if len(cleaned) >= 10:
                        if cleaned not in phone_seen:
                            phone_seen.add(cleaned)
                            unique_phones.append(cleaned)
                        # Only use first valid phone per column
                        break

        return unique_emails, unique_phones

    @staticmethod
    def parse_comma_delimited(value: str) -> List[str]:
        """
        Parse comma-delimited values into list.

        Args:
            value (str): Comma-delimited string

        Returns:
            List[str]: List of values, trimmed
        """
        # Handle None, NaN, and non-string values
        if value is None or (isinstance(value, float) and str(value) == 'nan'):
            return []

        # Convert to string if not already
        value = str(value).strip()

        if not value or value == 'nan':
            return []

        return [v.strip() for v in value.split(',') if v.strip()]

    @staticmethod
    def is_list_data_field(field_name: str) -> bool:
        """
        Determine if a field contains list data (should explode comma-delimited values)
        vs prose data (should keep as single string).

        List data fields: phones, emails, SHA256 hashes
        Prose data fields: descriptions, notes, headlines, etc.

        Args:
            field_name (str): Name of the field

        Returns:
            bool: True if field contains list data
        """
        field_lower = field_name.lower()

        # List data patterns
        list_patterns = ['phone', 'email', 'sha256', 'number']

        # Prose data patterns (NOT list data)
        prose_patterns = ['description', 'note', 'headline', 'history', 'skill', 'interest']

        # Check if it's prose first (higher priority)
        if any(pattern in field_lower for pattern in prose_patterns):
            return False

        # Check if it's list data
        if any(pattern in field_lower for pattern in list_patterns):
            return True

        return False

    def explode_phone_with_dnc(
        self,
        base_field: str,
        phone_values: List[str],
        dnc_values: List[bool],
        contact_data: Dict[str, Any]
    ) -> None:
        """
        Explode comma-delimited phone values into separate fields with DNC pairing.

        Args:
            base_field (str): Base field name (e.g., "mobile_phone", "direct_number")
            phone_values (List[str]): List of phone numbers
            dnc_values (List[bool]): List of DNC flags matching phones
            contact_data (Dict): Contact data dictionary to update
        """
        # CRITICAL FIX: Generic "phone" and "valid_phones" fields don't have phone_2, phone_3, etc.
        # Only explode specific phone types: mobile_phone, personal_phone, direct_number, company_phone
        explodable_fields = ['mobile_phone', 'personal_phone', 'direct_number', 'company_phone']

        if base_field in ['phone', 'valid_phones']:
            # Generic phone/valid_phones fields - only use first value, rest goes to overflow
            if phone_values:
                formatted = self.format_phone_number(phone_values[0])
                if formatted:
                    contact_data[base_field] = formatted[:20]  # Store in the actual field name
                    # Put remaining phones in overflow_data
                    if len(phone_values) > 1:
                        if 'overflow_data' not in contact_data:
                            contact_data['overflow_data'] = {}
                        overflow_key = f'additional_{base_field}'
                        contact_data['overflow_data'][overflow_key] = [
                            self.format_phone_number(p) for p in phone_values[1:] if self.format_phone_number(p)
                        ]
            return

        # Process up to 30 phone numbers (base + 2-30) for explodable fields
        for idx, phone in enumerate(phone_values[:30]):
            formatted = self.format_phone_number(phone)
            if not formatted:
                continue

            # Truncate to 20 chars
            formatted = formatted[:20]

            # Determine field name
            if idx == 0:
                phone_field = base_field
                dnc_field = f"{base_field}_dnc"
            else:
                phone_field = f"{base_field}_{idx + 1}"
                dnc_field = f"{base_field}_{idx + 1}_dnc"

            # Set phone value
            contact_data[phone_field] = formatted

            # Set DNC value if available
            if idx < len(dnc_values):
                contact_data[dnc_field] = dnc_values[idx]

    def explode_emails(
        self,
        base_field: str,
        email_values: List[str],
        contact_data: Dict[str, Any]
    ) -> None:
        """
        Explode comma-delimited email values into separate fields.

        Args:
            base_field (str): Base field name (e.g., "business_email", "personal_email")
            email_values (List[str]): List of email addresses
            contact_data (Dict): Contact data dictionary to update
        """
        # CRITICAL FIX: Some fields are TEXT (not explodable, not JSONB) - store only first value
        # Examples: personal_emails, business_emails, personal_verified_emails, business_verified_emails, email
        non_explodable_fields = [
            'personal_emails',
            'business_emails',
            'personal_verified_emails',
            'business_verified_emails',
            'email'  # Generic email field also doesn't have _2, _3
        ]

        if base_field in non_explodable_fields:
            # These are TEXT fields - store only the FIRST valid email as a string
            if email_values:
                for email in email_values:
                    if self.validate_email(email, base_field):
                        contact_data[base_field] = email[:255]
                        break  # Only store the first valid email
            return

        # Only explode specific singular email types: business_email, personal_email, personal_verified_email, business_verified_email
        # Process up to 30 emails for explodable fields
        for idx, email in enumerate(email_values[:30]):
            if not self.validate_email(email, base_field):
                continue

            # Truncate to 255 chars
            email = email[:255]

            # Determine field name
            if idx == 0:
                email_field = base_field
            else:
                email_field = f"{base_field}_{idx + 1}"

            # Set email value
            contact_data[email_field] = email

    def explode_sha256_hashes(
        self,
        base_field: str,
        hash_values: List[str],
        contact_data: Dict[str, Any]
    ) -> None:
        """
        Explode comma-delimited SHA256 hash values into separate fields.

        Args:
            base_field (str): Base field name (e.g., "sha256_personal_email", "sha256_business_email")
            hash_values (List[str]): List of SHA256 hashes (64 hex chars each)
            contact_data (Dict): Contact data dictionary to update
        """
        # Process up to 30 hashes
        for idx, hash_val in enumerate(hash_values[:30]):
            # Validate SHA256 format (64 hex characters)
            hash_str = str(hash_val).strip()
            if not (len(hash_str) == 64 and re.match(r'^[a-fA-F0-9]{64}$', hash_str)):
                continue

            # Determine field name
            if idx == 0:
                hash_field = base_field
            else:
                hash_field = f"{base_field}_{idx + 1}"

            # Set hash value
            contact_data[hash_field] = hash_str

    async def validate_rows(
        self,
        rows: List[Dict[str, Any]],
        field_mapping: Dict[str, str]
    ) -> ValidationSummary:
        """
        Validate and classify rows using dedupe rules.
        """
        return await self.classify_rows(rows, field_mapping)

    async def check_duplicate_email(self, email: str) -> Optional[Contact]:
        """
        Check if contact with email already exists among ACTIVE contacts.

        Args:
            email (str): Email to check

        Returns:
            Optional[Contact]: Existing contact or None
        """
        result = await self.db.execute(
            select(Contact).where(
                and_(
                    Contact.email == email,
                    Contact.is_active.is_(True)
                )
            )
        )
        return result.scalar_one_or_none()

    async def check_duplicate_phone(self, phone: str) -> Optional[Contact]:
        """
        Check if a phone number already exists in the database (active contacts only).

        Args:
            phone: Normalized phone number (digits only)

        Returns:
            Contact object if found, None otherwise
        """
        if not phone:
            return None

        # Check all phone fields for matches
        result = await self.db.execute(
            select(Contact).where(
                and_(
                    or_(
                        Contact.direct_number.ilike(f"%{phone}%"),
                        Contact.mobile_phone.ilike(f"%{phone}%"),
                        Contact.personal_phone.ilike(f"%{phone}%")
                    ),
                    Contact.is_active.is_(True)
                )
            )
        )
        return result.scalar_one_or_none()

    async def import_contacts(
        self,
        rows: List[Dict[str, Any]],
        field_mapping: Dict[str, str],
        user_id: UUID,
        tag_ids: Optional[List[str]] = None,
        summary: Optional[ValidationSummary] = None,
        merge_decisions: Optional[List[Dict[str, Any]]] = None,
    ) -> ImportResult:
        """
        Execute import by creating new contacts and merging duplicates.
        """
        logger.info(f"🔍 DEBUG: import_contacts called with {len(rows)} rows")
        summary = summary or await self.classify_rows(rows, field_mapping)
        tag_ids = tag_ids or []
        decision_map = {
            decision["row_id"]: decision
            for decision in (merge_decisions or [])
        }
        reverse_mapping = {v: k for k, v in field_mapping.items()}
        result = ImportResult()
        actor_user = None
        if user_id:
            actor_user = await self.db.get(User, user_id)

        # Count invalid rows immediately
        result.skipped += len(summary.invalid_rows)

        # Helper to fetch row data
        def get_row(row_id: int) -> Optional[Dict[str, Any]]:
            return summary.row_data_map.get(row_id)

        # Process brand NEW rows (no duplicate found)
        # Use batch processing to avoid greenlet exhaustion with large imports
        BATCH_SIZE = 100
        new_row_count = len(summary.new_rows)

        for batch_start in range(0, new_row_count, BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, new_row_count)
            batch = summary.new_rows[batch_start:batch_end]

            logger.info(f"Processing batch {batch_start//BATCH_SIZE + 1}/{(new_row_count + BATCH_SIZE - 1)//BATCH_SIZE}: rows {batch_start+1}-{batch_end} of {new_row_count}")

            for entry in batch:
                row_id = entry["row_id"]
                row = get_row(row_id)
                if not row:
                    continue

                mapped = self.map_row_to_contact(row, reverse_mapping, field_mapping)
                contact_payload = mapped["contact_data"]
                if not (mapped["has_email"] or mapped["has_phone"]):
                    result.skipped += 1
                    result.errors.append(
                        ValidationError(
                            row_num=row_id,
                            field="email/phone",
                            message="Row has no valid email or phone - SKIPPED",
                            row_data=row,
                        )
                    )
                    continue

                try:
                    new_contact = await self._create_contact(contact_payload, user_id)
                    added_tags = await self._apply_tags_to_contact(new_contact.id, tag_ids, user_id)
                    # Don't commit yet - will batch commit below
                    await self.db.flush()  # Flush to get IDs but don't commit
                    await self.db.refresh(new_contact)
                    result.imported += 1
                    result.imported_contact_ids.append(str(new_contact.id))
                except IntegrityError:
                    await self.db.rollback()
                    # CRITICAL FIX: Apply normalization before resolving to ensure normalized_phone is set
                    normalized_payload = apply_normalized_identifiers(contact_payload.copy())
                    existing = await self._resolve_existing_contact_from_payload(normalized_payload)
                    if not existing:
                        raise
                    try:
                        await self._merge_existing_contact(
                            existing,
                            contact_payload,
                            {"action": "update", "field_overrides": {field: "incoming" for field in contact_payload}},
                            tag_ids,
                            user_id,
                            actor_user,
                        )
                        await self.db.flush()  # Flush but don't commit
                        result.updated += 1
                    except IdentifierConflictError as conflict:
                        await self.db.rollback()
                        result.failed += 1
                        for conflict_entry in conflict.conflicts:
                            result.conflicts.append(
                                {
                                    "row_id": row_id,
                                    "contact_id": str(existing.id),
                                    **conflict_entry,
                                }
                            )

            # Commit this batch
            logger.info(f"Committing batch {batch_start//BATCH_SIZE + 1}")
            await self.db.commit()

        # Process duplicate/conflict rows with batching
        rows_for_update = summary.duplicate_rows + summary.conflict_rows
        update_row_count = len(rows_for_update)

        for batch_start in range(0, update_row_count, BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, update_row_count)
            batch = rows_for_update[batch_start:batch_end]

            logger.info(f"Processing update batch {batch_start//BATCH_SIZE + 1}/{(update_row_count + BATCH_SIZE - 1)//BATCH_SIZE}: rows {batch_start+1}-{batch_end} of {update_row_count}")

            for entry in batch:
                row_id = entry["row_id"]
                decision = decision_map.get(row_id)
                if not decision or decision.get("action") == "skip":
                    result.skipped += 1
                    continue

                existing_contact_id = decision.get("existing_contact_id")
                contact = None
                if existing_contact_id:
                    contact = await load_contact(self.db, existing_contact_id)
                if not contact and summary.duplicate_contact_map.get(row_id):
                    contact = await load_contact(self.db, summary.duplicate_contact_map[row_id].id)
                if not contact and summary.conflict_contact_map.get(row_id):
                    contact = await load_contact(self.db, summary.conflict_contact_map[row_id][0].id)

                if not contact:
                    result.errors.append(
                        ValidationError(
                            row_num=row_id,
                            field="duplicate",
                            message="Unable to resolve duplicate contact for row",
                            row_data=get_row(row_id) or {},
                        )
                    )
                    result.skipped += 1
                    continue

                row = get_row(row_id)
                if not row:
                    result.skipped += 1
                    continue

                mapped = self.map_row_to_contact(row, reverse_mapping, field_mapping)
                try:
                    await self._merge_existing_contact(
                        contact,
                        mapped["contact_data"],
                        decision,
                        tag_ids,
                        user_id,
                        actor_user,
                    )
                    await self.db.flush()  # Flush but don't commit yet
                    result.updated += 1
                except IdentifierConflictError as conflict:
                    await self.db.rollback()
                    result.failed += 1
                    for conflict_entry in conflict.conflicts:
                        result.conflicts.append(
                            {
                                "row_id": row_id,
                                "contact_id": str(contact.id),
                                **conflict_entry,
                            }
                        )
                except IntegrityError:
                    await self.db.rollback()
                    # CRITICAL FIX: Apply normalization before resolving to ensure normalized_phone is set
                    normalized_payload = apply_normalized_identifiers(mapped["contact_data"].copy())
                    fallback = await self._resolve_existing_contact_from_payload(normalized_payload)
                    if not fallback or fallback.id == contact.id:
                        raise
                    try:
                        await self._merge_existing_contact(
                            fallback,
                            mapped["contact_data"],
                            decision,
                            tag_ids,
                            user_id,
                            actor_user,
                        )
                        await self.db.flush()  # Flush but don't commit yet
                        result.updated += 1
                    except IdentifierConflictError as conflict:
                        await self.db.rollback()
                        result.failed += 1
                        for conflict_entry in conflict.conflicts:
                            result.conflicts.append(
                                {
                                    "row_id": row_id,
                                    "contact_id": str(fallback.id),
                                    **conflict_entry,
                                }
                            )

            # Commit this update batch
            logger.info(f"Committing update batch {batch_start//BATCH_SIZE + 1}")
            await self.db.commit()

        logger.info(
            f"🔍 DEBUG: Import result - imported={result.imported}, updated={result.updated}, skipped={result.skipped}"
        )
        return result

    async def _create_contact(self, contact_data: Dict[str, Any], user_id: UUID) -> Contact:
        payload = apply_normalized_identifiers(contact_data.copy())
        payload.setdefault("status", ContactStatus.LEAD)
        payload.setdefault("source", ContactSource.OTHER)
        payload.setdefault("assigned_to_id", user_id)
        payload.setdefault("is_active", True)
        new_contact = Contact(**payload)
        self.db.add(new_contact)
        await self.db.flush()
        return new_contact

    async def _apply_tags_to_contact(self, contact_id: UUID, tag_ids: List[str], user_id: UUID) -> List[Tag]:
        added_tags: List[Tag] = []
        if not tag_ids:
            return added_tags

        for tag_id in tag_ids:
            try:
                tag_uuid = UUID(tag_id)
            except ValueError:
                continue
            existing = await self.db.execute(
                select(ContactTag).where(
                    ContactTag.contact_id == contact_id,
                    ContactTag.tag_id == tag_uuid,
                )
            )
            if existing.scalar_one_or_none():
                continue

            tag = await self.db.get(Tag, tag_uuid)
            if not tag:
                continue

            self.db.add(ContactTag(contact_id=contact_id, tag_id=tag_uuid, added_by=user_id))
            added_tags.append(tag)

        return added_tags

    async def _resolve_existing_contact_from_payload(self, contact_data: Dict[str, Any]) -> Optional[Contact]:
        emails = []
        phones = []
        if contact_data.get("email"):
            emails.append(contact_data["email"].lower())
        if contact_data.get("normalized_phone"):
            phones.append(contact_data["normalized_phone"])
        matches = await find_contacts_by_identifiers(self.db, emails, phones)
        return matches[0] if matches else None

    async def _merge_existing_contact(
        self,
        contact: Contact,
        incoming_data: Dict[str, Any],
        decision: Dict[str, Any],
        tag_ids: List[str],
        user_id: UUID,
        actor_user: Optional[User],
    ) -> None:
        payload = apply_normalized_identifiers(incoming_data.copy())
        overrides = decision.get("field_overrides", {})
        default_choice = decision.get("default_choice", "existing")

        planned_updates: Dict[str, Any] = {}
        for field, value in payload.items():
            choice = overrides.get(field, default_choice)
            if choice != "incoming":
                continue
            planned_updates[field] = value

        original_snapshot = {
            field: getattr(contact, field)
            for field in planned_updates.keys()
        }

        candidate_snapshot = {
            "email": planned_updates.get("email", contact.email),
            "phone": planned_updates.get("phone", contact.phone),
        }
        candidate_snapshot["normalized_phone"] = planned_updates.get(
            "normalized_phone",
            normalize_phone(planned_updates["phone"]) if "phone" in planned_updates else contact.normalized_phone,
        )

        conflicts = await detect_identifier_conflicts(
            self.db,
            contact.id,
            candidate_snapshot,
        )
        if conflicts:
            raise IdentifierConflictError(conflicts)

        for field, value in planned_updates.items():
            setattr(contact, field, value)
            if field == "phone" and "normalized_phone" not in planned_updates:
                normalized_value = normalize_phone(value)
                contact.normalized_phone = normalized_value or contact.normalized_phone

        await self.db.flush()
        added_tags = await self._apply_tags_to_contact(contact.id, tag_ids, user_id)

        # TEMPORARILY DISABLED: Activity logging causes excessive commits during bulk import
        # TODO: Re-enable after implementing batch activity logging
        # if planned_updates:
        #     updated_snapshot = {field: getattr(contact, field) for field in planned_updates.keys()}
        #     changes = ActivityLogger.diff_fields(original_snapshot, updated_snapshot)
        #     if changes:
        #         await ActivityLogger.log_contact_updated(
        #             self.db,
        #             contact=contact,
        #             user=actor_user,
        #             changes=changes,
        #         )

        # if added_tags:
        #     for tag in added_tags:
        #         await ActivityLogger.log_tag_added(
        #             self.db,
        #             contact=contact,
        #             tag=tag,
        #             user=actor_user,
        #         )

    @staticmethod
    def generate_error_report(errors: List[ValidationError]) -> str:
        """
        Generate CSV error report from validation errors.

        Args:
            errors (List[ValidationError]): List of validation errors

        Returns:
            str: CSV content with errors
        """
        if not errors:
            return ""

        # Build CSV
        lines = ["Row Number,Field,Error Message,Row Data"]

        for error in errors:
            row_data_str = str(error.row_data).replace('"', '""')  # Escape quotes
            lines.append(
                f"{error.row_num},{error.field},\"{error.message}\",\"{row_data_str}\""
            )

        return "\n".join(lines)
