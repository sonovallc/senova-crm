"""add_30_overflow_fields_comprehensive

Revision ID: 069f15e131a2
Revises: 55d82bc537d9
Create Date: 2025-11-10 21:32:08.815367

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '069f15e131a2'
down_revision = '55d82bc537d9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add 30 overflow fields for all comma-delimited column types"""

    # ========================================================================
    # EXISTING PHONE TYPES: Extend from 5 to 30
    # ========================================================================

    # Mobile Phone - Add 6-30 (1-5 already exist)
    for i in range(6, 31):
        op.add_column('contacts', sa.Column(f'mobile_phone_{i}', sa.String(20), nullable=True))
        op.add_column('contacts', sa.Column(f'mobile_phone_{i}_dnc', sa.Boolean(), nullable=True))

    # Personal Phone - Add 6-30 (1-5 already exist)
    for i in range(6, 31):
        op.add_column('contacts', sa.Column(f'personal_phone_{i}', sa.String(20), nullable=True))
        op.add_column('contacts', sa.Column(f'personal_phone_{i}_dnc', sa.Boolean(), nullable=True))

    # Direct Number - Add 6-30 (1-5 already exist)
    for i in range(6, 31):
        op.add_column('contacts', sa.Column(f'direct_number_{i}', sa.String(20), nullable=True))
        op.add_column('contacts', sa.Column(f'direct_number_{i}_dnc', sa.Boolean(), nullable=True))

    # ========================================================================
    # NEW PHONE TYPES: Add 1-30 (completely new)
    # ========================================================================

    # Company Phone overflow (company_phone base field already exists)
    for i in range(2, 31):
        op.add_column('contacts', sa.Column(f'company_phone_{i}', sa.String(20), nullable=True))
        op.add_column('contacts', sa.Column(f'company_phone_{i}_dnc', sa.Boolean(), nullable=True))

    # Skiptrace Landline Numbers (new type)
    for i in range(1, 31):
        op.add_column('contacts', sa.Column(f'skiptrace_landline_{i}', sa.String(20), nullable=True))
        op.add_column('contacts', sa.Column(f'skiptrace_landline_{i}_dnc', sa.Boolean(), nullable=True))

    # Skiptrace Wireless Numbers (new type)
    for i in range(1, 31):
        op.add_column('contacts', sa.Column(f'skiptrace_wireless_{i}', sa.String(20), nullable=True))
        op.add_column('contacts', sa.Column(f'skiptrace_wireless_{i}_dnc', sa.Boolean(), nullable=True))

    # Skiptrace B2B Phone (new type)
    for i in range(1, 31):
        op.add_column('contacts', sa.Column(f'skiptrace_b2b_phone_{i}', sa.String(20), nullable=True))
        op.add_column('contacts', sa.Column(f'skiptrace_b2b_phone_{i}_dnc', sa.Boolean(), nullable=True))

    # ========================================================================
    # EMAIL OVERFLOW FIELDS
    # ========================================================================

    # Personal Email overflow (1-30)
    # Note: personal_emails currently exists as single text field, will be deprecated
    for i in range(1, 31):
        op.add_column('contacts', sa.Column(f'personal_email_{i}', sa.String(255), nullable=True))

    # Business Email overflow (2-30, business_email base exists)
    for i in range(2, 31):
        op.add_column('contacts', sa.Column(f'business_email_{i}', sa.String(255), nullable=True))

    # Personal Verified Email overflow (1-30)
    for i in range(1, 31):
        op.add_column('contacts', sa.Column(f'personal_verified_email_{i}', sa.String(255), nullable=True))

    # Business Verified Email overflow (1-30)
    for i in range(1, 31):
        op.add_column('contacts', sa.Column(f'business_verified_email_{i}', sa.String(255), nullable=True))

    # ========================================================================
    # SHA256 HASH OVERFLOW FIELDS
    # ========================================================================

    # SHA256 Personal Email hashes (1-30)
    for i in range(1, 31):
        op.add_column('contacts', sa.Column(f'sha256_personal_email_{i}', sa.String(64), nullable=True))

    # SHA256 Business Email hashes (1-30)
    for i in range(1, 31):
        op.add_column('contacts', sa.Column(f'sha256_business_email_{i}', sa.String(64), nullable=True))


def downgrade() -> None:
    """Remove all overflow fields"""

    # Mobile Phone - Remove 6-30
    for i in range(6, 31):
        op.drop_column('contacts', f'mobile_phone_{i}')
        op.drop_column('contacts', f'mobile_phone_{i}_dnc')

    # Personal Phone - Remove 6-30
    for i in range(6, 31):
        op.drop_column('contacts', f'personal_phone_{i}')
        op.drop_column('contacts', f'personal_phone_{i}_dnc')

    # Direct Number - Remove 6-30
    for i in range(6, 31):
        op.drop_column('contacts', f'direct_number_{i}')
        op.drop_column('contacts', f'direct_number_{i}_dnc')

    # Company Phone - Remove 2-30
    for i in range(2, 31):
        op.drop_column('contacts', f'company_phone_{i}')
        op.drop_column('contacts', f'company_phone_{i}_dnc')

    # Skiptrace Landline - Remove 1-30
    for i in range(1, 31):
        op.drop_column('contacts', f'skiptrace_landline_{i}')
        op.drop_column('contacts', f'skiptrace_landline_{i}_dnc')

    # Skiptrace Wireless - Remove 1-30
    for i in range(1, 31):
        op.drop_column('contacts', f'skiptrace_wireless_{i}')
        op.drop_column('contacts', f'skiptrace_wireless_{i}_dnc')

    # Skiptrace B2B Phone - Remove 1-30
    for i in range(1, 31):
        op.drop_column('contacts', f'skiptrace_b2b_phone_{i}')
        op.drop_column('contacts', f'skiptrace_b2b_phone_{i}_dnc')

    # Personal Email - Remove 1-30
    for i in range(1, 31):
        op.drop_column('contacts', f'personal_email_{i}')

    # Business Email - Remove 2-30
    for i in range(2, 31):
        op.drop_column('contacts', f'business_email_{i}')

    # Personal Verified Email - Remove 1-30
    for i in range(1, 31):
        op.drop_column('contacts', f'personal_verified_email_{i}')

    # Business Verified Email - Remove 1-30
    for i in range(1, 31):
        op.drop_column('contacts', f'business_verified_email_{i}')

    # SHA256 Personal Email - Remove 1-30
    for i in range(1, 31):
        op.drop_column('contacts', f'sha256_personal_email_{i}')

    # SHA256 Business Email - Remove 1-30
    for i in range(1, 31):
        op.drop_column('contacts', f'sha256_business_email_{i}')
