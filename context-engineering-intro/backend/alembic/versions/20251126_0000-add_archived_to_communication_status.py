"""Add ARCHIVED to CommunicationStatus enum

Revision ID: 20251126_0000
Revises: 20251125_0000
Create Date: 2025-11-26 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251126_0000'
down_revision = '20251125_0000'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add ARCHIVED value to communicationstatus enum
    # Note: PostgreSQL requires ALTER TYPE ... ADD VALUE and it must be lowercase
    # to match the Python enum value (CommunicationStatus.ARCHIVED = "archived")
    op.execute("ALTER TYPE communicationstatus ADD VALUE 'archived'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values
    # This is a one-way migration
    # To downgrade, you would need to recreate the enum type without 'archived'
    pass
