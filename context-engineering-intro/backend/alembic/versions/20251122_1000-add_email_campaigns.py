"""add email campaigns and unsubscribe support

Revision ID: 20251122_1000
Revises: 20251121_1730
Create Date: 2025-11-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'email_campaigns_2025'
down_revision = 'm7n8o9p0q1r2'
branch_labels = None
depends_on = None


def upgrade():
    # Add unsubscribe fields to contacts table
    op.add_column('contacts', sa.Column('unsubscribed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('contacts', sa.Column('unsubscribed_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index('idx_contact_unsubscribed', 'contacts', ['unsubscribed'], unique=False)

    # Create enum types (with conditional check)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaignstatus') THEN
                CREATE TYPE campaignstatus AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaignrecipientstatus') THEN
                CREATE TYPE campaignrecipientstatus AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed');
            END IF;
        END $$;
    """)

    # Create email_campaigns table
    op.create_table('email_campaigns',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=500), nullable=False),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('body_html', sa.Text(), nullable=True),
        sa.Column('body_text', sa.Text(), nullable=True),
        sa.Column('recipient_filter', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('recipient_count', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', name='campaignstatus', create_type=False), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_count', sa.Integer(), nullable=False),
        sa.Column('delivered_count', sa.Integer(), nullable=False),
        sa.Column('opened_count', sa.Integer(), nullable=False),
        sa.Column('clicked_count', sa.Integer(), nullable=False),
        sa.Column('bounced_count', sa.Integer(), nullable=False),
        sa.Column('failed_count', sa.Integer(), nullable=False),
        sa.Column('unsubscribed_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['template_id'], ['email_templates.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_email_campaign_scheduled_at', 'email_campaigns', ['scheduled_at'], unique=False)
    op.create_index('idx_email_campaign_status', 'email_campaigns', ['status'], unique=False)
    op.create_index('idx_email_campaign_template_id', 'email_campaigns', ['template_id'], unique=False)
    op.create_index('idx_email_campaign_user_id', 'email_campaigns', ['user_id'], unique=False)
    op.create_index('idx_email_campaign_user_status', 'email_campaigns', ['user_id', 'status'], unique=False)

    # Create campaign_recipients table
    op.create_table('campaign_recipients',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('status', sa.Enum('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed', name='campaignrecipientstatus', create_type=False), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('opened_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('clicked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('bounced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('mailgun_message_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['campaign_id'], ['email_campaigns.id'], ),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_campaign_recipient_campaign_id', 'campaign_recipients', ['campaign_id'], unique=False)
    op.create_index('idx_campaign_recipient_campaign_status', 'campaign_recipients', ['campaign_id', 'status'], unique=False)
    op.create_index('idx_campaign_recipient_contact_id', 'campaign_recipients', ['contact_id'], unique=False)
    op.create_index('idx_campaign_recipient_email', 'campaign_recipients', ['email'], unique=False)
    op.create_index('idx_campaign_recipient_mailgun_id', 'campaign_recipients', ['mailgun_message_id'], unique=False)
    op.create_index('idx_campaign_recipient_status', 'campaign_recipients', ['status'], unique=False)


def downgrade():
    # Drop campaign_recipients table
    op.drop_index('idx_campaign_recipient_status', table_name='campaign_recipients')
    op.drop_index('idx_campaign_recipient_mailgun_id', table_name='campaign_recipients')
    op.drop_index('idx_campaign_recipient_email', table_name='campaign_recipients')
    op.drop_index('idx_campaign_recipient_contact_id', table_name='campaign_recipients')
    op.drop_index('idx_campaign_recipient_campaign_status', table_name='campaign_recipients')
    op.drop_index('idx_campaign_recipient_campaign_id', table_name='campaign_recipients')
    op.drop_table('campaign_recipients')

    # Drop email_campaigns table
    op.drop_index('idx_email_campaign_user_status', table_name='email_campaigns')
    op.drop_index('idx_email_campaign_user_id', table_name='email_campaigns')
    op.drop_index('idx_email_campaign_template_id', table_name='email_campaigns')
    op.drop_index('idx_email_campaign_status', table_name='email_campaigns')
    op.drop_index('idx_email_campaign_scheduled_at', table_name='email_campaigns')
    op.drop_table('email_campaigns')

    # Drop enums
    op.execute('DROP TYPE campaignrecipientstatus')
    op.execute('DROP TYPE campaignstatus')

    # Remove unsubscribe fields from contacts
    op.drop_index('idx_contact_unsubscribed', table_name='contacts')
    op.drop_column('contacts', 'unsubscribed_at')
    op.drop_column('contacts', 'unsubscribed')
