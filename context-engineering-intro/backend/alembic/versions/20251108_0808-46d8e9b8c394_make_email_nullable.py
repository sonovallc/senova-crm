"""make_email_nullable

Revision ID: 46d8e9b8c394
Revises: de70980ab9ba
Create Date: 2025-11-08 08:08:38.066518

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '46d8e9b8c394'
down_revision = 'de70980ab9ba'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing unique index on email
    op.drop_index('ix_contacts_email', table_name='contacts')

    # Make email column nullable
    op.alter_column('contacts', 'email',
                    existing_type=sa.String(length=255),
                    nullable=True)

    # Create partial unique index - only enforces uniqueness for non-NULL emails
    op.create_index('ix_contacts_email_unique', 'contacts', ['email'], unique=True,
                    postgresql_where=sa.text('email IS NOT NULL'))


def downgrade() -> None:
    # Drop partial unique index
    op.drop_index('ix_contacts_email_unique', table_name='contacts')

    # Make email NOT NULL again (will fail if NULL emails exist)
    op.alter_column('contacts', 'email',
                    existing_type=sa.String(length=255),
                    nullable=False)

    # Recreate original index
    op.create_index('ix_contacts_email', 'contacts', ['email'], unique=True)
