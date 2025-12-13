"""Add autoresponder channel and recipient fields

Revision ID: 20251208_0002
Revises: 20251208_0001_create_twilio_wallet_tables
Create Date: 2025-12-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251208_0002'
down_revision = '20251208_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    response_channel_enum = postgresql.ENUM('email', 'sms', 'webchat', name='responsechannel', create_type=False)
    recipient_type_enum = postgresql.ENUM('contact', 'user', 'manual', name='recipienttype', create_type=False)

    # Create the enum types first
    op.execute("CREATE TYPE responsechannel AS ENUM ('email', 'sms', 'webchat')")
    op.execute("CREATE TYPE recipienttype AS ENUM ('contact', 'user', 'manual')")

    # Add new columns to autoresponders table
    op.add_column('autoresponders', sa.Column('response_channel',
        sa.Enum('email', 'sms', 'webchat', name='responsechannel'),
        nullable=False,
        server_default='email'))

    op.add_column('autoresponders', sa.Column('recipient_type',
        sa.Enum('contact', 'user', 'manual', name='recipienttype'),
        nullable=False,
        server_default='contact'))

    op.add_column('autoresponders', sa.Column('recipient_user_id',
        postgresql.UUID(as_uuid=True),
        nullable=True))

    op.add_column('autoresponders', sa.Column('recipient_email',
        sa.String(255),
        nullable=True))

    op.add_column('autoresponders', sa.Column('recipient_phone',
        sa.String(50),
        nullable=True))

    op.add_column('autoresponders', sa.Column('sms_body',
        sa.Text(),
        nullable=True))

    # Add foreign key constraint for recipient_user_id
    op.create_foreign_key(
        'fk_autoresponders_recipient_user_id',
        'autoresponders',
        'users',
        ['recipient_user_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Add indexes for new columns
    op.create_index('idx_autoresponder_response_channel', 'autoresponders', ['response_channel'])
    op.create_index('idx_autoresponder_recipient_type', 'autoresponders', ['recipient_type'])
    op.create_index('idx_autoresponder_recipient_user_id', 'autoresponders', ['recipient_user_id'])


def downgrade() -> None:
    # Remove indexes
    op.drop_index('idx_autoresponder_recipient_user_id', table_name='autoresponders')
    op.drop_index('idx_autoresponder_recipient_type', table_name='autoresponders')
    op.drop_index('idx_autoresponder_response_channel', table_name='autoresponders')

    # Remove foreign key
    op.drop_constraint('fk_autoresponders_recipient_user_id', 'autoresponders', type_='foreignkey')

    # Remove columns
    op.drop_column('autoresponders', 'sms_body')
    op.drop_column('autoresponders', 'recipient_phone')
    op.drop_column('autoresponders', 'recipient_email')
    op.drop_column('autoresponders', 'recipient_user_id')
    op.drop_column('autoresponders', 'recipient_type')
    op.drop_column('autoresponders', 'response_channel')

    # Drop enum types
    op.execute("DROP TYPE recipienttype")
    op.execute("DROP TYPE responsechannel")
