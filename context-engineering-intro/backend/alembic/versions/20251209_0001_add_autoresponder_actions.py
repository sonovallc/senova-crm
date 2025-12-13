"""Add autoresponder_actions table for multi-action support

Revision ID: 20251209_0001
Revises: 20251208_0002
Create Date: 2025-12-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251209_0001'
down_revision = '20251208_0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create autoresponder_actions table
    op.create_table(
        'autoresponder_actions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('autoresponder_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action_order', sa.Integer(), nullable=False, default=1),
        sa.Column('action_name', sa.String(255), nullable=True),
        sa.Column('response_channel', sa.Enum('email', 'sms', 'webchat', name='responsechannel', create_type=False), nullable=False, server_default='email'),
        sa.Column('recipient_type', sa.Enum('contact', 'user', 'manual', name='recipienttype', create_type=False), nullable=False, server_default='contact'),
        sa.Column('recipient_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('recipient_email', sa.String(255), nullable=True),
        sa.Column('recipient_phone', sa.String(50), nullable=True),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('subject', sa.String(500), nullable=True),
        sa.Column('body_html', sa.Text(), nullable=True),
        sa.Column('sms_body', sa.Text(), nullable=True),
        sa.Column('send_from_user', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['autoresponder_id'], ['autoresponders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['template_id'], ['email_templates.id'], ondelete='SET NULL'),
    )

    # Create indexes
    op.create_index('idx_autoresponder_action_autoresponder_id', 'autoresponder_actions', ['autoresponder_id'])
    op.create_index('idx_autoresponder_action_order', 'autoresponder_actions', ['autoresponder_id', 'action_order'])
    op.create_index('idx_autoresponder_action_channel', 'autoresponder_actions', ['response_channel'])
    op.create_index('idx_autoresponder_action_recipient_type', 'autoresponder_actions', ['recipient_type'])
    op.create_index('idx_autoresponder_action_template_id', 'autoresponder_actions', ['template_id'])
    op.create_index('idx_autoresponder_action_recipient_user_id', 'autoresponder_actions', ['recipient_user_id'])

    # Migrate existing autoresponder data to actions
    # For each existing autoresponder, create a corresponding action
    op.execute("""
        INSERT INTO autoresponder_actions (
            id,
            autoresponder_id,
            action_order,
            action_name,
            response_channel,
            recipient_type,
            recipient_user_id,
            recipient_email,
            recipient_phone,
            template_id,
            subject,
            body_html,
            sms_body,
            send_from_user,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            gen_random_uuid(),
            id,
            1,
            'Primary Action',
            response_channel,
            recipient_type,
            recipient_user_id,
            recipient_email,
            recipient_phone,
            template_id,
            subject,
            body_html,
            sms_body,
            send_from_user,
            TRUE,
            created_at,
            updated_at
        FROM autoresponders
        WHERE response_channel IS NOT NULL
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_autoresponder_action_recipient_user_id', table_name='autoresponder_actions')
    op.drop_index('idx_autoresponder_action_template_id', table_name='autoresponder_actions')
    op.drop_index('idx_autoresponder_action_recipient_type', table_name='autoresponder_actions')
    op.drop_index('idx_autoresponder_action_channel', table_name='autoresponder_actions')
    op.drop_index('idx_autoresponder_action_order', table_name='autoresponder_actions')
    op.drop_index('idx_autoresponder_action_autoresponder_id', table_name='autoresponder_actions')

    # Drop table
    op.drop_table('autoresponder_actions')
