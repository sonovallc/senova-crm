"""add normalized phone column and unique indexes for dedupe

Revision ID: add_normalized_phone_indexes
Revises: 59fdde26c5a9
Create Date: 2025-11-15 22:30:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision = 'add_normalized_phone_indexes'
down_revision = '59fdde26c5a9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('contacts', sa.Column('normalized_phone', sa.String(length=20), nullable=True))

    # Non-unique index to accelerate lookups
    op.create_index(
        'ix_contacts_normalized_phone_all',
        'contacts',
        ['normalized_phone'],
        unique=False
    )

    conn = op.get_bind()

    # Populate normalized_phone for existing rows using simplified normalization
    conn.execute(text("""
        UPDATE contacts
        SET normalized_phone = CASE
            WHEN phone IS NULL THEN NULL
            ELSE (
                CASE
                    WHEN char_length(regexp_replace(phone, '[^0-9]', '', 'g')) = 11
                         AND left(regexp_replace(phone, '[^0-9]', '', 'g'), 1) = '1'
                        THEN '+' || regexp_replace(phone, '[^0-9]', '', 'g')
                    WHEN char_length(regexp_replace(phone, '[^0-9]', '', 'g')) = 10
                        THEN '+1' || regexp_replace(phone, '[^0-9]', '', 'g')
                    ELSE NULL
                END
            )
        END
    """))

    # Clear duplicates so unique index can be created
    conn.execute(text("""
        WITH ranked AS (
            SELECT
                id,
                normalized_phone,
                ROW_NUMBER() OVER (
                    PARTITION BY normalized_phone
                    ORDER BY created_at
                ) AS rn
            FROM contacts
            WHERE normalized_phone IS NOT NULL
              AND is_active = true
        )
        UPDATE contacts
        SET normalized_phone = NULL
        WHERE id IN (
            SELECT id FROM ranked WHERE rn > 1
        )
    """))

    # Recreate partial unique index on lower(email) for active contacts
    conn.execute(text("DROP INDEX IF EXISTS ix_contacts_email_active_only"))
    conn.execute(text("""
        CREATE UNIQUE INDEX ix_contacts_email_active_only
        ON contacts (lower(email))
        WHERE email IS NOT NULL AND is_active = true
    """))

    # Unique index on normalized_phone for active contacts
    conn.execute(text("""
        CREATE UNIQUE INDEX IF NOT EXISTS ix_contacts_normalized_phone_active_only
        ON contacts (normalized_phone)
        WHERE normalized_phone IS NOT NULL AND is_active = true
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(text("DROP INDEX IF EXISTS ix_contacts_normalized_phone_active_only"))
    conn.execute(text("DROP INDEX IF EXISTS ix_contacts_email_active_only"))

    op.drop_index('ix_contacts_normalized_phone_all', table_name='contacts')
    op.drop_column('contacts', 'normalized_phone')

    # Restore previous email unique index (non-lowercase version)
    conn.execute(text("""
        CREATE UNIQUE INDEX ix_contacts_email_active_only
        ON contacts (email)
        WHERE email IS NOT NULL AND is_active = true
    """))
