"""convert_email_unique_to_partial_active_only

Revision ID: 59fdde26c5a9
Revises: a1b2c3d4e5f6
Create Date: 2025-11-14 11:35:30.192509

CRITICAL FIX: Convert email UNIQUE constraint to partial unique index.

Problem: The blanket UNIQUE constraint on email column blocks re-importing contacts
that were soft-deleted (is_active=false). This causes 93% import failure rate when
users "delete all" contacts (soft-delete) and try to re-import the same CSV.

Solution:
- Drop the blanket UNIQUE index on email
- Create partial UNIQUE index that only applies to active contacts
- This allows inactive contacts to remain in DB for historical purposes
- Active contacts still have uniqueness enforced

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '59fdde26c5a9'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Convert email unique constraint to partial unique index for active contacts only.

    This allows soft-deleted contacts to remain in database without blocking re-imports.
    """
    # Drop the existing unique index on email
    # Note: This was created by SQLAlchemy's unique=True parameter
    op.drop_index('ix_contacts_email', table_name='contacts')

    # Create a regular (non-unique) index on email for search performance
    # This applies to ALL contacts (active and inactive)
    op.create_index(
        'ix_contacts_email_all',
        'contacts',
        ['email'],
        unique=False
    )

    # Create a partial UNIQUE index that ONLY applies to active contacts
    # PostgreSQL syntax: CREATE UNIQUE INDEX ... WHERE is_active = true
    op.execute("""
        CREATE UNIQUE INDEX ix_contacts_email_active_only
        ON contacts(email)
        WHERE is_active = true AND email IS NOT NULL
    """)


def downgrade() -> None:
    """
    Revert to blanket unique constraint on email.

    WARNING: This will fail if there are duplicate emails among inactive contacts.
    You may need to manually clean up duplicates before downgrading.
    """
    # Drop the partial unique index
    op.drop_index('ix_contacts_email_active_only', table_name='contacts')

    # Drop the non-unique search index
    op.drop_index('ix_contacts_email_all', table_name='contacts')

    # Recreate the original unique index
    op.create_index(
        'ix_contacts_email',
        'contacts',
        ['email'],
        unique=True
    )
