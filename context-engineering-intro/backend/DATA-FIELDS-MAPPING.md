# Data Provider Fields Mapping

**Source:** External Data Provider (AudienceLab or similar)
**Date:** 2025-11-06
**Total Fields:** 70+

## Field Mapping to Database

| Provider Field | Database Column | Data Type | Nullable | Category | Notes |
|----------------|-----------------|-----------|----------|----------|-------|
| UUID | provider_uuid | UUID | YES | system | External provider unique ID |
| FIRST_NAME | first_name | VARCHAR(100) | YES | demographic | Already exists in contacts table |
| LAST_NAME | last_name | VARCHAR(100) | YES | demographic | Already exists in contacts table |
| PERSONAL_ADDRESS | personal_address | VARCHAR(255) | YES | demographic | Home address line 1 |
| PERSONAL_CITY | personal_city | VARCHAR(100) | YES | demographic | Home city |
| PERSONAL_STATE | personal_state | VARCHAR(2) | YES | demographic | Home state code |
| PERSONAL_ZIP | personal_zip | VARCHAR(10) | YES | demographic | Home ZIP code |
| PERSONAL_ZIP4 | personal_zip4 | VARCHAR(4) | YES | demographic | ZIP+4 extension |
| AGE_RANGE | age_range | VARCHAR(20) | YES | demographic | Age bracket |
| CHILDREN | children | VARCHAR(50) | YES | demographic | Children status |
| GENDER | gender | VARCHAR(20) | YES | demographic | Gender |
| HOMEOWNER | homeowner | BOOLEAN | YES | demographic | Homeownership status |
| MARRIED | married | BOOLEAN | YES | demographic | Marital status |
| NET_WORTH | net_worth | VARCHAR(50) | YES | financial | Net worth range |
| INCOME_RANGE | income_range | VARCHAR(50) | YES | financial | Income bracket |
| DIRECT_NUMBER | direct_number | VARCHAR(20) | YES | contact | Direct phone number |
| DIRECT_NUMBER_DNC | direct_number_dnc | BOOLEAN | YES | contact | DNC flag for direct number |
| MOBILE_PHONE | mobile_phone | VARCHAR(20) | YES | contact | Mobile phone number |
| MOBILE_PHONE_DNC | mobile_phone_dnc | BOOLEAN | YES | contact | DNC flag for mobile |
| PERSONAL_PHONE | personal_phone | VARCHAR(20) | YES | contact | Personal phone number |
| PERSONAL_PHONE_DNC | personal_phone_dnc | BOOLEAN | YES | contact | DNC flag for personal phone |
| BUSINESS_EMAIL | business_email | VARCHAR(255) | YES | contact | Work email address |
| PERSONAL_EMAILS | personal_emails | TEXT | YES | contact | Array/list of personal emails |
| PERSONAL_VERIFIED_EMAILS | personal_verified_emails | TEXT | YES | contact | Verified personal emails |
| BUSINESS_VERIFIED_EMAILS | business_verified_emails | TEXT | YES | contact | Verified business emails |
| SHA256_PERSONAL_EMAIL | sha256_personal_email | VARCHAR(64) | YES | system | Hashed personal email |
| SHA256_BUSINESS_EMAIL | sha256_business_email | VARCHAR(64) | YES | system | Hashed business email |
| JOB_TITLE | job_title | VARCHAR(255) | YES | professional | Current job title |
| HEADLINE | headline | TEXT | YES | professional | Professional headline |
| DEPARTMENT | department | VARCHAR(100) | YES | professional | Department name |
| SENIORITY_LEVEL | seniority_level | VARCHAR(50) | YES | professional | Seniority level |
| INFERRED_YEARS_EXPERIENCE | inferred_years_experience | INTEGER | YES | professional | Years of experience |
| COMPANY_NAME_HISTORY | company_name_history | TEXT | YES | professional | Previous employers |
| JOB_TITLE_HISTORY | job_title_history | TEXT | YES | professional | Previous titles |
| EDUCATION_HISTORY | education_history | TEXT | YES | professional | Education background |
| COMPANY_ADDRESS | company_address | VARCHAR(255) | YES | company | Company street address |
| COMPANY_DESCRIPTION | company_description | TEXT | YES | company | Company description |
| COMPANY_DOMAIN | company_domain | VARCHAR(255) | YES | company | Company website domain |
| COMPANY_EMPLOYEE_COUNT | company_employee_count | INTEGER | YES | company | Number of employees |
| COMPANY_LINKEDIN_URL | company_linkedin_url | VARCHAR(500) | YES | company | Company LinkedIn |
| COMPANY_NAME | company_name | VARCHAR(255) | YES | company | Company name |
| COMPANY_PHONE | company_phone | VARCHAR(20) | YES | company | Company phone |
| COMPANY_REVENUE | company_revenue | VARCHAR(50) | YES | company | Revenue range |
| COMPANY_SIC | company_sic | VARCHAR(10) | YES | company | SIC code |
| COMPANY_NAICS | company_naics | VARCHAR(10) | YES | company | NAICS code |
| COMPANY_CITY | company_city | VARCHAR(100) | YES | company | Company city |
| COMPANY_STATE | company_state | VARCHAR(2) | YES | company | Company state |
| COMPANY_ZIP | company_zip | VARCHAR(10) | YES | company | Company ZIP |
| COMPANY_INDUSTRY | company_industry | VARCHAR(100) | YES | company | Industry name |
| LINKEDIN_URL | linkedin_url | VARCHAR(500) | YES | social | Personal LinkedIn |
| TWITTER_URL | twitter_url | VARCHAR(500) | YES | social | Twitter profile |
| FACEBOOK_URL | facebook_url | VARCHAR(500) | YES | social | Facebook profile |
| SOCIAL_CONNECTIONS | social_connections | INTEGER | YES | social | Social connection count |
| SKILLS | skills | TEXT | YES | professional | Skills list |
| INTERESTS | interests | TEXT | YES | behavioral | Interests list |
| SKIPTRACE_MATCH_SCORE | skiptrace_match_score | INTEGER | YES | skiptrace | Match confidence score |
| SKIPTRACE_NAME | skiptrace_name | VARCHAR(255) | YES | skiptrace | Skiptraced name |
| SKIPTRACE_ADDRESS | skiptrace_address | VARCHAR(255) | YES | skiptrace | Skiptraced address |
| SKIPTRACE_CITY | skiptrace_city | VARCHAR(100) | YES | skiptrace | Skiptraced city |
| SKIPTRACE_STATE | skiptrace_state | VARCHAR(2) | YES | skiptrace | Skiptraced state |
| SKIPTRACE_ZIP | skiptrace_zip | VARCHAR(10) | YES | skiptrace | Skiptraced ZIP |
| SKIPTRACE_LANDLINE_NUMBERS | skiptrace_landline_numbers | TEXT | YES | skiptrace | Landline numbers found |
| SKIPTRACE_WIRELESS_NUMBERS | skiptrace_wireless_numbers | TEXT | YES | skiptrace | Wireless numbers found |
| SKIPTRACE_CREDIT_RATING | skiptrace_credit_rating | VARCHAR(20) | YES | skiptrace | Credit rating |
| SKIPTRACE_DNC | skiptrace_dnc | BOOLEAN | YES | skiptrace | DNC status |
| SKIPTRACE_EXACT_AGE | skiptrace_exact_age | INTEGER | YES | skiptrace | Exact age |
| SKIPTRACE_ETHNIC_CODE | skiptrace_ethnic_code | VARCHAR(10) | YES | skiptrace | Ethnicity code |
| SKIPTRACE_LANGUAGE_CODE | skiptrace_language_code | VARCHAR(10) | YES | skiptrace | Language code |
| SKIPTRACE_IP | skiptrace_ip | VARCHAR(45) | YES | skiptrace | IP address |
| SKIPTRACE_B2B_ADDRESS | skiptrace_b2b_address | VARCHAR(255) | YES | skiptrace | B2B address |
| SKIPTRACE_B2B_PHONE | skiptrace_b2b_phone | VARCHAR(20) | YES | skiptrace | B2B phone |
| SKIPTRACE_B2B_SOURCE | skiptrace_b2b_source | VARCHAR(100) | YES | skiptrace | B2B source |
| SKIPTRACE_B2B_WEBSITE | skiptrace_b2b_website | VARCHAR(255) | YES | skiptrace | B2B website |
| VALID_PHONES | valid_phones | TEXT | YES | contact | Valid phone numbers array |

## Field Categories

- **demographic**: Personal demographic information
- **financial**: Financial indicators
- **contact**: Contact information (phone, email)
- **professional**: Job and career information
- **company**: Company/employer information
- **social**: Social media profiles
- **behavioral**: Interests and behaviors
- **skiptrace**: Skip trace data
- **system**: System/technical fields

## Sensitive Fields (Restrict to Owner/Admin Only)

All skiptrace fields, financial fields, and personally identifiable information:

- All `skiptrace_*` fields
- `net_worth`
- `income_range`
- `skiptrace_credit_rating`
- `sha256_personal_email`
- `sha256_business_email`
- All `*_dnc` flags
- `personal_address`
- `skiptrace_exact_age`

## Implementation Notes

1. All fields are nullable to support partial data from provider
2. Text fields used for arrays/lists (stored as JSON or comma-separated)
3. Boolean fields for yes/no indicators
4. UUID fields for external system references
5. Indexes created on frequently queried fields (company_name, job_title, etc.)
