"""Utility functions"""

from .permissions import (
    get_visible_fields,
    filter_contact_fields,
    can_view_contact,
    can_edit_contact,
)

__all__ = [
    "get_visible_fields",
    "filter_contact_fields",
    "can_view_contact",
    "can_edit_contact",
]
