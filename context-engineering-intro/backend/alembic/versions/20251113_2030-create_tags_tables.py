"""create_tags_tables

Revision ID: a1b2c3d4e5f6
Revises: 069f15e131a2
Create Date: 2025-11-13 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '069f15e131a2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create tags and contact_tags tables"""

    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False, unique=True),
        sa.Column('color', sa.String(7), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_tags_created_by'),
    )

    # Create indexes for tags
    op.create_index('idx_tag_name', 'tags', ['name'])
    op.create_index('idx_tag_created_by', 'tags', ['created_by'])

    # Create contact_tags join table
    op.create_table(
        'contact_tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('added_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], name='fk_contact_tags_contact', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], name='fk_contact_tags_tag', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['added_by'], ['users.id'], name='fk_contact_tags_added_by'),
        sa.UniqueConstraint('contact_id', 'tag_id', name='uq_contact_tag'),
    )

    # Create indexes for contact_tags
    op.create_index('idx_contact_tags_contact', 'contact_tags', ['contact_id'])
    op.create_index('idx_contact_tags_tag', 'contact_tags', ['tag_id'])


def downgrade() -> None:
    """Drop tags and contact_tags tables"""

    # Drop indexes first
    op.drop_index('idx_contact_tags_tag', table_name='contact_tags')
    op.drop_index('idx_contact_tags_contact', table_name='contact_tags')
    op.drop_index('idx_tag_created_by', table_name='tags')
    op.drop_index('idx_tag_name', table_name='tags')

    # Drop tables
    op.drop_table('contact_tags')
    op.drop_table('tags')
