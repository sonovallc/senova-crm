"""
Contact Merge Service - "Most Complete Data" Strategy

Implements merge algorithms for duplicate contacts:
- Internal merge: Combine multiple CSV rows into one complete row
- External merge: Merge CSV row with existing database contact

Strategy: Fill empty cells from duplicate rows, prioritize completeness.
"""

from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


def calculate_completeness_score(row: Dict) -> int:
    """
    Calculate completeness score for a contact row.

    Counts number of non-empty fields in the row.
    Used to determine which row has the most complete data.

    Args:
        row: Dictionary representing a contact row

    Returns:
        int: Number of non-empty fields
    """
    count = 0
    for value in row.values():
        if value is not None and str(value).strip():
            count += 1
    return count


def merge_internal_duplicates(rows: List[Dict]) -> Dict:
    """
    Merge multiple CSV rows into one complete row (Internal Duplicate Strategy).

    Algorithm:
    1. Find the row with the highest completeness score
    2. Use that row as the base
    3. Fill any empty fields from other duplicate rows

    This ensures we keep the maximum amount of data from all duplicates.

    Args:
        rows: List of duplicate row dictionaries

    Returns:
        Dict: Merged row with most complete data

    Example:
        Row 1: {"name": "John", "email": "john@test.com", "phone": ""}
        Row 2: {"name": "John", "email": "", "phone": "+15551234567"}
        Result: {"name": "John", "email": "john@test.com", "phone": "+15551234567"}
    """
    if not rows:
        logger.warning("[MERGE] No rows provided for internal merge")
        return {}

    if len(rows) == 1:
        logger.info("[MERGE] Single row, returning as-is")
        return rows[0]

    logger.info(f"[MERGE] Merging {len(rows)} internal duplicate rows")

    # Find row with highest completeness score
    best_row = max(rows, key=calculate_completeness_score)
    logger.info(f"[MERGE] Base row has completeness score: {calculate_completeness_score(best_row)}")

    # Start with best row as base
    merged = dict(best_row)

    # Collect all unique field names across all rows
    all_fields = set()
    for row in rows:
        all_fields.update(row.keys())

    # Fill empty fields from other rows
    filled_count = 0
    for field in all_fields:
        # Check if this field is empty in merged row
        merged_value = merged.get(field)
        if not merged_value or not str(merged_value).strip():
            # This field is empty, try to fill from other rows
            for row in rows:
                row_value = row.get(field)
                if row_value and str(row_value).strip():
                    merged[field] = row_value
                    filled_count += 1
                    logger.debug(f"[MERGE] Filled '{field}' from duplicate row: {row_value}")
                    break

    logger.info(f"[MERGE] Internal merge complete: filled {filled_count} empty fields")
    return merged


def merge_external_duplicate(csv_row: Dict, existing_contact: Dict, strategy: str = "csv_priority") -> Dict:
    """
    Merge CSV row with existing database contact (External Duplicate Strategy).

    Strategies:
    - "csv_priority": CSV data takes precedence, overwrites DB fields
    - "fill_empty": CSV data only fills empty DB fields (preserves existing data)

    Args:
        csv_row: New data from CSV import
        existing_contact: Existing contact data from database
        strategy: Merge strategy ("csv_priority" or "fill_empty")

    Returns:
        Dict: Merged contact data

    Example (csv_priority):
        CSV: {"name": "John Smith", "email": "newemail@test.com", "phone": ""}
        DB:  {"name": "John", "email": "old@test.com", "phone": "+15551234567"}
        Result: {"name": "John Smith", "email": "newemail@test.com", "phone": "+15551234567"}
    """
    if not csv_row:
        logger.warning("[MERGE] Empty CSV row provided for external merge")
        return existing_contact

    if not existing_contact:
        logger.info("[MERGE] No existing contact, returning CSV row")
        return csv_row

    logger.info(f"[MERGE] Merging external duplicate with strategy: {strategy}")

    # Start with existing contact as base
    merged = dict(existing_contact)

    if strategy == "csv_priority":
        # CSV data overwrites database data
        updates_count = 0
        for field, csv_value in csv_row.items():
            if csv_value and str(csv_value).strip():
                # CSV has a value for this field
                db_value = merged.get(field)
                if csv_value != db_value:
                    merged[field] = csv_value
                    updates_count += 1
                    logger.debug(f"[MERGE] Updated '{field}': {db_value} -> {csv_value}")
        logger.info(f"[MERGE] CSV priority merge: updated {updates_count} fields")

    elif strategy == "fill_empty":
        # CSV data only fills empty database fields
        fills_count = 0
        for field, csv_value in csv_row.items():
            if csv_value and str(csv_value).strip():
                db_value = merged.get(field)
                if not db_value or not str(db_value).strip():
                    # Database field is empty, fill from CSV
                    merged[field] = csv_value
                    fills_count += 1
                    logger.debug(f"[MERGE] Filled empty '{field}' from CSV: {csv_value}")
        logger.info(f"[MERGE] Fill empty merge: filled {fills_count} fields")

    else:
        logger.error(f"[MERGE] Unknown merge strategy: {strategy}")
        raise ValueError(f"Unknown merge strategy: {strategy}")

    return merged


def preview_merge(csv_row: Dict, existing_contact: Dict) -> Dict:
    """
    Preview what the merged result would look like without committing.

    Shows field-by-field comparison of CSV vs DB data.

    Args:
        csv_row: New data from CSV
        existing_contact: Existing contact data

    Returns:
        Dict with structure:
        {
            "field_name": {
                "csv_value": "...",
                "db_value": "...",
                "merged_value": "...",
                "changed": True/False
            }
        }
    """
    preview = {}

    # Get all unique fields
    all_fields = set(csv_row.keys()) | set(existing_contact.keys())

    for field in all_fields:
        csv_value = csv_row.get(field, "")
        db_value = existing_contact.get(field, "")

        # Determine merged value (CSV priority)
        if csv_value and str(csv_value).strip():
            merged_value = csv_value
        else:
            merged_value = db_value

        preview[field] = {
            "csv_value": csv_value,
            "db_value": db_value,
            "merged_value": merged_value,
            "changed": csv_value != db_value and csv_value and str(csv_value).strip()
        }

    return preview
