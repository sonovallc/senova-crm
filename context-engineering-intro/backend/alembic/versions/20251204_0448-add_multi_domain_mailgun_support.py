"""add_multi_domain_mailgun_support

Revision ID: f6g7h8i9j0k1
Revises: e5f6a7b8c9d0
Create Date: 2025-12-04 04:48:00.000000

Adds support for multiple Mailgun domains per Object.
Allows email profiles to specify which domain to send from.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f6g7h8i9j0k1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add multi-domain Mailgun support"""

    # Step 1: Drop the unique constraint on object_id in object_mailgun_settings
    op.drop_constraint('uq_object_mailgun_object_id', 'object_mailgun_settings', type_='unique')

    # Step 2: Add name column to object_mailgun_settings
    # Use sending_domain as default value for existing records
    op.add_column('object_mailgun_settings',
        sa.Column('name', sa.String(255), nullable=True))

    # Set name to sending_domain for existing records
    op.execute("""
        UPDATE object_mailgun_settings
        SET name = sending_domain
        WHERE name IS NULL
    """)

    # Now make it NOT NULL
    op.alter_column('object_mailgun_settings', 'name',
                   nullable=False)

    # Step 3: Add is_default column to object_mailgun_settings
    op.add_column('object_mailgun_settings',
        sa.Column('is_default', sa.Boolean, nullable=False, server_default='false'))

    # Set existing records as default (since they're currently the only ones)
    op.execute("""
        UPDATE object_mailgun_settings
        SET is_default = true
    """)

    # Step 4: Add mailgun_settings_id to email_sending_profiles
    op.add_column('email_sending_profiles',
        sa.Column('mailgun_settings_id', postgresql.UUID(as_uuid=True), nullable=True))

    # Create foreign key constraint
    op.create_foreign_key(
        'fk_email_profile_mailgun_settings',
        'email_sending_profiles',
        'object_mailgun_settings',
        ['mailgun_settings_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Step 5: Link existing email_sending_profiles to their object's default mailgun settings
    op.execute("""
        UPDATE email_sending_profiles esp
        SET mailgun_settings_id = oms.id
        FROM object_mailgun_settings oms
        WHERE esp.object_id = oms.object_id
        AND oms.is_default = true
        AND esp.object_id IS NOT NULL
    """)

    # Step 6: Create indexes for better performance
    op.create_index('idx_object_mailgun_name', 'object_mailgun_settings', ['name'])
    op.create_index('idx_object_mailgun_default', 'object_mailgun_settings', ['object_id', 'is_default'])
    op.create_index('idx_email_profile_mailgun', 'email_sending_profiles', ['mailgun_settings_id'])

    # Step 7: Add constraint to ensure only one default per object
    op.create_index(
        'uq_object_mailgun_one_default_per_object',
        'object_mailgun_settings',
        ['object_id'],
        unique=True,
        postgresql_where=sa.text('is_default = true')
    )

    # Step 8: Add comments to explain the new structure
    op.execute("""
        COMMENT ON COLUMN object_mailgun_settings.name IS
        'Display name for this Mailgun configuration (e.g., "Primary Domain" or the domain name)';
    """)

    op.execute("""
        COMMENT ON COLUMN object_mailgun_settings.is_default IS
        'Whether this is the default Mailgun configuration for the object. Only one can be default.';
    """)

    op.execute("""
        COMMENT ON COLUMN email_sending_profiles.mailgun_settings_id IS
        'Specific Mailgun configuration to use for sending. If NULL, uses object default.';
    """)


def downgrade() -> None:
    """Remove multi-domain Mailgun support"""

    # Drop the partial unique index first
    op.drop_index('uq_object_mailgun_one_default_per_object', table_name='object_mailgun_settings')

    # Drop indexes
    op.drop_index('idx_email_profile_mailgun', table_name='email_sending_profiles')
    op.drop_index('idx_object_mailgun_default', table_name='object_mailgun_settings')
    op.drop_index('idx_object_mailgun_name', table_name='object_mailgun_settings')

    # Drop foreign key constraint
    op.drop_constraint('fk_email_profile_mailgun_settings', 'email_sending_profiles', type_='foreignkey')

    # Drop mailgun_settings_id column from email_sending_profiles
    op.drop_column('email_sending_profiles', 'mailgun_settings_id')

    # Keep only default mailgun settings for each object (delete non-defaults)
    op.execute("""
        DELETE FROM object_mailgun_settings
        WHERE is_default = false
    """)

    # Drop is_default column
    op.drop_column('object_mailgun_settings', 'is_default')

    # Drop name column
    op.drop_column('object_mailgun_settings', 'name')

    # Re-add the unique constraint on object_id
    op.create_unique_constraint('uq_object_mailgun_object_id', 'object_mailgun_settings', ['object_id'])