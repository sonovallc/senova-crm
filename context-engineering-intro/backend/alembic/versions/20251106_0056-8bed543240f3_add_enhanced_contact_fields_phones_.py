"""add_enhanced_contact_fields_phones_addresses_websites

Revision ID: 8bed543240f3
Revises: bd9e9312eb1a
Create Date: 2025-11-06 00:56:53.661791

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '8bed543240f3'
down_revision = 'bd9e9312eb1a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add phones column (JSONB array of phone objects)
    # Example: [{"type": "mobile", "number": "555-1234"}, {"type": "work", "number": "555-5678"}]
    op.add_column('contacts', sa.Column('phones', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default='[]'))

    # Add addresses column (JSONB array of address objects)
    # Example: [{"type": "home", "street": "123 Main St", "city": "Boston", "state": "MA", "zip": "02101", "country": "USA"}]
    op.add_column('contacts', sa.Column('addresses', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default='[]'))

    # Add websites column (JSONB array of website URLs)
    # Example: ["https://example.com", "https://business.com"]
    op.add_column('contacts', sa.Column('websites', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default='[]'))


def downgrade() -> None:
    # Remove enhanced contact fields
    op.drop_column('contacts', 'websites')
    op.drop_column('contacts', 'addresses')
    op.drop_column('contacts', 'phones')
