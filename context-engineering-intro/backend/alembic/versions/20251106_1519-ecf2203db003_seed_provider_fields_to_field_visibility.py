"""seed_provider_fields_to_field_visibility

Revision ID: ecf2203db003
Revises: 4f5a6b7c8d9e
Create Date: 2025-11-06 15:19:31.083269

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ecf2203db003'
down_revision = '4f5a6b7c8d9e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Insert 70 provider fields into field_visibility table
    # Categories: demographic, contact, financial, professional, company, social, behavioral, skiptrace

    fields_to_insert = [
        # Provider UUID (1 field)
        ('provider_uuid', 'Provider UUID', 'technical', False, False, False),

        # Personal/Demographic fields (10 fields)
        ('personal_address', 'Personal Address', 'demographic', True, False, True),
        ('personal_city', 'Personal City', 'demographic', True, False, True),
        ('personal_state', 'Personal State', 'demographic', True, False, True),
        ('personal_zip', 'Personal ZIP Code', 'demographic', True, False, False),
        ('personal_zip4', 'Personal ZIP+4', 'demographic', True, False, False),
        ('age_range', 'Age Range', 'demographic', True, False, True),
        ('children', 'Children', 'demographic', True, False, True),
        ('gender', 'Gender', 'demographic', True, False, True),
        ('homeowner', 'Homeowner', 'demographic', True, False, True),
        ('married', 'Married', 'demographic', True, False, True),

        # Financial fields (2 fields)
        ('net_worth', 'Net Worth', 'financial', True, False, True),
        ('income_range', 'Income Range', 'financial', True, False, True),

        # Contact fields (13 fields)
        ('direct_number', 'Direct Number', 'contact', True, False, True),
        ('direct_number_dnc', 'Direct Number DNC', 'contact', True, False, True),
        ('mobile_phone', 'Mobile Phone', 'contact', True, False, True),
        ('mobile_phone_dnc', 'Mobile Phone DNC', 'contact', True, False, True),
        ('personal_phone', 'Personal Phone', 'contact', True, False, True),
        ('personal_phone_dnc', 'Personal Phone DNC', 'contact', True, False, True),
        ('business_email', 'Business Email', 'contact', True, True, False),
        ('personal_emails', 'Personal Emails', 'contact', True, False, True),
        ('personal_verified_emails', 'Personal Verified Emails', 'contact', True, False, True),
        ('business_verified_emails', 'Business Verified Emails', 'contact', True, True, False),
        ('sha256_personal_email', 'SHA256 Personal Email', 'contact', False, False, True),
        ('sha256_business_email', 'SHA256 Business Email', 'contact', False, False, True),
        ('valid_phones', 'Valid Phones', 'contact', True, False, True),

        # Professional fields (9 fields)
        ('job_title', 'Job Title', 'professional', True, True, False),
        ('headline', 'Headline', 'professional', True, True, False),
        ('department', 'Department', 'professional', True, True, False),
        ('seniority_level', 'Seniority Level', 'professional', True, True, False),
        ('inferred_years_experience', 'Years of Experience', 'professional', True, True, False),
        ('company_name_history', 'Company History', 'professional', True, True, False),
        ('job_title_history', 'Job Title History', 'professional', True, True, False),
        ('education_history', 'Education History', 'professional', True, True, False),
        ('skills', 'Skills', 'professional', True, True, False),

        # Company fields (14 fields)
        ('company_address', 'Company Address', 'company', True, True, False),
        ('company_description', 'Company Description', 'company', True, True, False),
        ('company_domain', 'Company Domain', 'company', True, True, False),
        ('company_employee_count', 'Company Employee Count', 'company', True, True, False),
        ('company_linkedin_url', 'Company LinkedIn URL', 'company', True, True, False),
        ('company_name', 'Company Name', 'company', True, True, False),
        ('company_phone', 'Company Phone', 'company', True, True, False),
        ('company_revenue', 'Company Revenue', 'company', True, True, False),
        ('company_sic', 'Company SIC Code', 'company', True, True, False),
        ('company_naics', 'Company NAICS Code', 'company', True, True, False),
        ('company_city', 'Company City', 'company', True, True, False),
        ('company_state', 'Company State', 'company', True, True, False),
        ('company_zip', 'Company ZIP Code', 'company', True, True, False),
        ('company_industry', 'Company Industry', 'company', True, True, False),

        # Social fields (4 fields)
        ('linkedin_url', 'LinkedIn URL', 'social', True, True, False),
        ('twitter_url', 'Twitter URL', 'social', True, True, False),
        ('facebook_url', 'Facebook URL', 'social', True, True, False),
        ('social_connections', 'Social Connections', 'social', True, True, False),

        # Behavioral fields (1 field)
        ('interests', 'Interests', 'behavioral', True, True, False),

        # Skiptrace fields (16 fields)
        ('skiptrace_match_score', 'Skiptrace Match Score', 'skiptrace', True, False, False),
        ('skiptrace_name', 'Skiptrace Name', 'skiptrace', True, False, True),
        ('skiptrace_address', 'Skiptrace Address', 'skiptrace', True, False, True),
        ('skiptrace_city', 'Skiptrace City', 'skiptrace', True, False, True),
        ('skiptrace_state', 'Skiptrace State', 'skiptrace', True, False, True),
        ('skiptrace_zip', 'Skiptrace ZIP', 'skiptrace', True, False, False),
        ('skiptrace_landline_numbers', 'Skiptrace Landline Numbers', 'skiptrace', True, False, True),
        ('skiptrace_wireless_numbers', 'Skiptrace Wireless Numbers', 'skiptrace', True, False, True),
        ('skiptrace_credit_rating', 'Skiptrace Credit Rating', 'skiptrace', True, False, True),
        ('skiptrace_dnc', 'Skiptrace DNC', 'skiptrace', True, False, True),
        ('skiptrace_exact_age', 'Skiptrace Exact Age', 'skiptrace', True, False, True),
        ('skiptrace_ethnic_code', 'Skiptrace Ethnic Code', 'skiptrace', True, False, True),
        ('skiptrace_language_code', 'Skiptrace Language Code', 'skiptrace', True, False, False),
        ('skiptrace_ip', 'Skiptrace IP Address', 'skiptrace', True, False, True),
        ('skiptrace_b2b_address', 'Skiptrace B2B Address', 'skiptrace', True, False, False),
        ('skiptrace_b2b_phone', 'Skiptrace B2B Phone', 'skiptrace', True, False, False),
    ]

    # Build the INSERT statement
    op.execute("""
        INSERT INTO field_visibility (field_name, field_label, field_category, visible_to_admin, visible_to_user, is_sensitive)
        VALUES
        """ + ',\n        '.join([f"('{field[0]}', '{field[1]}', '{field[2]}', {field[3]}, {field[4]}, {field[5]})"
                                   for field in fields_to_insert]))


def downgrade() -> None:
    # Remove all provider fields from field_visibility
    provider_fields = [
        'provider_uuid',
        'personal_address', 'personal_city', 'personal_state', 'personal_zip', 'personal_zip4',
        'age_range', 'children', 'gender', 'homeowner', 'married',
        'net_worth', 'income_range',
        'direct_number', 'direct_number_dnc', 'mobile_phone', 'mobile_phone_dnc',
        'personal_phone', 'personal_phone_dnc', 'business_email', 'personal_emails',
        'personal_verified_emails', 'business_verified_emails', 'sha256_personal_email',
        'sha256_business_email', 'valid_phones',
        'job_title', 'headline', 'department', 'seniority_level', 'inferred_years_experience',
        'company_name_history', 'job_title_history', 'education_history', 'skills',
        'company_address', 'company_description', 'company_domain', 'company_employee_count',
        'company_linkedin_url', 'company_name', 'company_phone', 'company_revenue',
        'company_sic', 'company_naics', 'company_city', 'company_state', 'company_zip',
        'company_industry',
        'linkedin_url', 'twitter_url', 'facebook_url', 'social_connections',
        'interests',
        'skiptrace_match_score', 'skiptrace_name', 'skiptrace_address', 'skiptrace_city',
        'skiptrace_state', 'skiptrace_zip', 'skiptrace_landline_numbers',
        'skiptrace_wireless_numbers', 'skiptrace_credit_rating', 'skiptrace_dnc',
        'skiptrace_exact_age', 'skiptrace_ethnic_code', 'skiptrace_language_code',
        'skiptrace_ip', 'skiptrace_b2b_address', 'skiptrace_b2b_phone'
    ]

    op.execute(f"""
        DELETE FROM field_visibility
        WHERE field_name IN ({','.join([f"'{field}'" for field in provider_fields])})
    """)
