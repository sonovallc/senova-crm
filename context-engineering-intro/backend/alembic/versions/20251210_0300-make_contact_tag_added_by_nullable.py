"""Make contact_tag added_by nullable for public API

Revision ID: make_contact_tag_added_by_nullable
Revises: 20251209_0001_add_autoresponder_actions
Create Date: 2025-12-10 03:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251210_0300'
down_revision = '20251209_0001'
branch_labels = None
depends_on = None


def upgrade():
    # Make added_by nullable in contact_tags table
    op.alter_column('contact_tags', 'added_by',
                    existing_type=sa.UUID(),
                    nullable=True)


def downgrade():
    # Make added_by not nullable again
    op.alter_column('contact_tags', 'added_by',
                    existing_type=sa.UUID(),
                    nullable=False)