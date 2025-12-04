"""modify_email_sending_profiles_object_support

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2025-12-04 02:42:00.000000

Modifies email_sending_profiles table to support object-level email configuration.
Adds object_id and local_part columns for object-specific email addresses.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add object_id and local_part columns to email_sending_profiles table"""

    # Add new columns to email_sending_profiles
    op.add_column('email_sending_profiles',
        sa.Column('object_id', postgresql.UUID(as_uuid=True), nullable=True))

    op.add_column('email_sending_profiles',
        sa.Column('local_part', sa.String(64), nullable=True))

    # Add foreign key constraint to objects table
    op.create_foreign_key(
        'fk_email_profile_object',
        'email_sending_profiles',
        'objects',
        ['object_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Create index on object_id for better query performance
    op.create_index('idx_email_profile_object', 'email_sending_profiles', ['object_id'])

    # Add comment to explain the dual mode
    op.execute("""
        COMMENT ON COLUMN email_sending_profiles.object_id IS
        'Object this profile belongs to. When set, local_part + object sending domain is used';
    """)

    op.execute("""
        COMMENT ON COLUMN email_sending_profiles.local_part IS
        'Local part of email (before @). Used with object sending domain when object_id is set';
    """)

    op.execute("""
        COMMENT ON COLUMN email_sending_profiles.email_address IS
        'Full email address. Used for backward compatibility when object_id is NULL';
    """)


def downgrade() -> None:
    """Remove object_id and local_part columns from email_sending_profiles table"""

    # Drop index first
    op.drop_index('idx_email_profile_object', table_name='email_sending_profiles')

    # Drop foreign key constraint
    op.drop_constraint('fk_email_profile_object', 'email_sending_profiles', type_='foreignkey')

    # Drop columns
    op.drop_column('email_sending_profiles', 'local_part')
    op.drop_column('email_sending_profiles', 'object_id')