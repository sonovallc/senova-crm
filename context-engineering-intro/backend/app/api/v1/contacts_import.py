"""
Contact Import API Endpoints

Features:
- Upload CSV/Excel files for bulk contact import
- Validate imported data with field mapping
- Execute contact import with auto-assignment to uploader
- Download sample CSV template
"""

import os
import uuid
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List, Literal
from datetime import datetime

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import io

from app.config.database import get_db
from app.api.dependencies import get_current_user, CurrentUser, DatabaseSession
from app.utils.file_parser import (
    parse_csv,
    parse_excel,
    get_column_headers,
    get_preview_data,
    FileParserError
)
from app.services.contact_importer import ContactImporter
from app.models.field_visibility import FieldVisibility
from app.services.duplicate_detector import detect_internal_duplicates

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/contacts/import", tags=["Contact Import"])


# Temporary storage for uploaded files
UPLOAD_DIR = Path("/tmp/crm_imports")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class FieldMappingRequest(BaseModel):
    """Request model for field mapping"""
    file_id: str
    field_mapping: Dict[str, str]  # CSV column -> Contact field


class DuplicateResolution(BaseModel):
    row_id: int
    action: Literal["update", "skip"]
    existing_contact_id: Optional[str] = None
    field_overrides: Dict[str, Any] = {}


class ImportExecuteRequest(BaseModel):
    """Request model for executing import"""
    file_id: str
    field_mapping: Dict[str, str]
    tag_ids: Optional[List[str]] = []
    merge_decisions: List[DuplicateResolution] = []


@router.post("/upload")
async def upload_file(
    current_user: CurrentUser,
    file: UploadFile = File(...)
):
    """
    Upload CSV or Excel file for import.

    Returns file_id and column headers for mapping.

    Requires authentication
    """
    # Validate file type
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ['.csv', '.xlsx', '.xls']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only CSV and Excel files are supported."
        )

    # Validate file size (100MB limit)
    contents = await file.read()
    file_size_mb = len(contents) / (1024 * 1024)
    if file_size_mb > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large ({file_size_mb:.1f}MB). Maximum size is 100MB."
        )

    try:
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{file_id}{file_ext}"

        # Save file
        with open(file_path, 'wb') as f:
            f.write(contents)

        # Get column headers
        headers = get_column_headers(str(file_path))

        # Get preview data (first 3 rows)
        preview = get_preview_data(str(file_path), num_rows=3)

        return {
            "file_id": file_id,
            "filename": file.filename,
            "columns": headers,
            "preview": preview,
            "row_count": len(preview)  # Approximate, will get exact count during validation
        }

    except FileParserError as e:
        # Clean up file if parsing failed
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error parsing file: {str(e)}"
        )
    except Exception as e:
        # Clean up file on error
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )


@router.post("/validate")
async def validate_import(
    current_user: CurrentUser,
    data: FieldMappingRequest,
    db: DatabaseSession
):
    """
    Validate imported data with field mapping.

    Returns preview data and validation results.

    Requires authentication
    """
    # Find uploaded file
    file_paths = list(UPLOAD_DIR.glob(f"{data.file_id}.*"))

    if not file_paths:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file not found. Please upload again."
        )

    file_path = file_paths[0]
    file_ext = file_path.suffix.lower()

    try:
        # Parse file
        if file_ext == '.csv':
            rows = parse_csv(str(file_path))
        elif file_ext in ['.xlsx', '.xls']:
            rows = parse_excel(str(file_path))
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format"
            )

        importer = ContactImporter(db)
        summary = await importer.validate_rows(rows, data.field_mapping)

        return summary.to_dict()

    except FileParserError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error parsing file: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating import: {str(e)}"
        )


