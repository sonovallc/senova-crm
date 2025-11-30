"""create contact activities

Revision ID: b786d1f292e8
Revises: 5ac70a7e0cbe
Create Date: 2025-11-16 09:03:41.281812

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'b786d1f292e8'
down_revision = '5ac70a7e0cbe'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'contact_activities',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('contact_name', sa.String(length=255), nullable=True),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('activity_type', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_name', sa.String(length=255), nullable=True),
        sa.Column('details', postgresql.JSONB(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.create_index('ix_contact_activities_contact_id', 'contact_activities', ['contact_id'])
    op.create_index('ix_contact_activities_created_at', 'contact_activities', ['created_at'])
    op.create_index('ix_contact_activities_activity_type', 'contact_activities', ['activity_type'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'contact_activities' not in inspector.get_table_names():
        return

    for index_name in (
        'ix_contact_activities_activity_type',
        'ix_contact_activities_created_at',
        'ix_contact_activities_contact_id',
    ):
        op.drop_index(index_name, table_name='contact_activities')

    op.drop_table('contact_activities')
