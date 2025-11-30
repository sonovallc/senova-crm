"""add_field_type_to_field_visibility

Revision ID: de70980ab9ba
Revises: ecf2203db003
Create Date: 2025-11-08 02:57:48.504554

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'de70980ab9ba'
down_revision = 'ecf2203db003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add field_type column with default 'string'
    op.add_column('field_visibility',
        sa.Column('field_type', sa.String(20), nullable=False, server_default='string'))

    # Update Boolean fields to field_type='boolean'
    op.execute("""
        UPDATE field_visibility
        SET field_type = 'boolean'
        WHERE field_name IN (
            'mobile_phone_dnc',
            'direct_number_dnc',
            'personal_phone_dnc',
            'skiptrace_dnc',
            'homeowner',
            'married',
            'is_active'
        )
    """)

    # Update Integer fields to field_type='integer'
    op.execute("""
        UPDATE field_visibility
        SET field_type = 'integer'
        WHERE field_name IN (
            'company_employee_count',
            'company_revenue'
        )
    """)


def downgrade() -> None:
    # Remove field_type column
    op.drop_column('field_visibility', 'field_type')
