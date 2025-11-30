"""
Password validation utilities

Provides functions for validating password strength and requirements.
"""

import re
from typing import Dict, List


def validate_password_requirements(password: str) -> Dict[str, bool]:
    """
    Validate password against requirements.

    Args:
        password (str): The password to validate

    Returns:
        Dict[str, bool]: Dictionary of requirement names and whether they are met
    """
    return {
        'min_length': len(password) >= 8,
        'has_uppercase': bool(re.search(r'[A-Z]', password)),
        'has_lowercase': bool(re.search(r'[a-z]', password)),
        'has_number': bool(re.search(r'\d', password)),
        'has_special': bool(re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password)),
    }


def is_password_valid(password: str) -> bool:
    """
    Check if password meets all requirements.

    Requirements:
    - At least 8 characters
    - Contains uppercase letter
    - Contains lowercase letter
    - Contains number
    - Contains special character

    Args:
        password (str): The password to validate

    Returns:
        bool: True if password meets all requirements
    """
    requirements = validate_password_requirements(password)
    return all(requirements.values())


def get_password_validation_errors(password: str) -> List[str]:
    """
    Get list of password validation error messages.

    Args:
        password (str): The password to validate

    Returns:
        List[str]: List of error messages for unmet requirements
    """
    requirements = validate_password_requirements(password)
    errors = []

    if not requirements['min_length']:
        errors.append('Password must be at least 8 characters long')
    if not requirements['has_uppercase']:
        errors.append('Password must contain at least one uppercase letter')
    if not requirements['has_lowercase']:
        errors.append('Password must contain at least one lowercase letter')
    if not requirements['has_number']:
        errors.append('Password must contain at least one number')
    if not requirements['has_special']:
        errors.append('Password must contain at least one special character')

    return errors
