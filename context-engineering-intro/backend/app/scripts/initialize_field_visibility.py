"""
Initialize field visibility settings for all contact fields
This script populates the field_visibility table with default settings for RBAC
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from app.config.settings import settings

# Create database engine and session
engine = create_engine(str(settings.database_url).replace('+asyncpg', ''), echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Define all contact fields with visibility settings
fields = [
    # ============ BASIC FIELDS (visible to all) ============
    {'field_name': 'first_name', 'field_label': 'First Name', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'last_name', 'field_label': 'Last Name', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'email', 'field_label': 'Email', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'phone', 'field_label': 'Phone', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'company', 'field_label': 'Company (Legacy)', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},

    # ============ PERSONAL/DEMOGRAPHIC (admin visible by default) ============
    {'field_name': 'personal_address', 'field_label': 'Home Address', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'personal_city', 'field_label': 'City', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'personal_state', 'field_label': 'State', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'personal_zip', 'field_label': 'ZIP Code', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'personal_zip4', 'field_label': 'ZIP+4', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'age_range', 'field_label': 'Age Range', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'gender', 'field_label': 'Gender', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'children', 'field_label': 'Children Status', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'homeowner', 'field_label': 'Homeowner', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'married', 'field_label': 'Married', 'field_category': 'demographic', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},

    # ============ FINANCIAL (sensitive - owner/admin only) ============
    {'field_name': 'net_worth', 'field_label': 'Net Worth', 'field_category': 'financial', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'income_range', 'field_label': 'Income Range', 'field_category': 'financial', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},

    # ============ CONTACT FIELDS (admin/user visible for non-DNC) ============
    {'field_name': 'direct_number', 'field_label': 'Direct Number', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'mobile_phone', 'field_label': 'Mobile Phone', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'personal_phone', 'field_label': 'Personal Phone', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'business_email', 'field_label': 'Business Email', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'personal_emails', 'field_label': 'Personal Emails', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'personal_verified_emails', 'field_label': 'Verified Personal Emails', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'business_verified_emails', 'field_label': 'Verified Business Emails', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'valid_phones', 'field_label': 'Valid Phones', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},

    # ============ DNC FLAGS (admin only) ============
    {'field_name': 'direct_number_dnc', 'field_label': 'Direct DNC Flag', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'mobile_phone_dnc', 'field_label': 'Mobile DNC Flag', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'personal_phone_dnc', 'field_label': 'Personal Phone DNC Flag', 'field_category': 'contact', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': True},

    # ============ PROFESSIONAL FIELDS (visible to all) ============
    {'field_name': 'job_title', 'field_label': 'Job Title', 'field_category': 'professional', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'headline', 'field_label': 'Professional Headline', 'field_category': 'professional', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'department', 'field_label': 'Department', 'field_category': 'professional', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'seniority_level', 'field_label': 'Seniority Level', 'field_category': 'professional', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'inferred_years_experience', 'field_label': 'Years Experience', 'field_category': 'professional', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'skills', 'field_label': 'Skills', 'field_category': 'professional', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'company_name_history', 'field_label': 'Company History', 'field_category': 'professional', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'job_title_history', 'field_label': 'Job Title History', 'field_category': 'professional', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'education_history', 'field_label': 'Education History', 'field_category': 'professional', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},

    # ============ COMPANY FIELDS (visible to all) ============
    {'field_name': 'company_name', 'field_label': 'Company Name', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'company_domain', 'field_label': 'Company Website', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'company_description', 'field_label': 'Company Description', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'company_address', 'field_label': 'Company Address', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'company_city', 'field_label': 'Company City', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'company_state', 'field_label': 'Company State', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'company_zip', 'field_label': 'Company ZIP', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'company_phone', 'field_label': 'Company Phone', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'company_industry', 'field_label': 'Company Industry', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'company_employee_count', 'field_label': 'Company Size', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'company_revenue', 'field_label': 'Company Revenue', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'company_sic', 'field_label': 'SIC Code', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'company_naics', 'field_label': 'NAICS Code', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'company_linkedin_url', 'field_label': 'Company LinkedIn', 'field_category': 'company', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},

    # ============ SOCIAL (admin/user visible) ============
    {'field_name': 'linkedin_url', 'field_label': 'LinkedIn Profile', 'field_category': 'social', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'twitter_url', 'field_label': 'Twitter Profile', 'field_category': 'social', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'facebook_url', 'field_label': 'Facebook Profile', 'field_category': 'social', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},
    {'field_name': 'social_connections', 'field_label': 'Social Connections Count', 'field_category': 'social', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},

    # ============ BEHAVIORAL (admin/user visible) ============
    {'field_name': 'interests', 'field_label': 'Interests', 'field_category': 'behavioral', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},

    # ============ SKIPTRACE FIELDS (owner only by default) ============
    {'field_name': 'skiptrace_match_score', 'field_label': 'Match Score', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_name', 'field_label': 'Skiptraced Name', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_address', 'field_label': 'Skiptraced Address', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_city', 'field_label': 'Skiptraced City', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_state', 'field_label': 'Skiptraced State', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_zip', 'field_label': 'Skiptraced ZIP', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_landline_numbers', 'field_label': 'Landline Numbers Found', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_wireless_numbers', 'field_label': 'Wireless Numbers Found', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_credit_rating', 'field_label': 'Credit Rating', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_dnc', 'field_label': 'Skiptrace DNC Status', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_exact_age', 'field_label': 'Exact Age', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_ethnic_code', 'field_label': 'Ethnicity Code', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_language_code', 'field_label': 'Language Code', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_ip', 'field_label': 'IP Address', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_b2b_address', 'field_label': 'B2B Address', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_b2b_phone', 'field_label': 'B2B Phone', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_b2b_source', 'field_label': 'B2B Source', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'skiptrace_b2b_website', 'field_label': 'B2B Website', 'field_category': 'skiptrace', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},

    # ============ TRACKING FIELDS (admin visible) ============
    {'field_name': 'creation_source', 'field_label': 'Creation Source', 'field_category': 'tracking', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'source_form_id', 'field_label': 'Source Form ID', 'field_category': 'tracking', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'source_form_name', 'field_label': 'Source Form Name', 'field_category': 'tracking', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'utm_source', 'field_label': 'UTM Source', 'field_category': 'marketing', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'utm_medium', 'field_label': 'UTM Medium', 'field_category': 'marketing', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'utm_campaign', 'field_label': 'UTM Campaign', 'field_category': 'marketing', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'utm_term', 'field_label': 'UTM Term', 'field_category': 'marketing', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'utm_content', 'field_label': 'UTM Content', 'field_category': 'marketing', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'referral_source', 'field_label': 'Referral Source', 'field_category': 'marketing', 'visible_to_admin': True, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'lead_score', 'field_label': 'Lead Score', 'field_category': 'marketing', 'visible_to_admin': True, 'visible_to_user': True, 'is_sensitive': False},

    # ============ SYSTEM FIELDS (owner only) ============
    {'field_name': 'provider_uuid', 'field_label': 'Provider UUID', 'field_category': 'system', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': False},
    {'field_name': 'sha256_personal_email', 'field_label': 'SHA256 Personal Email', 'field_category': 'system', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
    {'field_name': 'sha256_business_email', 'field_label': 'SHA256 Business Email', 'field_category': 'system', 'visible_to_admin': False, 'visible_to_user': False, 'is_sensitive': True},
]

print(f"Initializing {len(fields)} field visibility settings...")

try:
    for field_data in fields:
        # Check if field already exists
        result = db.execute(
            text("SELECT id FROM field_visibility WHERE field_name = :field_name"),
            {"field_name": field_data['field_name']}
        ).fetchone()

        if not result:
            # Insert new field
            db.execute(
                text("""
                    INSERT INTO field_visibility
                    (field_name, field_label, field_category, visible_to_admin, visible_to_user, is_sensitive, created_at, updated_at)
                    VALUES (:field_name, :field_label, :field_category, :visible_to_admin, :visible_to_user, :is_sensitive, :created_at, :updated_at)
                """),
                {
                    "field_name": field_data['field_name'],
                    "field_label": field_data['field_label'],
                    "field_category": field_data['field_category'],
                    "visible_to_admin": field_data['visible_to_admin'],
                    "visible_to_user": field_data['visible_to_user'],
                    "is_sensitive": field_data['is_sensitive'],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            )
            print(f"  ✓ Added: {field_data['field_name']}")
        else:
            print(f"  - Skipped (exists): {field_data['field_name']}")

    db.commit()
    print(f"\n✅ Field visibility settings initialized successfully!")
    print(f"   Total fields configured: {len(fields)}")
    print(f"   Sensitive fields: {sum(1 for f in fields if f['is_sensitive'])}")
    print(f"   Admin-visible fields: {sum(1 for f in fields if f['visible_to_admin'])}")
    print(f"   User-visible fields: {sum(1 for f in fields if f['visible_to_user'])}")

except Exception as e:
    db.rollback()
    print(f"\n❌ Error initializing field visibility settings:")
    print(f"   {str(e)}")
    sys.exit(1)
finally:
    db.close()
