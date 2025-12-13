"""make tag created_by nullable

Revision ID: 20251212_1706
Revises: (will be filled by alembic)
Create Date: 2025-12-12 17:06:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251212_1706'
down_revision = '20251210_0300'  # Points to make_contact_tag_added_by_nullable
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Make tags.created_by nullable to allow public form submissions"""
    # Drop the NOT NULL constraint on tags.created_by
    op.alter_column('tags', 'created_by',
               existing_type=postgresql.UUID(),
               nullable=True)


def downgrade() -> None:
    """Revert tags.created_by back to NOT NULL"""
    # Add back the NOT NULL constraint
    op.alter_column('tags', 'created_by',
               existing_type=postgresql.UUID(),
               nullable=False)
