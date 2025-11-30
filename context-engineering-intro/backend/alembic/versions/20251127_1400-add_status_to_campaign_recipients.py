"""add status to campaign_recipients

Revision ID: 20251127_1400
Revises: 20251115_2230
Create Date: 2025-11-27 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251127_1400'
down_revision = '20251126_0000'
branch_labels = None
depends_on = None


def upgrade():
    """Add status column to campaign_recipients table"""

    # Create the enum type first
    conn = op.get_bind()

    # Check if enum type exists
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaignrecipientstatus')"
    )).scalar()

    if not result:
        # Create the enum type using raw SQL to avoid quoting issues
        conn.execute(sa.text("""
            CREATE TYPE campaignrecipientstatus AS ENUM (
                'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed'
            )
        """))

    # Add status column using raw SQL to ensure proper enum handling
    # Use UPPERCASE enum value to match existing enum definition
    conn.execute(sa.text("""
        ALTER TABLE campaign_recipients
        ADD COLUMN status campaignrecipientstatus NOT NULL DEFAULT 'PENDING'::campaignrecipientstatus
    """))

    # Add index on status column
    op.create_index(
        'idx_campaign_recipient_status',
        'campaign_recipients',
        ['status']
    )

    # Add composite index for common query pattern
    op.create_index(
        'idx_campaign_recipient_campaign_status',
        'campaign_recipients',
        ['campaign_id', 'status']
    )


def downgrade():
    """Remove status column from campaign_recipients table"""

    # Drop indexes first
    op.drop_index('idx_campaign_recipient_campaign_status', table_name='campaign_recipients')
    op.drop_index('idx_campaign_recipient_status', table_name='campaign_recipients')

    # Drop column
    op.drop_column('campaign_recipients', 'status')

    # Note: We don't drop the enum type as it might be used elsewhere
    # If you want to drop it, uncomment the following:
    # conn = op.get_bind()
    # conn.execute(sa.text("DROP TYPE IF EXISTS campaignrecipientstatus"))
