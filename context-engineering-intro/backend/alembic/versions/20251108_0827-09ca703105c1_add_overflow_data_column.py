"""add_overflow_data_column

Revision ID: 09ca703105c1
Revises: 46d8e9b8c394
Create Date: 2025-11-08 08:27:18.277055

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '09ca703105c1'
down_revision = '46d8e9b8c394'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add overflow_data JSONB column to store additional comma-delimited values
    op.add_column('contacts',
                  sa.Column('overflow_data', postgresql.JSONB,
                           nullable=True,
                           server_default='{}'))

    # Create GIN index for efficient JSONB queries
    # GIN (Generalized Inverted Index) is optimal for JSONB containment queries
    op.create_index(
        'idx_contacts_overflow_data_gin',
        'contacts',
        ['overflow_data'],
        postgresql_using='gin'
    )


def downgrade() -> None:
    # Drop GIN index first
    op.drop_index('idx_contacts_overflow_data_gin', table_name='contacts')

    # Drop overflow_data column
    op.drop_column('contacts', 'overflow_data')
