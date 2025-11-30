"""create csv_import_audit_log table

Revision ID: e9d3h3hc56f3
Revises: d8c2g2gb45e2
Create Date: 2025-11-19 15:00

Milestone 3: Audit trail for tracking all import decisions and actions
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = 'e9d3h3hc56f3'
down_revision = 'd8c2g2gb45e2'
branch_labels = None
depends_on = None


def upgrade():
    # Create csv_import_audit_log table
    op.create_table(
        'csv_import_audit_log',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('validation_id', UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('file_id', sa.String(255), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('action_type', sa.String(50), nullable=False),  # 'decision', 'import', 'bulk_action'
        sa.Column('duplicate_group_id', sa.String(255), nullable=True),
        sa.Column('decision', sa.String(50), nullable=True),  # 'skip', 'keep', 'merge'
        sa.Column('rows_affected', sa.Integer(), nullable=True),
        sa.Column('details', JSONB, default={}, nullable=True),  # Additional context
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Create indexes for efficient queries
    op.create_index('idx_audit_log_validation_id', 'csv_import_audit_log', ['validation_id'])
    op.create_index('idx_audit_log_user_id', 'csv_import_audit_log', ['user_id'])
    op.create_index('idx_audit_log_action_type', 'csv_import_audit_log', ['action_type'])
    op.create_index('idx_audit_log_created_at', 'csv_import_audit_log', ['created_at'])


def downgrade():
    op.drop_index('idx_audit_log_created_at', table_name='csv_import_audit_log')
    op.drop_index('idx_audit_log_action_type', table_name='csv_import_audit_log')
    op.drop_index('idx_audit_log_user_id', table_name='csv_import_audit_log')
    op.drop_index('idx_audit_log_validation_id', table_name='csv_import_audit_log')
    op.drop_table('csv_import_audit_log')
