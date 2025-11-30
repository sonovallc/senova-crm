"""add_overflow_phone_fields_to_field_visibility

Revision ID: 55d82bc537d9
Revises: 0dd017b57074
Create Date: 2025-11-10 00:06:52.518959

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '55d82bc537d9'
down_revision = '0dd017b57074'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add overflow phone fields (mobile_phone_2-5, personal_phone_2-5, direct_number_2-5) to field_visibility table"""

    # Define overflow phone fields to add
    overflow_fields = []

    # Mobile phone overflow fields (2-5) and their DNC fields
    for i in range(2, 6):
        overflow_fields.append({
            'field_name': f'mobile_phone_{i}',
            'field_label': f'Mobile Phone {i}',
            'field_category': 'contact',
            'visible_to_admin': True,
            'visible_to_user': False,
            'is_sensitive': True,
            'field_type': 'string'
        })
        overflow_fields.append({
            'field_name': f'mobile_phone_{i}_dnc',
            'field_label': f'Mobile Phone {i} DNC',
            'field_category': 'contact',
            'visible_to_admin': True,
            'visible_to_user': False,
            'is_sensitive': False,
            'field_type': 'string'
        })

    # Personal phone overflow fields (2-5) and their DNC fields
    for i in range(2, 6):
        overflow_fields.append({
            'field_name': f'personal_phone_{i}',
            'field_label': f'Personal Phone {i}',
            'field_category': 'contact',
            'visible_to_admin': True,
            'visible_to_user': False,
            'is_sensitive': True,
            'field_type': 'string'
        })
        overflow_fields.append({
            'field_name': f'personal_phone_{i}_dnc',
            'field_label': f'Personal Phone {i} DNC',
            'field_category': 'contact',
            'visible_to_admin': True,
            'visible_to_user': False,
            'is_sensitive': False,
            'field_type': 'string'
        })

    # Direct number overflow fields (2-5) and their DNC fields
    for i in range(2, 6):
        overflow_fields.append({
            'field_name': f'direct_number_{i}',
            'field_label': f'Direct Number {i}',
            'field_category': 'contact',
            'visible_to_admin': True,
            'visible_to_user': False,
            'is_sensitive': True,
            'field_type': 'string'
        })
        overflow_fields.append({
            'field_name': f'direct_number_{i}_dnc',
            'field_label': f'Direct Number {i} DNC',
            'field_category': 'contact',
            'visible_to_admin': True,
            'visible_to_user': False,
            'is_sensitive': False,
            'field_type': 'string'
        })

    # Insert all overflow fields into field_visibility table
    for field in overflow_fields:
        op.execute(f"""
            INSERT INTO field_visibility
            (field_name, field_label, field_category, visible_to_admin, visible_to_user, is_sensitive, field_type)
            VALUES (
                '{field['field_name']}',
                '{field['field_label']}',
                '{field['field_category']}',
                {field['visible_to_admin']},
                {field['visible_to_user']},
                {field['is_sensitive']},
                '{field['field_type']}'
            )
            ON CONFLICT (field_name) DO NOTHING;
        """)


def downgrade() -> None:
    """Remove overflow phone fields from field_visibility table"""

    # Delete mobile_phone overflow fields
    for i in range(2, 6):
        op.execute(f"DELETE FROM field_visibility WHERE field_name = 'mobile_phone_{i}';")
        op.execute(f"DELETE FROM field_visibility WHERE field_name = 'mobile_phone_{i}_dnc';")

    # Delete personal_phone overflow fields
    for i in range(2, 6):
        op.execute(f"DELETE FROM field_visibility WHERE field_name = 'personal_phone_{i}';")
        op.execute(f"DELETE FROM field_visibility WHERE field_name = 'personal_phone_{i}_dnc';")

    # Delete direct_number overflow fields
    for i in range(2, 6):
        op.execute(f"DELETE FROM field_visibility WHERE field_name = 'direct_number_{i}';")
        op.execute(f"DELETE FROM field_visibility WHERE field_name = 'direct_number_{i}_dnc';")
