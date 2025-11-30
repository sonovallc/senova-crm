"""create feature flags table

Revision ID: c7b1f1fa34d1
Revises: b786d1f292e8
Create Date: 2025-11-17 01:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import func


# revision identifiers, used by Alembic.
revision = 'c7b1f1fa34d1'
down_revision = 'b786d1f292e8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'feature_flags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('key', sa.Text(), nullable=False, unique=True),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index('ix_feature_flags_key', 'feature_flags', ['key'], unique=True)
    op.create_index('ix_feature_flags_enabled', 'feature_flags', ['enabled'])


def downgrade() -> None:
    op.drop_index('ix_feature_flags_enabled', table_name='feature_flags')
    op.drop_index('ix_feature_flags_key', table_name='feature_flags')
    op.drop_table('feature_flags')
