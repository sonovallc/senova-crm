# Email Templates Seeding Guide

## Overview

This document describes the 10 pre-built system email templates that can be seeded into the database.

## Running the Seed Script

### Method 1: Direct Python Module
```bash
cd backend
python -m app.scripts.seed_email_templates
```

### Method 2: Helper Script
```bash
cd backend
python seed_templates.py
```

### Method 3: Import in Code
```python
from app.scripts.seed_email_templates import seed_email_templates
import asyncio

# Run the seeder
result = await seed_email_templates()
print(f"Created: {result['created']}, Skipped: {result['skipped']}")
```

## Template Catalog

### 1. Welcome Email
- **Category**: Welcome
- **Subject**: "Welcome to {{company_name}}, {{first_name}}!"
- **Variables**: company_name, first_name, user_email, user_name
- **Use Case**: New customer onboarding, account activation
- **Features**:
  - Professional header with company branding
  - Welcome message with next steps
  - Call-to-action for getting started

### 2. Appointment Reminder
- **Category**: Appointment
- **Subject**: "Reminder: Your appointment on {{appointment_date}}"
- **Variables**: appointment_date, appointment_time, company_name, first_name, user_name
- **Use Case**: Appointment confirmations, calendar reminders
- **Features**:
  - Highlighted appointment details box
  - Preparation checklist
  - Professional appointment card design

### 3. Follow-Up After Meeting
- **Category**: Follow-up
- **Subject**: "Great meeting you, {{first_name}}!"
- **Variables**: company_name, first_name, user_email, user_name
- **Use Case**: Post-meeting follow-ups, relationship building
- **Features**:
  - Thank you message
  - Meeting recap section
  - Clear next steps

### 4. Promotional Offer
- **Category**: Promotion
- **Subject**: "Exclusive offer for {{first_name}} - Limited time!"
- **Variables**: company_name, first_name
- **Use Case**: Sales promotions, special offers, limited-time deals
- **Features**:
  - Eye-catching offer box with discount code
  - Strong call-to-action button
  - Urgency messaging

### 5. Monthly Newsletter
- **Category**: Newsletter
- **Subject**: "{{company_name}} Newsletter - {{month}} Edition"
- **Variables**: company_name, first_name, month
- **Use Case**: Regular updates, company news, content marketing
- **Features**:
  - Multiple content sections
  - Clean, organized layout
  - Easy to update structure

### 6. Thank You Email
- **Category**: General
- **Subject**: "Thank you, {{first_name}}!"
- **Variables**: company_name, first_name, user_name
- **Use Case**: Customer appreciation, post-purchase thanks
- **Features**:
  - Gratitude-focused messaging
  - Highlighted appreciation quote
  - Personal touch from sender

### 7. Birthday Wishes
- **Category**: General
- **Subject**: "Happy Birthday, {{first_name}}!"
- **Variables**: company_name, first_name
- **Use Case**: Customer birthdays, special occasions
- **Features**:
  - Celebratory design
  - Birthday gift/discount code
  - Warm, personal tone

### 8. Product/Service Introduction
- **Category**: Promotion
- **Subject**: "Introducing our new service for {{first_name}}"
- **Variables**: company_name, first_name, user_name
- **Use Case**: Product launches, new service announcements
- **Features**:
  - Feature highlight sections
  - Benefit-focused messaging
  - Demo request call-to-action

### 9. Feedback Request
- **Category**: Follow-up
- **Subject**: "We'd love your feedback, {{first_name}}"
- **Variables**: company_name, first_name
- **Use Case**: Customer surveys, feedback collection, reviews
- **Features**:
  - Survey invitation box
  - Question preview
  - Easy-to-click survey button

### 10. Re-engagement Email
- **Category**: Follow-up
- **Subject**: "We miss you, {{first_name}}!"
- **Variables**: company_name, first_name
- **Use Case**: Win-back campaigns, inactive customer re-engagement
- **Features**:
  - "Come back" special offer
  - What's new highlights
  - Special discount incentive

## Template Variables

All templates support the following standard variable placeholders:

### Contact Variables
- `{{first_name}}` - Contact's first name
- `{{last_name}}` - Contact's last name
- `{{email}}` - Contact's email address
- `{{phone}}` - Contact's phone number
- `{{company_name}}` - Contact's company name

### Appointment Variables
- `{{appointment_date}}` - Appointment date
- `{{appointment_time}}` - Appointment time

### User Variables
- `{{user_name}}` - Current user's full name
- `{{user_email}}` - Current user's email address

### Special Variables
- `{{month}}` - Month name (for newsletters)

## Template Features

### Email-Safe Design
- Inline CSS for compatibility
- Mobile-responsive layouts
- Simple HTML structure
- Email client tested

### Professional Elements
- Company branding placeholders
- Unsubscribe links
- Footer with legal/privacy links
- Consistent typography

### Automatic Variable Extraction
The seed script automatically:
- Parses subject and body for `{{variable}}` patterns
- Extracts unique variable names
- Stores them in the `variables` JSONB field
- Enables template validation and substitution

## Database Schema

Templates are stored with these properties:
```python
{
    "id": UUID,
    "name": str,                    # Template display name
    "category": str,                # Category for filtering
    "subject": str,                 # Email subject with variables
    "body_html": str,               # HTML email body with variables
    "is_system": True,              # System template flag
    "is_active": True,              # Active status
    "user_id": None,                # Null for system templates
    "variables": List[str],         # Auto-extracted variable names
    "usage_count": 0,               # Tracks template usage
    "created_at": DateTime,
    "updated_at": DateTime
}
```

## Categories

Templates are organized into these categories:
- **Welcome** - Onboarding and welcome messages
- **Appointment** - Appointment reminders and confirmations
- **Follow-up** - Post-interaction follow-ups
- **Promotion** - Sales and promotional offers
- **Newsletter** - Regular updates and newsletters
- **General** - Thank you messages, birthdays, general communication

## Using Templates in Your Application

### Listing Templates
```python
from sqlalchemy import select, or_
from app.models.email_templates import EmailTemplate

# Get all system templates
query = select(EmailTemplate).where(
    EmailTemplate.is_system == True,
    EmailTemplate.is_active == True
)
templates = await db.execute(query)

# Get templates by category
query = query.where(EmailTemplate.category == "Welcome")
```

### Variable Substitution
```python
import re

def replace_variables(template_text: str, variables: dict) -> str:
    """Replace {{variable}} placeholders with actual values"""
    for key, value in variables.items():
        pattern = f"{{{{{key}}}}}"
        template_text = template_text.replace(pattern, str(value))
    return template_text

# Usage
subject = replace_variables(
    template.subject,
    {
        "first_name": "John",
        "company_name": "Acme Corp"
    }
)
```

## Maintenance

### Re-running the Seed Script
The script is idempotent - it checks for existing templates by name before creating them.
Re-running the script will skip existing templates and only create missing ones.

### Updating System Templates
System templates (is_system=True) should be updated through migrations or manual SQL,
not through the API, to maintain consistency across all users.

### Custom Templates
Users can create their own templates through the API. User templates will have:
- `is_system = False`
- `user_id = <their user UUID>`
- Only visible to the creating user

## Troubleshooting

### Database Connection Errors
Ensure PostgreSQL is running and DATABASE_URL is correctly set in .env

### Template Already Exists
This is normal behavior - the script skips existing templates to prevent duplicates

### Variable Not Replacing
Ensure variable names match exactly (case-sensitive) between template and substitution dict

## Future Enhancements

Potential additions:
- Template preview generation
- A/B testing support
- Analytics tracking
- Template versioning
- Multi-language support
- Rich text editor integration
