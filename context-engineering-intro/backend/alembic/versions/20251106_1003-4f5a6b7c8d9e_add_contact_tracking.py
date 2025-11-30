"""add_contact_tracking

Revision ID: 4f5a6b7c8d9e
Revises: 5c6d7e8f9a0b
Create Date: 2025-11-06 10:03:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '4f5a6b7c8d9e'
down_revision = '5c6d7e8f9a0b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add contact tracking fields
    op.add_column('contacts', sa.Column('creation_source', sa.String(50), nullable=True))
    op.add_column('contacts', sa.Column('created_by_user_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('contacts', sa.Column('source_form_id', sa.String(100), nullable=True))
    op.add_column('contacts', sa.Column('source_form_name', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('utm_source', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('utm_medium', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('utm_campaign', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('utm_term', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('utm_content', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('referral_source', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('lead_score', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('contacts', sa.Column('initial_notes', sa.Text(), nullable=True))

    # Add foreign key
    op.create_foreign_key('fk_contacts_created_by_user', 'contacts', 'users', ['created_by_user_id'], ['id'])

    # Add indexes
    op.create_index('idx_contacts_creation_source', 'contacts', ['creation_source'])
    op.create_index('idx_contacts_utm_campaign', 'contacts', ['utm_campaign'])
    op.create_index('idx_contacts_lead_score', 'contacts', ['lead_score'])


def downgrade() -> None:
    op.drop_index('idx_contacts_lead_score', 'contacts')
    op.drop_index('idx_contacts_utm_campaign', 'contacts')
    op.drop_index('idx_contacts_creation_source', 'contacts')
    op.drop_constraint('fk_contacts_created_by_user', 'contacts', type_='foreignkey')
    op.drop_column('contacts', 'initial_notes')
    op.drop_column('contacts', 'lead_score')
    op.drop_column('contacts', 'referral_source')
    op.drop_column('contacts', 'utm_content')
    op.drop_column('contacts', 'utm_term')
    op.drop_column('contacts', 'utm_campaign')
    op.drop_column('contacts', 'utm_medium')
    op.drop_column('contacts', 'utm_source')
    op.drop_column('contacts', 'source_form_name')
    op.drop_column('contacts', 'source_form_id')
    op.drop_column('contacts', 'created_by_user_id')
    op.drop_column('contacts', 'creation_source')
