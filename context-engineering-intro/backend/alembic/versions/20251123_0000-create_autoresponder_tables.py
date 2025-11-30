"""create autoresponder tables

Revision ID: autoresponder_20251123
Revises: email_campaigns_2025
Create Date: 2025-11-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'autoresponder_20251123'
down_revision = 'email_campaigns_2025'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create trigger_type enum
    op.execute("""
        CREATE TYPE triggertype AS ENUM (
            'new_contact',
            'tag_added',
            'date_based',
            'appointment_booked',
            'appointment_completed'
        )
    """)

    # Create execution_status enum
    op.execute("""
        CREATE TYPE executionstatus AS ENUM (
            'pending',
            'sent',
            'failed',
            'skipped'
        )
    """)

    # Create autoresponders table
    op.create_table(
        'autoresponders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('trigger_type', sa.Enum('new_contact', 'tag_added', 'date_based', 'appointment_booked', 'appointment_completed', name='triggertype'), nullable=False),
        sa.Column('trigger_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('subject', sa.String(500), nullable=True),
        sa.Column('body_html', sa.Text(), nullable=True),
        sa.Column('send_from_user', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('sequence_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_executions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_sent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_failed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['email_templates.id'], ),
    )

    # Create indexes for autoresponders
    op.create_index('idx_autoresponder_created_by', 'autoresponders', ['created_by'])
    op.create_index('idx_autoresponder_trigger_type', 'autoresponders', ['trigger_type'])
    op.create_index('idx_autoresponder_is_active', 'autoresponders', ['is_active'])
    op.create_index('idx_autoresponder_template_id', 'autoresponders', ['template_id'])
    op.create_index('idx_autoresponder_active_trigger', 'autoresponders', ['is_active', 'trigger_type'])

    # Create autoresponder_sequences table
    op.create_table(
        'autoresponder_sequences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('autoresponder_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sequence_order', sa.Integer(), nullable=False),
        sa.Column('delay_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('delay_hours', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('subject', sa.String(500), nullable=True),
        sa.Column('body_html', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['autoresponder_id'], ['autoresponders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['email_templates.id'], ),
    )

    # Create indexes for autoresponder_sequences
    op.create_index('idx_autoresponder_sequence_autoresponder_id', 'autoresponder_sequences', ['autoresponder_id'])
    op.create_index('idx_autoresponder_sequence_template_id', 'autoresponder_sequences', ['template_id'])
    op.create_index('idx_autoresponder_sequence_order', 'autoresponder_sequences', ['autoresponder_id', 'sequence_order'])

    # Create autoresponder_executions table
    op.create_table(
        'autoresponder_executions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('autoresponder_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sequence_step', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('triggered_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('scheduled_for', sa.DateTime(timezone=True), nullable=False),
        sa.Column('executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.Enum('pending', 'sent', 'failed', 'skipped', name='executionstatus'), nullable=False, server_default='pending'),
        sa.Column('mailgun_message_id', sa.String(255), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['autoresponder_id'], ['autoresponders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ),
    )

    # Create indexes for autoresponder_executions
    op.create_index('idx_autoresponder_execution_autoresponder_id', 'autoresponder_executions', ['autoresponder_id'])
    op.create_index('idx_autoresponder_execution_contact_id', 'autoresponder_executions', ['contact_id'])
    op.create_index('idx_autoresponder_execution_status', 'autoresponder_executions', ['status'])
    op.create_index('idx_autoresponder_execution_scheduled_for', 'autoresponder_executions', ['scheduled_for'])
    op.create_index('idx_autoresponder_execution_mailgun_id', 'autoresponder_executions', ['mailgun_message_id'])
    op.create_index('idx_autoresponder_execution_pending', 'autoresponder_executions', ['status', 'scheduled_for'])
    op.create_index('idx_autoresponder_execution_contact_autoresponder', 'autoresponder_executions', ['contact_id', 'autoresponder_id'])


def downgrade() -> None:
    # Drop tables
    op.drop_table('autoresponder_executions')
    op.drop_table('autoresponder_sequences')
    op.drop_table('autoresponders')

    # Drop enums
    op.execute('DROP TYPE executionstatus')
    op.execute('DROP TYPE triggertype')
