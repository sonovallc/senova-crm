"""add_data_provider_fields

Revision ID: 5c6d7e8f9a0b
Revises: 7e8d9a2b3c4f
Create Date: 2025-11-06 10:02:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '5c6d7e8f9a0b'
down_revision = '7e8d9a2b3c4f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add provider UUID
    op.add_column('contacts', sa.Column('provider_uuid', postgresql.UUID(as_uuid=True), nullable=True))

    # Personal/Demographic fields
    op.add_column('contacts', sa.Column('personal_address', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('personal_city', sa.String(100), nullable=True))
    op.add_column('contacts', sa.Column('personal_state', sa.String(2), nullable=True))
    op.add_column('contacts', sa.Column('personal_zip', sa.String(10), nullable=True))
    op.add_column('contacts', sa.Column('personal_zip4', sa.String(4), nullable=True))
    op.add_column('contacts', sa.Column('age_range', sa.String(20), nullable=True))
    op.add_column('contacts', sa.Column('children', sa.String(50), nullable=True))
    op.add_column('contacts', sa.Column('gender', sa.String(20), nullable=True))
    op.add_column('contacts', sa.Column('homeowner', sa.Boolean(), nullable=True))
    op.add_column('contacts', sa.Column('married', sa.Boolean(), nullable=True))

    # Financial fields
    op.add_column('contacts', sa.Column('net_worth', sa.String(50), nullable=True))
    op.add_column('contacts', sa.Column('income_range', sa.String(50), nullable=True))

    # Contact fields
    op.add_column('contacts', sa.Column('direct_number', sa.String(20), nullable=True))
    op.add_column('contacts', sa.Column('direct_number_dnc', sa.Boolean(), nullable=True))
    op.add_column('contacts', sa.Column('mobile_phone', sa.String(20), nullable=True))
    op.add_column('contacts', sa.Column('mobile_phone_dnc', sa.Boolean(), nullable=True))
    op.add_column('contacts', sa.Column('personal_phone', sa.String(20), nullable=True))
    op.add_column('contacts', sa.Column('personal_phone_dnc', sa.Boolean(), nullable=True))
    op.add_column('contacts', sa.Column('business_email', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('personal_emails', sa.Text(), nullable=True))
    op.add_column('contacts', sa.Column('personal_verified_emails', sa.Text(), nullable=True))
    op.add_column('contacts', sa.Column('business_verified_emails', sa.Text(), nullable=True))
    op.add_column('contacts', sa.Column('sha256_personal_email', sa.String(64), nullable=True))
    op.add_column('contacts', sa.Column('sha256_business_email', sa.String(64), nullable=True))
    op.add_column('contacts', sa.Column('valid_phones', sa.Text(), nullable=True))

    # Professional fields
    op.add_column('contacts', sa.Column('job_title', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('headline', sa.Text(), nullable=True))
    op.add_column('contacts', sa.Column('department', sa.String(100), nullable=True))
    op.add_column('contacts', sa.Column('seniority_level', sa.String(50), nullable=True))
    op.add_column('contacts', sa.Column('inferred_years_experience', sa.Integer(), nullable=True))
    op.add_column('contacts', sa.Column('company_name_history', sa.Text(), nullable=True))
    op.add_column('contacts', sa.Column('job_title_history', sa.Text(), nullable=True))
    op.add_column('contacts', sa.Column('education_history', sa.Text(), nullable=True))
    op.add_column('contacts', sa.Column('skills', sa.Text(), nullable=True))

    # Company fields
    op.add_column('contacts', sa.Column('company_address', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('company_description', sa.Text(), nullable=True))
    op.add_column('contacts', sa.Column('company_domain', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('company_employee_count', sa.Integer(), nullable=True))
    op.add_column('contacts', sa.Column('company_linkedin_url', sa.String(500), nullable=True))
    op.add_column('contacts', sa.Column('company_name', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('company_phone', sa.String(20), nullable=True))
    op.add_column('contacts', sa.Column('company_revenue', sa.String(50), nullable=True))
    op.add_column('contacts', sa.Column('company_sic', sa.String(10), nullable=True))
    op.add_column('contacts', sa.Column('company_naics', sa.String(10), nullable=True))
    op.add_column('contacts', sa.Column('company_city', sa.String(100), nullable=True))
    op.add_column('contacts', sa.Column('company_state', sa.String(2), nullable=True))
    op.add_column('contacts', sa.Column('company_zip', sa.String(10), nullable=True))
    op.add_column('contacts', sa.Column('company_industry', sa.String(100), nullable=True))

    # Social fields
    op.add_column('contacts', sa.Column('linkedin_url', sa.String(500), nullable=True))
    op.add_column('contacts', sa.Column('twitter_url', sa.String(500), nullable=True))
    op.add_column('contacts', sa.Column('facebook_url', sa.String(500), nullable=True))
    op.add_column('contacts', sa.Column('social_connections', sa.Integer(), nullable=True))

    # Behavioral fields
    op.add_column('contacts', sa.Column('interests', sa.Text(), nullable=True))

    # Skiptrace fields
    op.add_column('contacts', sa.Column('skiptrace_match_score', sa.Integer(), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_name', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_address', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_city', sa.String(100), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_state', sa.String(2), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_zip', sa.String(10), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_landline_numbers', sa.Text(), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_wireless_numbers', sa.Text(), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_credit_rating', sa.String(20), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_dnc', sa.Boolean(), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_exact_age', sa.Integer(), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_ethnic_code', sa.String(10), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_language_code', sa.String(10), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_ip', sa.String(45), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_b2b_address', sa.String(255), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_b2b_phone', sa.String(20), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_b2b_source', sa.String(100), nullable=True))
    op.add_column('contacts', sa.Column('skiptrace_b2b_website', sa.String(255), nullable=True))

    # Create indexes for commonly queried fields
    op.create_index('idx_contacts_provider_uuid', 'contacts', ['provider_uuid'])
    op.create_index('idx_contacts_company_name', 'contacts', ['company_name'])
    op.create_index('idx_contacts_job_title', 'contacts', ['job_title'])
    op.create_index('idx_contacts_personal_zip', 'contacts', ['personal_zip'])
    op.create_index('idx_contacts_company_industry', 'contacts', ['company_industry'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_contacts_company_industry', 'contacts')
    op.drop_index('idx_contacts_personal_zip', 'contacts')
    op.drop_index('idx_contacts_job_title', 'contacts')
    op.drop_index('idx_contacts_company_name', 'contacts')
    op.drop_index('idx_contacts_provider_uuid', 'contacts')

    # Drop all columns (in reverse order of addition)
    op.drop_column('contacts', 'skiptrace_b2b_website')
    op.drop_column('contacts', 'skiptrace_b2b_source')
    op.drop_column('contacts', 'skiptrace_b2b_phone')
    op.drop_column('contacts', 'skiptrace_b2b_address')
    op.drop_column('contacts', 'skiptrace_ip')
    op.drop_column('contacts', 'skiptrace_language_code')
    op.drop_column('contacts', 'skiptrace_ethnic_code')
    op.drop_column('contacts', 'skiptrace_exact_age')
    op.drop_column('contacts', 'skiptrace_dnc')
    op.drop_column('contacts', 'skiptrace_credit_rating')
    op.drop_column('contacts', 'skiptrace_wireless_numbers')
    op.drop_column('contacts', 'skiptrace_landline_numbers')
    op.drop_column('contacts', 'skiptrace_zip')
    op.drop_column('contacts', 'skiptrace_state')
    op.drop_column('contacts', 'skiptrace_city')
    op.drop_column('contacts', 'skiptrace_address')
    op.drop_column('contacts', 'skiptrace_name')
    op.drop_column('contacts', 'skiptrace_match_score')
    op.drop_column('contacts', 'interests')
    op.drop_column('contacts', 'social_connections')
    op.drop_column('contacts', 'facebook_url')
    op.drop_column('contacts', 'twitter_url')
    op.drop_column('contacts', 'linkedin_url')
    op.drop_column('contacts', 'company_industry')
    op.drop_column('contacts', 'company_zip')
    op.drop_column('contacts', 'company_state')
    op.drop_column('contacts', 'company_city')
    op.drop_column('contacts', 'company_naics')
    op.drop_column('contacts', 'company_sic')
    op.drop_column('contacts', 'company_revenue')
    op.drop_column('contacts', 'company_phone')
    op.drop_column('contacts', 'company_name')
    op.drop_column('contacts', 'company_linkedin_url')
    op.drop_column('contacts', 'company_employee_count')
    op.drop_column('contacts', 'company_domain')
    op.drop_column('contacts', 'company_description')
    op.drop_column('contacts', 'company_address')
    op.drop_column('contacts', 'skills')
    op.drop_column('contacts', 'education_history')
    op.drop_column('contacts', 'job_title_history')
    op.drop_column('contacts', 'company_name_history')
    op.drop_column('contacts', 'inferred_years_experience')
    op.drop_column('contacts', 'seniority_level')
    op.drop_column('contacts', 'department')
    op.drop_column('contacts', 'headline')
    op.drop_column('contacts', 'job_title')
    op.drop_column('contacts', 'valid_phones')
    op.drop_column('contacts', 'sha256_business_email')
    op.drop_column('contacts', 'sha256_personal_email')
    op.drop_column('contacts', 'business_verified_emails')
    op.drop_column('contacts', 'personal_verified_emails')
    op.drop_column('contacts', 'personal_emails')
    op.drop_column('contacts', 'business_email')
    op.drop_column('contacts', 'personal_phone_dnc')
    op.drop_column('contacts', 'personal_phone')
    op.drop_column('contacts', 'mobile_phone_dnc')
    op.drop_column('contacts', 'mobile_phone')
    op.drop_column('contacts', 'direct_number_dnc')
    op.drop_column('contacts', 'direct_number')
    op.drop_column('contacts', 'income_range')
    op.drop_column('contacts', 'net_worth')
    op.drop_column('contacts', 'married')
    op.drop_column('contacts', 'homeowner')
    op.drop_column('contacts', 'gender')
    op.drop_column('contacts', 'children')
    op.drop_column('contacts', 'age_range')
    op.drop_column('contacts', 'personal_zip4')
    op.drop_column('contacts', 'personal_zip')
    op.drop_column('contacts', 'personal_state')
    op.drop_column('contacts', 'personal_city')
    op.drop_column('contacts', 'personal_address')
    op.drop_column('contacts', 'provider_uuid')
