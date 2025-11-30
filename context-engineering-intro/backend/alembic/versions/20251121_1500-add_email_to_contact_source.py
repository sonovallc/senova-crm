"""add email to contact source enum

Revision ID: f1g2h3i4j5k6
Revises: b7c8d9e0f1a2
Create Date: 2025-11-21 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1g2h3i4j5k6'
down_revision = 'b7c8d9e0f1a2'
branch_labels = None
depends_on = None


def upgrade():
    # Add 'EMAIL' to contactsource enum (uppercase to match existing values)
    # Using ALTER TYPE with IF NOT EXISTS for safety
    op.execute("ALTER TYPE contactsource ADD VALUE IF NOT EXISTS 'EMAIL'")


def downgrade():
    # Cannot remove enum value in PostgreSQL without recreating the entire enum
    # and all tables that use it. This is a one-way migration for safety.
    # If you really need to remove it, you would need to:
    # 1. Create new enum without 'email'
    # 2. Alter all columns using the enum to use new enum
    # 3. Drop old enum
    # 4. Rename new enum to old name
    # This is complex and risky, so we don't support downgrade.
    pass