@router.post("/validate-duplicates")
async def validate_duplicates(
    current_user: CurrentUser,
    data: FieldMappingRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate imported data with field mapping and detect duplicates.

    Returns ValidationSummary with:
    - new_rows: Rows that don't match any existing contacts
    - duplicate_rows: Rows that match exactly one existing contact
    - conflict_rows: Rows that match multiple existing contacts
    - invalid_rows: Rows with validation errors

    Requires authentication
    """
    # Find uploaded file
    file_paths = list(UPLOAD_DIR.glob(f"{data.file_id}.*"))

    if not file_paths:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file not found. Please upload again."
        )

    file_path = file_paths[0]
    file_ext = file_path.suffix.lower()

    try:
        # Parse file
        if file_ext == '.csv':
            rows = parse_csv(str(file_path))
        elif file_ext in ['.xlsx', '.xls']:
            rows = parse_excel(str(file_path))
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format"
            )

        logger.info(f"[DUPLICATE DETECTION] Validating {len(rows)} rows")

        # Use ContactImporter to validate and classify rows
        importer = ContactImporter(db)
        summary = await importer.validate_rows(rows, data.field_mapping)

        logger.info(f"[VALIDATION COMPLETE] New: {len(summary.new_rows)}, Duplicates: {len(summary.duplicate_rows)}, Conflicts: {len(summary.conflict_rows)}, Invalid: {len(summary.invalid_rows)}")

        return summary.to_dict()

    except FileParserError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error parsing file: {str(e)}"
        )
    except Exception as e:
        logger.error(f"[VALIDATION] Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating import: {str(e)}"
        )


# ===== MILESTONE 2: Duplicate Decision Endpoints =====


class DuplicateDecision(BaseModel):
    """Model for user decision on a duplicate group"""
    duplicate_group_id: str
    csv_row_indices: List[int]
    action: Literal["skip", "keep", "merge"]
    existing_contact_id: Optional[str] = None


class DuplicateDecisionsRequest(BaseModel):
    """Request model for saving duplicate decisions"""
    validation_id: str
    decisions: List[DuplicateDecision]


@router.post("/duplicate-decisions")
async def save_duplicate_decisions(
    current_user: CurrentUser,
    data: DuplicateDecisionsRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Store user decisions for duplicate handling.

    Each decision specifies what action to take for a duplicate group:
    - skip: Don't import these rows
    - keep: Import as new contacts (ignore existing matches)
    - merge: Merge CSV data with existing contacts

    Requires authentication
    """
    from app.models.contact import CSVDuplicateCache

    try:
        saved_count = 0
        for decision in data.decisions:
            # Determine duplicate type from group_id prefix
            duplicate_type = 'internal' if decision.duplicate_group_id.startswith('int_') else 'external'

            for row_idx in decision.csv_row_indices:
                cache_entry = CSVDuplicateCache(
                    validation_id=data.validation_id,
                    duplicate_group_id=decision.duplicate_group_id,
                    duplicate_type=duplicate_type,
                    duplicate_field='MOBILE_PHONE',  # Default field - populated from detection
                    duplicate_value='',  # Default empty - populated from detection
                    csv_row_index=row_idx,
                    user_decision=decision.action,
                    existing_contact_id=decision.existing_contact_id
                )
                db.add(cache_entry)
                saved_count += 1

        await db.commit()
        logger.info(f"[DUPLICATE DECISIONS] Saved {saved_count} decisions for validation {data.validation_id}")

        return {
            "status": "success",
            "decisions_saved": len(data.decisions),
            "rows_affected": saved_count
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"[DUPLICATE DECISIONS] Error saving decisions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving decisions: {str(e)}"
        )


class ImportWithDecisionsRequest(BaseModel):
    """Request model for importing with decisions"""
    validation_id: str
    file_id: str
    field_mapping: Dict[str, str]


@router.post("/import-with-decisions")
async def import_with_decisions(
    current_user: CurrentUser,
    data: ImportWithDecisionsRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Execute import based on stored duplicate decisions.

    Processes each row according to the user's decision:
    - skip: Ignored, not imported
    - keep: Imported as new contact
    - merge: Merged with existing contact using merge algorithm

    Requires authentication
    """
    from app.models.contact import CSVDuplicateCache, Contact
    from app.services.contact_merger import merge_internal_duplicates, merge_external_duplicate

    try:
        logger.info(f"=== IMPORT EXECUTION START ===")
        logger.info(f"User: {current_user.email}")
        logger.info(f"Validation ID: {data.validation_id}")
        logger.info(f"File ID: {data.file_id}")
        logger.info(f"Field mapping keys: {list(data.field_mapping.keys())[:10]}...")  # First 10 only

        # Get all decisions for this validation
        logger.info(f"Step 1: Fetching decisions from cache")
        result = await db.execute(
            select(CSVDuplicateCache).where(
                CSVDuplicateCache.validation_id == data.validation_id
            )
        )
        decisions = result.scalars().all()
        logger.info(f"Step 1 Complete: Found {len(decisions)} decisions")

        if not decisions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No decisions found for this validation ID"
            )

        # Load CSV file
        logger.info(f"Step 2: Loading CSV file")
        file_paths = list(UPLOAD_DIR.glob(f"{data.file_id}.*"))
        if not file_paths:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Uploaded file not found"
            )

        file_path = file_paths[0]
        file_ext = file_path.suffix.lower()
        logger.info(f"Step 2: Found file: {file_path}")

        # Parse CSV
        logger.info(f"Step 3: Parsing CSV file")
        if file_ext == '.csv':
            rows = parse_csv(str(file_path))
        elif file_ext in ['.xlsx', '.xls']:
            rows = parse_excel(str(file_path))
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format"
            )
        logger.info(f"Step 3 Complete: Parsed {len(rows)} rows from CSV")

        # Process decisions
        results = {
            'new_contacts': 0,
            'skipped': 0,
            'merged': 0,
            'errors': 0
        }

        logger.info(f"Step 4: Processing {len(decisions)} decisions")

        # CRITICAL FIX: Track which row indices we've already processed
        # A single row can appear in multiple duplicate groups (e.g., phone matches in 3 different phone fields)
        # We must only create ONE contact per unique row, not one per cache entry
        processed_row_indices = set()

        for idx, decision in enumerate(decisions):
            if idx % 100 == 0:
                logger.info(f"  Progress: {idx}/{len(decisions)} decisions processed")

            try:
                if decision.user_decision == 'skip':
                    results['skipped'] += 1

                elif decision.user_decision == 'keep':
                    # CRITICAL FIX: Skip if we've already processed this row index
                    if decision.csv_row_index in processed_row_indices:
                        logger.debug(f"[STEP 4] Skipping row {decision.csv_row_index} - already processed in another duplicate group")
                        continue

                    # Mark this row as processed
                    processed_row_indices.add(decision.csv_row_index)
                    # Create new contact from CSV row
                    csv_row = rows[decision.csv_row_index]

                    # Map CSV row to Contact model fields
                    contact_data = {}
                    for csv_col, db_field in data.field_mapping.items():
                        if csv_col in csv_row and csv_row[csv_col]:
                            contact_data[db_field] = csv_row[csv_col]

                    # Convert Y/N to boolean for boolean fields
                    boolean_fields = [
                        'homeowner', 'married',
                        'mobile_phone_dnc', 'mobile_phone_2_dnc', 'mobile_phone_3_dnc', 'mobile_phone_4_dnc', 'mobile_phone_5_dnc',
                        'mobile_phone_6_dnc', 'mobile_phone_7_dnc', 'mobile_phone_8_dnc', 'mobile_phone_9_dnc', 'mobile_phone_10_dnc',
                        'mobile_phone_11_dnc', 'mobile_phone_12_dnc', 'mobile_phone_13_dnc', 'mobile_phone_14_dnc', 'mobile_phone_15_dnc',
                        'mobile_phone_16_dnc', 'mobile_phone_17_dnc', 'mobile_phone_18_dnc', 'mobile_phone_19_dnc', 'mobile_phone_20_dnc',
                        'mobile_phone_21_dnc', 'mobile_phone_22_dnc', 'mobile_phone_23_dnc', 'mobile_phone_24_dnc', 'mobile_phone_25_dnc',
                        'mobile_phone_26_dnc', 'mobile_phone_27_dnc', 'mobile_phone_28_dnc', 'mobile_phone_29_dnc', 'mobile_phone_30_dnc',
                        'personal_phone_dnc', 'personal_phone_2_dnc', 'personal_phone_3_dnc', 'personal_phone_4_dnc', 'personal_phone_5_dnc',
                        'personal_phone_6_dnc', 'personal_phone_7_dnc', 'personal_phone_8_dnc', 'personal_phone_9_dnc', 'personal_phone_10_dnc',
                        'personal_phone_11_dnc', 'personal_phone_12_dnc', 'personal_phone_13_dnc', 'personal_phone_14_dnc', 'personal_phone_15_dnc',
                        'personal_phone_16_dnc', 'personal_phone_17_dnc', 'personal_phone_18_dnc', 'personal_phone_19_dnc', 'personal_phone_20_dnc',
                        'personal_phone_21_dnc', 'personal_phone_22_dnc', 'personal_phone_23_dnc', 'personal_phone_24_dnc', 'personal_phone_25_dnc',
                        'personal_phone_26_dnc', 'personal_phone_27_dnc', 'personal_phone_28_dnc', 'personal_phone_29_dnc', 'personal_phone_30_dnc',
                        'direct_number_dnc', 'direct_number_2_dnc', 'direct_number_3_dnc', 'direct_number_4_dnc', 'direct_number_5_dnc',
                        'direct_number_6_dnc', 'direct_number_7_dnc', 'direct_number_8_dnc', 'direct_number_9_dnc', 'direct_number_10_dnc',
                        'direct_number_11_dnc', 'direct_number_12_dnc', 'direct_number_13_dnc', 'direct_number_14_dnc', 'direct_number_15_dnc',
                        'direct_number_16_dnc', 'direct_number_17_dnc', 'direct_number_18_dnc', 'direct_number_19_dnc', 'direct_number_20_dnc',
                        'direct_number_21_dnc', 'direct_number_22_dnc', 'direct_number_23_dnc', 'direct_number_24_dnc', 'direct_number_25_dnc',
                        'direct_number_26_dnc', 'direct_number_27_dnc', 'direct_number_28_dnc', 'direct_number_29_dnc', 'direct_number_30_dnc',
                        'company_phone_dnc', 'company_phone_2_dnc', 'company_phone_3_dnc', 'company_phone_4_dnc', 'company_phone_5_dnc',
                        'company_phone_6_dnc', 'company_phone_7_dnc', 'company_phone_8_dnc', 'company_phone_9_dnc', 'company_phone_10_dnc',
                        'company_phone_11_dnc', 'company_phone_12_dnc', 'company_phone_13_dnc', 'company_phone_14_dnc', 'company_phone_15_dnc',
                        'company_phone_16_dnc', 'company_phone_17_dnc', 'company_phone_18_dnc', 'company_phone_19_dnc', 'company_phone_20_dnc',
                        'company_phone_21_dnc', 'company_phone_22_dnc', 'company_phone_23_dnc', 'company_phone_24_dnc', 'company_phone_25_dnc',
                        'company_phone_26_dnc', 'company_phone_27_dnc', 'company_phone_28_dnc', 'company_phone_29_dnc', 'company_phone_30_dnc',
                        'skiptrace_dnc'
                    ]

                    for field in boolean_fields:
                        if field in contact_data:
                            val = str(contact_data[field]).strip().upper()
                            if val == 'Y' or val == 'YES' or val == 'TRUE' or val == '1':
                                contact_data[field] = True
                            elif val == 'N' or val == 'NO' or val == 'FALSE' or val == '0':
                                contact_data[field] = False
                            else:
                                contact_data[field] = None

                    # Convert strings to integers for integer fields (handle ranges like "101 to 250")
                    integer_fields = [
                        'inferred_years_experience', 'company_employee_count', 'company_revenue',
                        'skiptrace_match_score', 'skiptrace_exact_age', 'lead_score', 'social_connections'
                    ]

                    import re
                    for field in integer_fields:
                        if field in contact_data and contact_data[field]:
                            val = str(contact_data[field]).strip()
                            try:
                                # Try direct conversion first
                                contact_data[field] = int(val)
                            except ValueError:
                                # Try to extract first number from ranges like "101 to 250" or "101-250"
                                match = re.search(r'(\d+)', val)
                                if match:
                                    contact_data[field] = int(match.group(1))
                                else:
                                    contact_data[field] = None

                    # CRITICAL FIX: Convert ALL integer values to strings for VARCHAR fields
                    # JSON deserialization from CSVDuplicateCache converts numeric strings to integers
                    # We must convert them back to strings for VARCHAR database columns
                    integer_fields_converted = []
                    for field, value in list(contact_data.items()):
                        if isinstance(value, int) and field not in integer_fields and field not in boolean_fields:
                            integer_fields_converted.append(f"{field}={value}")
                            contact_data[field] = str(value)

                    if integer_fields_converted:
                        logger.warning(f"[CACHED ROW] Converted {len(integer_fields_converted)} integer fields to strings: {integer_fields_converted[:5]}")

                    # Truncate string fields to match database column lengths
                    field_max_lengths = {
                        # VARCHAR(2) fields
                        'personal_state': 2, 'company_state': 2, 'skiptrace_state': 2,
                        # VARCHAR(4) fields
                        'personal_zip4': 4,
                        # VARCHAR(10) fields
                        'personal_zip': 10, 'company_zip': 10, 'skiptrace_zip': 10,
                        'company_naics': 10, 'company_sic': 10,
                        'skiptrace_ethnic_code': 10, 'skiptrace_language_code': 10,
                        # VARCHAR(20) fields
                        'phone': 20, 'gender': 20, 'age_range': 20, 'company_phone': 20,
                        'normalized_phone': 20, 'skiptrace_credit_rating': 20, 'zip_code': 20,
                        # VARCHAR(45) fields
                        'skiptrace_ip': 45,
                        # VARCHAR(50) fields
                        'children': 50, 'net_worth': 50, 'income_range': 50, 'state': 50, 'seniority_level': 50,
                        # VARCHAR(64) fields - SHA256 hashes
                        'sha256_personal_email': 64, 'sha256_business_email': 64,
                        # VARCHAR(100) fields
                        'city': 100, 'personal_city': 100, 'company_city': 100, 'skiptrace_city': 100,
                        'company_industry': 100, 'country': 100, 'creation_source': 100,
                        'department': 100, 'first_name': 100, 'last_name': 100, 'pipeline_stage': 100,
                        'skiptrace_b2b_source': 100, 'source_form_id': 100, 'utm_medium': 100, 'utm_source': 100,
                        # VARCHAR(200) fields
                        'company': 200, 'street_address': 200,
                        # VARCHAR(255) fields
                        'personal_address': 255,
                        # Email fields (VARCHAR 255)
                        'email': 255, 'business_email': 255, 'personal_email': 255, 'personal_emails': 255,
                        'personal_verified_email': 255, 'business_verified_email': 255,
                        # All phone number fields
                        'mobile_phone': 20, 'mobile_phone_2': 20, 'mobile_phone_3': 20, 'mobile_phone_4': 20, 'mobile_phone_5': 20,
                        'mobile_phone_6': 20, 'mobile_phone_7': 20, 'mobile_phone_8': 20, 'mobile_phone_9': 20, 'mobile_phone_10': 20,
                        'mobile_phone_11': 20, 'mobile_phone_12': 20, 'mobile_phone_13': 20, 'mobile_phone_14': 20, 'mobile_phone_15': 20,
                        'mobile_phone_16': 20, 'mobile_phone_17': 20, 'mobile_phone_18': 20, 'mobile_phone_19': 20, 'mobile_phone_20': 20,
                        'mobile_phone_21': 20, 'mobile_phone_22': 20, 'mobile_phone_23': 20, 'mobile_phone_24': 20, 'mobile_phone_25': 20,
                        'mobile_phone_26': 20, 'mobile_phone_27': 20, 'mobile_phone_28': 20, 'mobile_phone_29': 20, 'mobile_phone_30': 20,
                        'personal_phone': 20, 'personal_phone_2': 20, 'personal_phone_3': 20, 'personal_phone_4': 20, 'personal_phone_5': 20,
                        'personal_phone_6': 20, 'personal_phone_7': 20, 'personal_phone_8': 20, 'personal_phone_9': 20, 'personal_phone_10': 20,
                        'personal_phone_11': 20, 'personal_phone_12': 20, 'personal_phone_13': 20, 'personal_phone_14': 20, 'personal_phone_15': 20,
                        'personal_phone_16': 20, 'personal_phone_17': 20, 'personal_phone_18': 20, 'personal_phone_19': 20, 'personal_phone_20': 20,
                        'personal_phone_21': 20, 'personal_phone_22': 20, 'personal_phone_23': 20, 'personal_phone_24': 20, 'personal_phone_25': 20,
                        'personal_phone_26': 20, 'personal_phone_27': 20, 'personal_phone_28': 20, 'personal_phone_29': 20, 'personal_phone_30': 20,
                        'direct_number': 20, 'direct_number_2': 20, 'direct_number_3': 20, 'direct_number_4': 20, 'direct_number_5': 20,
                        'direct_number_6': 20, 'direct_number_7': 20, 'direct_number_8': 20, 'direct_number_9': 20, 'direct_number_10': 20,
                        'direct_number_11': 20, 'direct_number_12': 20, 'direct_number_13': 20, 'direct_number_14': 20, 'direct_number_15': 20,
                        'direct_number_16': 20, 'direct_number_17': 20, 'direct_number_18': 20, 'direct_number_19': 20, 'direct_number_20': 20,
                        'direct_number_21': 20, 'direct_number_22': 20, 'direct_number_23': 20, 'direct_number_24': 20, 'direct_number_25': 20,
                        'direct_number_26': 20, 'direct_number_27': 20, 'direct_number_28': 20, 'direct_number_29': 20, 'direct_number_30': 20,
                        'company_phone': 20, 'company_phone_2': 20, 'company_phone_3': 20, 'company_phone_4': 20, 'company_phone_5': 20,
                        'company_phone_6': 20, 'company_phone_7': 20, 'company_phone_8': 20, 'company_phone_9': 20, 'company_phone_10': 20,
                        'company_phone_11': 20, 'company_phone_12': 20, 'company_phone_13': 20, 'company_phone_14': 20, 'company_phone_15': 20,
                        'company_phone_16': 20, 'company_phone_17': 20, 'company_phone_18': 20, 'company_phone_19': 20, 'company_phone_20': 20,
                        'company_phone_21': 20, 'company_phone_22': 20, 'company_phone_23': 20, 'company_phone_24': 20, 'company_phone_25': 20,
                        'company_phone_26': 20, 'company_phone_27': 20, 'company_phone_28': 20, 'company_phone_29': 20, 'company_phone_30': 20,
                    }

                    for field, max_len in field_max_lengths.items():
                        if field in contact_data and contact_data[field] and isinstance(contact_data[field], str):
                            if len(contact_data[field]) > max_len:
                                contact_data[field] = contact_data[field][:max_len]

                    # Fallback: truncate ALL remaining string fields to 64 characters (safe for SHA256/hash fields and most VARCHAR)
                    for field, value in contact_data.items():
                        if isinstance(value, str) and field not in field_max_lengths and len(value) > 64:
                            contact_data[field] = value[:64]

                    # CRITICAL FIX: Ensure state fields never exceed 2 characters
                    for state_field in ['personal_state', 'company_state', 'skiptrace_state', 'state']:
                        if state_field in contact_data and isinstance(contact_data[state_field], str):
                            contact_data[state_field] = contact_data[state_field][:2]

                    # CRITICAL FIX: Truncate all phone fields to 20 characters (handles comma-delimited values)
                    phone_fields = ['phone', 'direct_number', 'mobile_phone', 'personal_phone', 'company_phone']
                    for base_field in phone_fields:
                        # Base field (e.g., 'direct_number')
                        if base_field in contact_data and isinstance(contact_data[base_field], str):
                            contact_data[base_field] = contact_data[base_field][:20]

                        # Numbered variants (e.g., 'direct_number_2' through 'direct_number_30')
                        for i in range(2, 31):
                            numbered_field = f"{base_field}_{i}"
                            if numbered_field in contact_data and isinstance(contact_data[numbered_field], str):
                                contact_data[numbered_field] = contact_data[numbered_field][:20]

                    # Always generate a new UUID for the contact ID (CSV UUIDs are for duplicate groups, not unique contacts)
                    if 'uuid' in contact_data:
                        contact_data.pop('uuid')  # Remove CSV UUID to avoid using it
                    contact_id = uuid.uuid4()

                    # Create new contact
                    from app.models.contact import Contact, ContactSource
                    new_contact = Contact(
                        id=contact_id,
                        source=ContactSource.OTHER,
                        created_by_user_id=current_user.id,
                        is_active=True,
                        **contact_data
                    )

                    db.add(new_contact)
                    await db.flush()  # Get the ID
                    logger.info(f"[IMPORT] Created new contact {new_contact.id} from CSV row {decision.csv_row_index}")
                    results['new_contacts'] += 1

                elif decision.user_decision == 'merge':
                    # CRITICAL FIX: Skip if we've already processed this row index
                    if decision.csv_row_index in processed_row_indices:
                        logger.debug(f"[STEP 4] Skipping merge for row {decision.csv_row_index} - already processed in another duplicate group")
                        continue

                    # Mark this row as processed
                    processed_row_indices.add(decision.csv_row_index)

                    # Merge CSV row with existing contact
                    if not decision.existing_contact_id:
                        logger.warning(f"[IMPORT] Merge decision missing existing_contact_id")
                        results['errors'] += 1
                        continue

                    # Get existing contact
                    existing = await db.execute(
                        select(Contact).where(Contact.id == decision.existing_contact_id)
                    )
                    existing_contact = existing.scalar_one_or_none()

                    if not existing_contact:
                        logger.warning(f"[IMPORT] Existing contact {decision.existing_contact_id} not found")
                        results['errors'] += 1
                        continue

                    # Merge data
                    csv_row = rows[decision.csv_row_index]

                    # Map CSV row to Contact model fields
                    csv_mapped = {}
                    for csv_col, db_field in data.field_mapping.items():
                        if csv_col in csv_row:
                            csv_mapped[db_field] = csv_row[csv_col]

                    # Use merge algorithm (CSV priority strategy)
                    merged_data = merge_external_duplicate(csv_mapped, {}, strategy="csv_priority")

                    # Update existing contact with merged data
                    for field, value in merged_data.items():
                        if value and hasattr(existing_contact, field):
                            setattr(existing_contact, field, value)

                    existing_contact.updated_at = datetime.utcnow()
                    await db.flush()
                    logger.info(f"[IMPORT] Merged CSV row {decision.csv_row_index} into contact {existing_contact.id}")
                    results['merged'] += 1

            except Exception as e:
                logger.error(f"[IMPORT] Error processing decision: {str(e)}", exc_info=True)
                results['errors'] += 1

        # STEP 5: Import all unique (non-cached) CSV rows
        logger.info(f"Step 5: Importing unique rows (not in duplicate cache)")
        # Use processed_row_indices from Step 4 to know which rows were actually imported
        unique_row_indices = [i for i in range(len(rows)) if i not in processed_row_indices]
        logger.info(f"  Found {len(unique_row_indices)} unique rows to import (total CSV rows: {len(rows)}, processed in Step 4: {len(processed_row_indices)})")

        for row_idx in unique_row_indices:
            try:
                csv_row = rows[row_idx]
                contact_data = {}
                for csv_col, db_field in data.field_mapping.items():
                    if csv_col in csv_row and csv_row[csv_col]:
                        contact_data[db_field] = csv_row[csv_col]

                # Apply same field transformations as cached rows
                # (boolean conversion, integer parsing, VARCHAR truncation, etc.)
                # Reuse the same logic from the decision processing loop above

                # Convert Y/N to boolean for boolean fields
                boolean_fields = [
                    'homeowner', 'married',
                    'mobile_phone_dnc', 'mobile_phone_2_dnc', 'mobile_phone_3_dnc', 'mobile_phone_4_dnc', 'mobile_phone_5_dnc',
                    'mobile_phone_6_dnc', 'mobile_phone_7_dnc', 'mobile_phone_8_dnc', 'mobile_phone_9_dnc', 'mobile_phone_10_dnc',
                    'mobile_phone_11_dnc', 'mobile_phone_12_dnc', 'mobile_phone_13_dnc', 'mobile_phone_14_dnc', 'mobile_phone_15_dnc',
                    'mobile_phone_16_dnc', 'mobile_phone_17_dnc', 'mobile_phone_18_dnc', 'mobile_phone_19_dnc', 'mobile_phone_20_dnc',
                    'mobile_phone_21_dnc', 'mobile_phone_22_dnc', 'mobile_phone_23_dnc', 'mobile_phone_24_dnc', 'mobile_phone_25_dnc',
                    'mobile_phone_26_dnc', 'mobile_phone_27_dnc', 'mobile_phone_28_dnc', 'mobile_phone_29_dnc', 'mobile_phone_30_dnc',
                    'personal_phone_dnc', 'personal_phone_2_dnc', 'personal_phone_3_dnc', 'personal_phone_4_dnc', 'personal_phone_5_dnc',
                    'personal_phone_6_dnc', 'personal_phone_7_dnc', 'personal_phone_8_dnc', 'personal_phone_9_dnc', 'personal_phone_10_dnc',
                    'personal_phone_11_dnc', 'personal_phone_12_dnc', 'personal_phone_13_dnc', 'personal_phone_14_dnc', 'personal_phone_15_dnc',
                    'personal_phone_16_dnc', 'personal_phone_17_dnc', 'personal_phone_18_dnc', 'personal_phone_19_dnc', 'personal_phone_20_dnc',
                    'personal_phone_21_dnc', 'personal_phone_22_dnc', 'personal_phone_23_dnc', 'personal_phone_24_dnc', 'personal_phone_25_dnc',
                    'personal_phone_26_dnc', 'personal_phone_27_dnc', 'personal_phone_28_dnc', 'personal_phone_29_dnc', 'personal_phone_30_dnc',
                    'direct_number_dnc', 'direct_number_2_dnc', 'direct_number_3_dnc', 'direct_number_4_dnc', 'direct_number_5_dnc',
                    'direct_number_6_dnc', 'direct_number_7_dnc', 'direct_number_8_dnc', 'direct_number_9_dnc', 'direct_number_10_dnc',
                    'direct_number_11_dnc', 'direct_number_12_dnc', 'direct_number_13_dnc', 'direct_number_14_dnc', 'direct_number_15_dnc',
                    'direct_number_16_dnc', 'direct_number_17_dnc', 'direct_number_18_dnc', 'direct_number_19_dnc', 'direct_number_20_dnc',
                    'direct_number_21_dnc', 'direct_number_22_dnc', 'direct_number_23_dnc', 'direct_number_24_dnc', 'direct_number_25_dnc',
                    'direct_number_26_dnc', 'direct_number_27_dnc', 'direct_number_28_dnc', 'direct_number_29_dnc', 'direct_number_30_dnc',
                    'company_phone_dnc', 'company_phone_2_dnc', 'company_phone_3_dnc', 'company_phone_4_dnc', 'company_phone_5_dnc',
                    'company_phone_6_dnc', 'company_phone_7_dnc', 'company_phone_8_dnc', 'company_phone_9_dnc', 'company_phone_10_dnc',
                    'company_phone_11_dnc', 'company_phone_12_dnc', 'company_phone_13_dnc', 'company_phone_14_dnc', 'company_phone_15_dnc',
                    'company_phone_16_dnc', 'company_phone_17_dnc', 'company_phone_18_dnc', 'company_phone_19_dnc', 'company_phone_20_dnc',
                    'company_phone_21_dnc', 'company_phone_22_dnc', 'company_phone_23_dnc', 'company_phone_24_dnc', 'company_phone_25_dnc',
                    'company_phone_26_dnc', 'company_phone_27_dnc', 'company_phone_28_dnc', 'company_phone_29_dnc', 'company_phone_30_dnc',
                    'skiptrace_dnc'
                ]
                # COMPREHENSIVE BOOLEAN CONVERSION: Match cached decision processing logic exactly
                for field in boolean_fields:
                    if field in contact_data:
                        val = str(contact_data[field]).strip().upper()
                        if val == 'Y' or val == 'YES' or val == 'TRUE' or val == '1':
                            contact_data[field] = True
                        elif val == 'N' or val == 'NO' or val == 'FALSE' or val == '0':
                            contact_data[field] = False
                        else:
                            contact_data[field] = None

                # Parse integer fields
                integer_fields = ['skiptrace_exact_age', 'lead_score', 'company_employee_count', 'company_revenue',
                                  'inferred_years_experience', 'skiptrace_match_score', 'social_connections']
                for field in integer_fields:
                    if field in contact_data and contact_data[field]:
                        if isinstance(contact_data[field], int):
                            pass
                        elif isinstance(contact_data[field], str):
                            import re
                            match = re.search(r'(\d+)', str(contact_data[field]))
                            if match:
                                contact_data[field] = int(match.group(1))
                            else:
                                contact_data[field] = None

                # Truncate string fields to match database column lengths
                field_max_lengths = {
                    'personal_state': 2, 'company_state': 2, 'skiptrace_state': 2,
                    'personal_zip4': 4,
                    'personal_zip': 10, 'company_zip': 10, 'skiptrace_zip': 10,
                    'company_naics': 10, 'company_sic': 10,
                    'skiptrace_ethnic_code': 10, 'skiptrace_language_code': 10,
                    'phone': 20, 'gender': 20, 'age_range': 20, 'company_phone': 20,
                    'normalized_phone': 20, 'skiptrace_credit_rating': 20, 'zip_code': 20,
                    'skiptrace_ip': 45,
                    'children': 50, 'net_worth': 50, 'income_range': 50, 'state': 50, 'seniority_level': 50,
                    'sha256_personal_email': 64, 'sha256_business_email': 64,
                    'city': 100, 'personal_city': 100, 'company_city': 100, 'skiptrace_city': 100,
                    'company_industry': 100, 'country': 100, 'creation_source': 100,
                    'department': 100, 'first_name': 100, 'last_name': 100, 'pipeline_stage': 100,
                    'skiptrace_b2b_source': 100, 'source_form_id': 100, 'utm_medium': 100, 'utm_source': 100,
                    'company': 200, 'street_address': 200,
                    'personal_address': 255, 'email': 255, 'business_email': 255, 'personal_email': 255,
                }

                for field, max_len in field_max_lengths.items():
                    if field in contact_data and contact_data[field] and isinstance(contact_data[field], str):
                        if len(contact_data[field]) > max_len:
                            contact_data[field] = contact_data[field][:max_len]

                # CRITICAL FIX: Ensure state fields never exceed 2 characters
                for state_field in ['personal_state', 'company_state', 'skiptrace_state', 'state']:
                    if state_field in contact_data and isinstance(contact_data[state_field], str):
                        contact_data[state_field] = contact_data[state_field][:2]

                # CRITICAL FIX: Convert ALL integer values to strings for string fields
                # This handles cases where CSV parser auto-converts numeric strings to integers
                # Exclude integer fields and ALL boolean fields from conversion
                integer_fields_found = []
                for field, value in list(contact_data.items()):
                    if isinstance(value, int):
                        if field not in integer_fields and field not in boolean_fields:
                            integer_fields_found.append(f"{field}={value}")
                            contact_data[field] = str(value)

                if integer_fields_found:
                    logger.warning(f"[UNIQUE ROW {row_idx}] Found {len(integer_fields_found)} integer fields to convert: {integer_fields_found[:10]}")

                # CRITICAL FIX: Convert phone fields to strings and truncate to 20 characters
                phone_fields = ['phone', 'direct_number', 'mobile_phone', 'personal_phone', 'company_phone']
                for base_field in phone_fields:
                    if base_field in contact_data and contact_data[base_field]:
                        contact_data[base_field] = str(contact_data[base_field])[:20]
                    for i in range(2, 31):
                        numbered_field = f"{base_field}_{i}"
                        if numbered_field in contact_data and contact_data[numbered_field]:
                            contact_data[numbered_field] = str(contact_data[numbered_field])[:20]

                # Always generate a new UUID for the contact ID (CSV UUIDs are for duplicate groups, not unique contacts)
                if 'uuid' in contact_data:
                    contact_data.pop('uuid')  # Remove CSV UUID to avoid using it
                contact_id = uuid.uuid4()

                # NUCLEAR OPTION: Ensure ALL fields are the correct type
                # We explicitly convert everything to the expected type for the Contact model
                known_integer_fields = {
                    'skiptrace_exact_age', 'lead_score', 'company_employee_count', 'company_revenue',
                    'inferred_years_experience', 'skiptrace_match_score', 'social_connections'
                }
                known_boolean_fields = {
                    'homeowner', 'married', 'is_active', 'is_deleted',
                    *[f'{phone}_dnc' for phone in ['mobile_phone', 'personal_phone', 'direct_number', 'company_phone']],
                    *[f'{phone}_{i}_dnc' for phone in ['mobile_phone', 'personal_phone', 'direct_number', 'company_phone'] for i in range(2, 31)],
                    'skiptrace_dnc'
                }

                # Convert ALL values to their proper types
                cleaned_contact_data = {}
                for field, value in contact_data.items():
                    if value is None:
                        cleaned_contact_data[field] = None
                    elif field in known_integer_fields:
                        # Keep as integer
                        cleaned_contact_data[field] = value if isinstance(value, int) else int(value) if value else None
                    elif field in known_boolean_fields:
                        # Keep as boolean
                        cleaned_contact_data[field] = value if isinstance(value, bool) else value
                    else:
                        # Convert EVERYTHING else to string
                        cleaned_contact_data[field] = str(value) if value is not None else None

                contact_data = cleaned_contact_data
                logger.info(f"[DEBUG ROW {row_idx}] Type-cleaned {len(contact_data)} fields")

                # Build kwargs dict with ABSOLUTE type guarantees - no SQLAlchemy magic allowed
                from app.models.contact import Contact, ContactSource

                # Start with the base required fields
                contact_kwargs = {
                    'id': contact_id,
                    'source': 'OTHER',  # Use string value for enum in raw SQL
                    'created_by_user_id': current_user.id,
                    'is_active': True
                }

                # Add all other fields with EXPLICIT type enforcement
                for field, value in contact_data.items():
                    if value is None:
                        contact_kwargs[field] = None
                    elif field in known_integer_fields:
                        # Integer fields: convert to int or None
                        if isinstance(value, int):
                            contact_kwargs[field] = value
                        else:
                            try:
                                contact_kwargs[field] = int(value) if value else None
                            except (ValueError, TypeError):
                                contact_kwargs[field] = None
                                logger.warning(f"[ROW {row_idx}] Could not convert {field}={value} to integer, setting to None")
                    elif field in known_boolean_fields:
                        # Boolean fields: keep as-is (already converted earlier)
                        contact_kwargs[field] = value
                    else:
                        # ALL other fields MUST be strings - FORCE conversion
                        # Even if SQLAlchemy thinks it knows better, we know these are VARCHAR fields
                        if isinstance(value, str):
                            contact_kwargs[field] = value
                        else:
                            # Force conversion to string for integers, floats, etc.
                            contact_kwargs[field] = str(value)
                            if row_idx == 0:  # Only log for first row to avoid spam
                                logger.warning(f"[ROW {row_idx}] Forced {field} from {type(value).__name__} to string: {value} -> '{str(value)}'")

                # BYPASS SQLAlchemy ORM completely - use raw SQL INSERT to avoid type coercion
                # Build the INSERT statement manually
                from sqlalchemy import text
                from datetime import datetime

                # Add timestamp fields
                now = datetime.utcnow()
                contact_kwargs['created_at'] = now
                contact_kwargs['updated_at'] = now

                # FINAL NUCLEAR OPTION: Force ALL non-integer/non-boolean/non-UUID/non-datetime fields to strings
                # This catches any integers that slipped through earlier conversions
                final_kwargs = {}
                for key, value in contact_kwargs.items():
                    if value is None:
                        final_kwargs[key] = None
                    elif key in known_integer_fields:
                        final_kwargs[key] = value  # Keep as integer
                    elif key in known_boolean_fields:
                        final_kwargs[key] = value  # Keep as boolean
                    elif key in ['id', 'provider_uuid', 'assigned_to_id', 'pipeline_id', 'created_by_user_id', 'deleted_by']:
                        final_kwargs[key] = value  # Keep as UUID
                    elif key in ['created_at', 'updated_at', 'deleted_at', 'last_enriched_at']:
                        final_kwargs[key] = value  # Keep as datetime
                    elif key == 'source':
                        final_kwargs[key] = value  # Keep as string (enum)
                    else:
                        # FORCE to string - no exceptions!
                        if isinstance(value, str):
                            final_kwargs[key] = value
                        else:
                            final_kwargs[key] = str(value)
                            if row_idx < 3:  # Log first 3 rows only
                                logger.warning(f"[ROW {row_idx}] FINAL CONVERSION: {key}={value} ({type(value).__name__}) -> '{str(value)}'")

                # Get column names and values in order
                columns = list(final_kwargs.keys())
                placeholders = [f":{col}" for col in columns]

                insert_sql = f"""
                INSERT INTO contacts ({', '.join(columns)})
                VALUES ({', '.join(placeholders)})
                """

                # Execute raw SQL with properly typed parameters
                await db.execute(text(insert_sql), final_kwargs)

                logger.info(f"[IMPORT] Created unique contact from CSV row {row_idx}")
                results['new_contacts'] += 1

            except Exception as e:
                logger.error(f"[IMPORT] Error importing unique row {row_idx}: {str(e)}", exc_info=True)
                results['errors'] += 1

        # Commit all changes to database
        logger.info(f"Step 6: Committing {results['new_contacts']} new contacts to database")
        await db.commit()
        logger.info(f"=== IMPORT EXECUTION SUCCESS ===")
        logger.info(f"Final results: {results}")

        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"=== IMPORT EXECUTION FAILED ===")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        logger.error(f"Full traceback:", exc_info=True)

        # Log detailed traceback
        import traceback
        tb_str = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
        logger.error(f"Detailed traceback:\n{tb_str}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing with decisions: {str(e)}"
        )


# ===== END MILESTONE 2 =====


class BulkDuplicateRow(BaseModel):
    """Model for duplicate row information"""
    row_id: int
    existing_contact_id: Optional[str] = None
    field_diffs: List[Dict[str, Any]] = []


class BulkDuplicateActionRequest(BaseModel):
    """Request model for bulk duplicate actions"""
    action: Literal["skip_all", "update_all", "keep_first"]
    duplicate_rows: List[BulkDuplicateRow]


@router.post("/bulk-duplicate-action")
async def bulk_duplicate_action(
    current_user: CurrentUser,
    data: BulkDuplicateActionRequest
):
    """
    Apply bulk actions to duplicate rows.

    Actions:
    - skip_all: Skip all duplicates (don't import)
    - update_all: Update all existing contacts with new data
    - keep_first: For each group, keep first occurrence only

    Returns updated merge decisions array.

    Requires authentication
    """
    decisions = []

    for row in data.duplicate_rows:
        if data.action == "skip_all":
            # Skip all duplicates
            decisions.append({
                "row_id": row.row_id,
                "action": "skip",
                "existing_contact_id": row.existing_contact_id,
                "field_overrides": {},
                "default_choice": "existing"
            })

        elif data.action == "update_all":
            # Update all - choose incoming values for all fields
            field_overrides = {}
            for diff in row.field_diffs:
                field_overrides[diff["field"]] = "incoming"

            decisions.append({
                "row_id": row.row_id,
                "action": "update",
                "existing_contact_id": row.existing_contact_id,
                "field_overrides": field_overrides,
                "default_choice": "incoming"
            })

        elif data.action == "keep_first":
            # Keep existing values for all fields
            field_overrides = {}
            for diff in row.field_diffs:
                field_overrides[diff["field"]] = "existing"

            decisions.append({
                "row_id": row.row_id,
                "action": "update",
                "existing_contact_id": row.existing_contact_id,
                "field_overrides": field_overrides,
                "default_choice": "existing"
            })

    return {
        "success": True,
        "decisions": decisions,
        "action_applied": data.action,
        "rows_affected": len(decisions)
    }


@router.post("/execute")
async def execute_import(
    current_user: CurrentUser,
    data: ImportExecuteRequest,
    db: DatabaseSession
):
    """
    Execute contact import.

    CRITICAL: All imported contacts are auto-assigned to the uploader.

    Requires authentication
    """
    # Find uploaded file
    file_paths = list(UPLOAD_DIR.glob(f"{data.file_id}.*"))

    if not file_paths:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file not found. Please upload again."
        )

    file_path = file_paths[0]
    file_ext = file_path.suffix.lower()

    try:
        # Parse file
        if file_ext == '.csv':
            rows = parse_csv(str(file_path))
        elif file_ext in ['.xlsx', '.xls']:
            rows = parse_excel(str(file_path))
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format"
            )

        # Import contacts
        importer = ContactImporter(db)

        summary = await importer.validate_rows(rows, data.field_mapping)

        required_rows = {row["row_id"] for row in (summary.duplicate_rows + summary.conflict_rows)}
        provided_decisions = {decision.row_id for decision in data.merge_decisions}
        if required_rows and not required_rows.issubset(provided_decisions):
            missing = sorted(list(required_rows - provided_decisions))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing merge decisions for rows: {missing}",
            )

        decision_payload = [decision.model_dump() for decision in data.merge_decisions]

        import_result = await importer.import_contacts(
            rows=rows,
            field_mapping=data.field_mapping,
            user_id=current_user.id,
            tag_ids=data.tag_ids or [],
            summary=summary,
            merge_decisions=decision_payload,
        )

        # Clean up uploaded file
        file_path.unlink()

        response_payload = {
            "imported": import_result.imported,
            "updated": import_result.updated,
            "skipped": import_result.skipped,
            "failed": import_result.failed,
            "total": len(rows),
            "errors": [e.to_dict() for e in summary.invalid_rows] + [e.to_dict() for e in import_result.errors],
            "conflicts": import_result.conflicts,
            "imported_contact_ids": import_result.imported_contact_ids,
        }

        if import_result.conflicts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Identifier conflicts detected during import.",
                    "conflicts": import_result.conflicts,
                    "result": response_payload,
                },
            )

        return response_payload

    except FileParserError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error parsing file: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[IMPORT] Unexpected error during import execution", exc_info=True)
        logger.error(f"[IMPORT] Error type: {type(e).__name__}, Message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing import: {str(e)}"
        )


@router.get("/sample")
async def download_sample():
    """
    Download sample CSV template for contact import.

    Public endpoint (no authentication required)
    """
    # Sample CSV content
    csv_content = """first_name,last_name,email,mobile_phone,company_name,job_title
Text,Text,Email,Phone,Text,Text
John,Smith,john.smith@example.com,555-123-4567,Acme Corp,Sales Manager
Jane,Doe,jane.doe@example.com,555-234-5678,Tech Inc,Marketing Director
Bob,Johnson,bob.johnson@example.com,555-345-6789,Widgets LLC,CEO"""

    # Create CSV file in memory
    csv_bytes = csv_content.encode('utf-8')
    csv_stream = io.BytesIO(csv_bytes)

    return StreamingResponse(
        csv_stream,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=sample-contacts.csv"
        }
    )


@router.get("/fields")
async def get_importable_fields(
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Get list of available contact fields for import mapping.

    Returns fields that can be imported based on user role.

    Requires authentication
    """
    # Get all field visibility settings
    result = await db.execute(select(FieldVisibility))
    all_fields = result.scalars().all()

    # Convert enum to string value for comparison
    user_role_value = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    # Filter importable fields
    importable_fields = []

    # Always include ALL contact fields from schema (ContactResponse in contact.py)
    basic_fields = [
        # Core contact fields
        {"field_name": "first_name", "field_label": "First Name", "required": False, "field_type": "text"},
        {"field_name": "last_name", "field_label": "Last Name", "required": False, "field_type": "text"},
        {"field_name": "email", "field_label": "Email", "required": True, "field_type": "email"},
        {"field_name": "phone", "field_label": "Phone", "required": True, "field_type": "phone"},
        {"field_name": "company", "field_label": "Company", "required": False, "field_type": "text"},
        {"field_name": "notes", "field_label": "Notes", "required": False, "field_type": "textarea"},

        # Personal address fields
        {"field_name": "street_address", "field_label": "Street Address", "required": False, "field_type": "text"},
        {"field_name": "city", "field_label": "City", "required": False, "field_type": "text"},
        {"field_name": "state", "field_label": "State", "required": False, "field_type": "text"},
        {"field_name": "zip_code", "field_label": "Zip Code", "required": False, "field_type": "text"},
        {"field_name": "personal_address", "field_label": "Personal Address", "required": False, "field_type": "text"},
        {"field_name": "personal_city", "field_label": "Personal City", "required": False, "field_type": "text"},
        {"field_name": "personal_state", "field_label": "Personal State", "required": False, "field_type": "text"},
        {"field_name": "personal_zip", "field_label": "Personal ZIP", "required": False, "field_type": "text"},
        {"field_name": "personal_zip4", "field_label": "Personal ZIP+4", "required": False, "field_type": "text"},

        # Demographics
        {"field_name": "age_range", "field_label": "Age Range", "required": False, "field_type": "text"},
        {"field_name": "children", "field_label": "Children", "required": False, "field_type": "text"},
        {"field_name": "gender", "field_label": "Gender", "required": False, "field_type": "text"},
        {"field_name": "homeowner", "field_label": "Homeowner", "required": False, "field_type": "text"},
        {"field_name": "married", "field_label": "Married", "required": False, "field_type": "text"},
        {"field_name": "net_worth", "field_label": "Net Worth", "required": False, "field_type": "text"},
        {"field_name": "income_range", "field_label": "Income Range", "required": False, "field_type": "text"},

        # Phone fields
        {"field_name": "mobile_phone", "field_label": "Mobile Phone", "required": False, "field_type": "phone"},
        {"field_name": "mobile_phone_dnc", "field_label": "Mobile Phone DNC", "required": False, "field_type": "boolean"},
        {"field_name": "personal_phone", "field_label": "Personal Phone", "required": False, "field_type": "phone"},
        {"field_name": "personal_phone_dnc", "field_label": "Personal Phone DNC", "required": False, "field_type": "boolean"},
        {"field_name": "direct_number", "field_label": "Direct Number", "required": False, "field_type": "phone"},
        {"field_name": "direct_number_dnc", "field_label": "Direct Number DNC", "required": False, "field_type": "boolean"},

        # Email fields
        {"field_name": "business_email", "field_label": "Business Email", "required": False, "field_type": "email"},
        {"field_name": "personal_emails", "field_label": "Personal Emails", "required": False, "field_type": "text"},
        {"field_name": "business_verified_emails", "field_label": "Business Verified Emails", "required": False, "field_type": "text"},

        # Hash fields
        {"field_name": "sha256_personal_email", "field_label": "SHA256 Personal Email", "required": False, "field_type": "text"},
        {"field_name": "sha256_business_email", "field_label": "SHA256 Business Email", "required": False, "field_type": "text"},

        # Professional fields
        {"field_name": "job_title", "field_label": "Job Title", "required": False, "field_type": "text"},
        {"field_name": "headline", "field_label": "Headline", "required": False, "field_type": "text"},
        {"field_name": "department", "field_label": "Department", "required": False, "field_type": "text"},
        {"field_name": "seniority_level", "field_label": "Seniority Level", "required": False, "field_type": "text"},
        {"field_name": "inferred_years_experience", "field_label": "Years of Experience", "required": False, "field_type": "number"},

        # History fields
        {"field_name": "company_name_history", "field_label": "Company History", "required": False, "field_type": "text"},
        {"field_name": "job_title_history", "field_label": "Job Title History", "required": False, "field_type": "text"},
        {"field_name": "education_history", "field_label": "Education History", "required": False, "field_type": "text"},

        # Company fields
        {"field_name": "company_name", "field_label": "Company Name", "required": False, "field_type": "text"},
        {"field_name": "company_address", "field_label": "Company Address", "required": False, "field_type": "text"},
        {"field_name": "company_city", "field_label": "Company City", "required": False, "field_type": "text"},
        {"field_name": "company_state", "field_label": "Company State", "required": False, "field_type": "text"},
        {"field_name": "company_zip", "field_label": "Company ZIP Code", "required": False, "field_type": "text"},
        {"field_name": "company_phone", "field_label": "Company Phone", "required": False, "field_type": "phone"},
        {"field_name": "company_domain", "field_label": "Company Domain", "required": False, "field_type": "text"},
        {"field_name": "company_description", "field_label": "Company Description", "required": False, "field_type": "textarea"},
        {"field_name": "company_industry", "field_label": "Company Industry", "required": False, "field_type": "text"},
        {"field_name": "company_employee_count", "field_label": "Company Employee Count", "required": False, "field_type": "number"},
        {"field_name": "company_revenue", "field_label": "Company Revenue", "required": False, "field_type": "number"},
        {"field_name": "company_linkedin_url", "field_label": "Company LinkedIn URL", "required": False, "field_type": "url"},
        {"field_name": "company_sic", "field_label": "Company SIC Code", "required": False, "field_type": "text"},
        {"field_name": "company_naics", "field_label": "Company NAICS Code", "required": False, "field_type": "text"},

        # Social fields
        {"field_name": "linkedin_url", "field_label": "LinkedIn URL", "required": False, "field_type": "url"},
        {"field_name": "twitter_url", "field_label": "Twitter URL", "required": False, "field_type": "url"},
        {"field_name": "facebook_url", "field_label": "Facebook URL", "required": False, "field_type": "url"},
        {"field_name": "social_connections", "field_label": "Social Connections", "required": False, "field_type": "text"},
        {"field_name": "skills", "field_label": "Skills", "required": False, "field_type": "text"},
        {"field_name": "interests", "field_label": "Interests", "required": False, "field_type": "text"},

        # Skiptrace fields
        {"field_name": "skiptrace_match_score", "field_label": "Skiptrace Match Score", "required": False, "field_type": "number"},
        {"field_name": "skiptrace_name", "field_label": "Skiptrace Name", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_address", "field_label": "Skiptrace Address", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_city", "field_label": "Skiptrace City", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_state", "field_label": "Skiptrace State", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_zip", "field_label": "Skiptrace ZIP", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_landline_numbers", "field_label": "Skiptrace Landline Numbers", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_wireless_numbers", "field_label": "Skiptrace Wireless Numbers", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_credit_rating", "field_label": "Skiptrace Credit Rating", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_dnc", "field_label": "Skiptrace DNC", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_exact_age", "field_label": "Skiptrace Exact Age", "required": False, "field_type": "number"},
        {"field_name": "skiptrace_ethnic_code", "field_label": "Skiptrace Ethnic Code", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_language_code", "field_label": "Skiptrace Language Code", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_ip", "field_label": "Skiptrace IP", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_b2b_address", "field_label": "Skiptrace B2B Address", "required": False, "field_type": "text"},
        {"field_name": "skiptrace_b2b_phone", "field_label": "Skiptrace B2B Phone", "required": False, "field_type": "phone"},
        {"field_name": "skiptrace_b2b_source", "field_label": "Skiptrace B2B Source", "required": False, "field_type": "url"},
        {"field_name": "skiptrace_b2b_website", "field_label": "Skiptrace B2B Website", "required": False, "field_type": "url"},

        # Additional validation fields
        {"field_name": "valid_phones", "field_label": "Valid Phones", "required": False, "field_type": "text"},

        # Provider UUID field (maps to provider_uuid in Contact model)
        {"field_name": "provider_uuid", "field_label": "Provider UUID", "required": False, "field_type": "text"},
    ]

    importable_fields.extend(basic_fields)

    # Add additional fields based on role from field_visibility
    for field in all_fields:
        if field.is_visible_to_role(user_role_value):
            # Skip overflow fields (_2 through _30) - these are auto-populated from comma-delimited data
            field_name = field.field_name
            import re
            # Match fields ending with _2 through _30 (with or without _dnc suffix)
            if re.search(r'_([2-9]|[12][0-9]|30)(_dnc)?$', field_name):
                continue

            # Avoid duplicates
            if not any(f['field_name'] == field.field_name for f in importable_fields):
                importable_fields.append({
                    'field_name': field.field_name,
                    'field_label': field.field_label,
                    'required': False,
                    'field_type': field.field_type or 'text'
                })

    return {
        "fields": importable_fields,
        "required_note": "At least Email OR Phone is required for each contact"
    }
