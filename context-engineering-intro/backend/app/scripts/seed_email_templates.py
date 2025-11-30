"""
Seed database with pre-built system email templates.

This script creates 10 professional email templates with variable support.
All templates are system templates (is_system=True, user_id=None).

Usage:
    # As standalone script
    python -m app.scripts.seed_email_templates

    # Or import and call
    from app.scripts.seed_email_templates import seed_email_templates
    await seed_email_templates()
"""

import sys
import os
import asyncio
import re
from typing import List

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import AsyncSessionLocal
from app.models.email_templates import EmailTemplate


def extract_variables(text: str) -> List[str]:
    """
    Extract variable placeholders from text.
    Finds all {{variable_name}} patterns and returns unique list.

    Args:
        text: String containing variable placeholders

    Returns:
        List of unique variable names (without braces)
    """
    pattern = r'\{\{(\w+)\}\}'
    matches = re.findall(pattern, text)
    return list(set(matches))  # Return unique variables


# Template definitions
SYSTEM_TEMPLATES = [
    {
        "name": "Welcome Email",
        "category": "Welcome",
        "subject": "Welcome to {{company_name}}, {{first_name}}!",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4A90E2; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .cta-button { background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{company_name}}!</h1>
        </div>
        <div class="content">
            <p>Hi {{first_name}},</p>

            <p>We're thrilled to have you join us! Thank you for choosing {{company_name}} as your trusted partner.</p>

            <p><strong>What's Next?</strong></p>
            <ul>
                <li>Explore our platform and features</li>
                <li>Set up your profile and preferences</li>
                <li>Reach out to our team if you need any assistance</li>
            </ul>

            <p>Our team is here to help you succeed. If you have any questions, don't hesitate to reach out.</p>

            <p>Best regards,<br>
            {{user_name}}<br>
            {{user_email}}</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{company_name}}. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a></p>
        </div>
    </div>
</body>
</html>
        """,
    },
    {
        "name": "Appointment Reminder",
        "category": "Appointment",
        "subject": "Reminder: Your appointment on {{appointment_date}}",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #34C759; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .appointment-details { background-color: white; border-left: 4px solid #34C759; padding: 15px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Appointment Reminder</h2>
        </div>
        <div class="content">
            <p>Hi {{first_name}},</p>

            <p>This is a friendly reminder about your upcoming appointment with {{company_name}}.</p>

            <div class="appointment-details">
                <h3>Appointment Details:</h3>
                <p><strong>Date:</strong> {{appointment_date}}<br>
                <strong>Time:</strong> {{appointment_time}}</p>
            </div>

            <p><strong>What to Bring:</strong></p>
            <ul>
                <li>Any relevant documents or information</li>
                <li>A list of questions you'd like to discuss</li>
                <li>Photo identification</li>
            </ul>

            <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>

            <p>We look forward to seeing you!</p>

            <p>Best regards,<br>
            {{user_name}}<br>
            {{company_name}}</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{company_name}}. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
        """,
    },
    {
        "name": "Follow-Up After Meeting",
        "category": "Follow-up",
        "subject": "Great meeting you, {{first_name}}!",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #5856D6; color: white; padding: 20px; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .next-steps { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Thank You for Meeting With Us</h2>
        </div>
        <div class="content">
            <p>Hi {{first_name}},</p>

            <p>It was great meeting with you! Thank you for taking the time to speak with us about how {{company_name}} can support your goals.</p>

            <div class="next-steps">
                <h3>Next Steps:</h3>
                <ul>
                    <li>Review the materials we discussed</li>
                    <li>Consider the solutions we proposed</li>
                    <li>Schedule a follow-up call if needed</li>
                </ul>
            </div>

            <p>If you have any questions or need additional information, please don't hesitate to reach out. I'm here to help!</p>

            <p>Looking forward to working together.</p>

            <p>Best regards,<br>
            {{user_name}}<br>
            {{user_email}}<br>
            {{company_name}}</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{company_name}}. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
        """,
    },
    {
        "name": "Promotional Offer",
        "category": "Promotion",
        "subject": "Exclusive offer for {{first_name}} - Limited time!",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF3B30; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .offer-box { background-color: #FFD60A; padding: 25px; text-align: center; margin: 20px 0; border-radius: 10px; }
        .cta-button { background-color: #FF3B30; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Special Offer Just for You!</h1>
        </div>
        <div class="content">
            <p>Hi {{first_name}},</p>

            <p>We have an exclusive offer that we think you'll love!</p>

            <div class="offer-box">
                <h2>LIMITED TIME OFFER</h2>
                <p style="font-size: 24px; margin: 15px 0;"><strong>Save 25% Today!</strong></p>
                <p>Use code: SPECIAL25</p>
            </div>

            <p>This exclusive offer is available for a limited time only. Don't miss out on this opportunity to experience the best of what {{company_name}} has to offer.</p>

            <p style="text-align: center;">
                <a href="#" class="cta-button">Claim Your Offer Now</a>
            </p>

            <p><strong>Offer expires soon!</strong> Act now to take advantage of this special promotion.</p>

            <p>Best regards,<br>
            The {{company_name}} Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{company_name}}. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">View in Browser</a></p>
        </div>
    </div>
</body>
</html>
        """,
    },
    {
        "name": "Monthly Newsletter",
        "category": "Newsletter",
        "subject": "{{company_name}} Newsletter - {{month}} Edition",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007AFF; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .section { background-color: white; padding: 20px; margin: 15px 0; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company_name}} Newsletter</h1>
            <p>Your monthly update</p>
        </div>
        <div class="content">
            <p>Hi {{first_name}},</p>

            <p>Welcome to this month's newsletter! Here's what's new at {{company_name}}:</p>

            <div class="section">
                <h3>Company Updates</h3>
                <p>We've been working hard to bring you new features and improvements. Check out what's new this month.</p>
            </div>

            <div class="section">
                <h3>Industry Insights</h3>
                <p>Stay ahead of the curve with our expert analysis and industry trends.</p>
            </div>

            <div class="section">
                <h3>Tips & Resources</h3>
                <ul>
                    <li>Best practice guide for maximizing your results</li>
                    <li>Video tutorials and how-to guides</li>
                    <li>Upcoming webinars and events</li>
                </ul>
            </div>

            <p>Thank you for being a valued member of our community!</p>

            <p>Best regards,<br>
            The {{company_name}} Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{company_name}}. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>
        """,
    },
    {
        "name": "Thank You Email",
        "category": "General",
        "subject": "Thank you, {{first_name}}!",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #32ADE6; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .highlight { background-color: #E8F5FD; padding: 20px; border-left: 4px solid #32ADE6; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You!</h1>
        </div>
        <div class="content">
            <p>Hi {{first_name}},</p>

            <p>We wanted to take a moment to express our sincere gratitude for your continued support and trust in {{company_name}}.</p>

            <div class="highlight">
                <p><strong>Your partnership means the world to us.</strong></p>
                <p>It's customers like you that inspire us to continually improve and provide the best service possible.</p>
            </div>

            <p>If there's anything we can do to enhance your experience or if you have any feedback to share, we'd love to hear from you.</p>

            <p>Thank you for being awesome!</p>

            <p>With appreciation,<br>
            {{user_name}}<br>
            {{company_name}}</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{company_name}}. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
        """,
    },
    {
        "name": "Birthday Wishes",
        "category": "General",
        "subject": "Happy Birthday, {{first_name}}!",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9500; color: white; padding: 40px; text-align: center; }
        .content { padding: 30px; background-color: #FFF5E6; }
        .gift-box { background-color: #FFE4B3; border: 2px dashed #FF9500; padding: 25px; text-align: center; margin: 20px 0; border-radius: 10px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="font-size: 36px;">Happy Birthday! 🎉</h1>
        </div>
        <div class="content">
            <p>Dear {{first_name}},</p>

            <p>The entire team at {{company_name}} wants to wish you a very happy birthday!</p>

            <div class="gift-box">
                <h2>Special Birthday Gift 🎁</h2>
                <p style="font-size: 20px; margin: 15px 0;"><strong>Enjoy 20% OFF</strong></p>
                <p>Your birthday gift from us! Use code: BIRTHDAY20</p>
                <p style="font-size: 12px; color: #666;">Valid for 30 days</p>
            </div>

            <p>We hope your special day is filled with joy, laughter, and wonderful memories. Thank you for being a valued part of our community!</p>

            <p>Warmest wishes,<br>
            Everyone at {{company_name}}</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{company_name}}. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
        """,
    },
    {
        "name": "Product/Service Introduction",
        "category": "Promotion",
        "subject": "Introducing our new service for {{first_name}}",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #5856D6; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .feature { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #5856D6; }
        .cta-button { background-color: #5856D6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Introducing Our Latest Innovation</h1>
        </div>
        <div class="content">
            <p>Hi {{first_name}},</p>

            <p>We're excited to introduce our newest service, designed specifically with customers like you in mind!</p>

            <h3>Key Benefits:</h3>

            <div class="feature">
                <h4>Enhanced Performance</h4>
                <p>Experience faster results and improved efficiency.</p>
            </div>

            <div class="feature">
                <h4>Easy Integration</h4>
                <p>Seamlessly integrates with your existing workflow.</p>
            </div>

            <div class="feature">
                <h4>Dedicated Support</h4>
                <p>Our team is here to help you every step of the way.</p>
            </div>

            <p style="text-align: center;">
                <a href="#" class="cta-button">Learn More</a>
            </p>

            <p>Want to see it in action? Schedule a personalized demo with our team.</p>

            <p>Best regards,<br>
            {{user_name}}<br>
            {{company_name}}</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{company_name}}. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
        """,
    },
    {
        "name": "Feedback Request",
        "category": "Follow-up",
        "subject": "We'd love your feedback, {{first_name}}",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #34C759; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .survey-box { background-color: white; padding: 25px; text-align: center; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .cta-button { background-color: #34C759; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Opinion Matters</h1>
        </div>
        <div class="content">
            <p>Hi {{first_name}},</p>

            <p>We're always looking for ways to improve and provide you with the best experience possible. Your feedback is invaluable to us!</p>

            <div class="survey-box">
                <h3>Quick Survey</h3>
                <p>Take 2 minutes to share your thoughts and help us serve you better.</p>
                <a href="#" class="cta-button">Start Survey</a>
            </div>

            <p><strong>What we'd love to know:</strong></p>
            <ul>
                <li>How satisfied are you with our service?</li>
                <li>What features do you use most?</li>
                <li>How can we improve your experience?</li>
            </ul>

            <p>Your responses are completely confidential and will help shape the future of {{company_name}}.</p>

            <p>Thank you for your time and continued support!</p>

            <p>Best regards,<br>
            The {{company_name}} Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{company_name}}. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
        """,
    },
    {
        "name": "Re-engagement Email",
        "category": "Follow-up",
        "subject": "We miss you, {{first_name}}!",
        "body_html": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF2D55; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .comeback-box { background-color: #FFE5EC; padding: 25px; text-align: center; margin: 20px 0; border-radius: 10px; }
        .cta-button { background-color: #FF2D55; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>We Miss You!</h1>
        </div>
        <div class="content">
            <p>Hi {{first_name}},</p>

            <p>We noticed it's been a while since we last connected, and we wanted to reach out!</p>

            <div class="comeback-box">
                <h2>Come Back & Save 30%</h2>
                <p style="font-size: 18px; margin: 15px 0;">We'd love to have you back!</p>
                <p>Use code: <strong>COMEBACK30</strong></p>
                <a href="#" class="cta-button">Redeem Your Offer</a>
            </div>

            <p><strong>What's new since you've been away:</strong></p>
            <ul>
                <li>New features and improvements</li>
                <li>Enhanced user experience</li>
                <li>Expanded support resources</li>
            </ul>

            <p>We're here if you need anything. Whether you have questions, feedback, or just want to reconnect, we'd love to hear from you.</p>

            <p>Hope to see you soon!</p>

            <p>Best regards,<br>
            The {{company_name}} Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 {{company_name}}. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>
        """,
    },
]


async def seed_email_templates(session: AsyncSession = None) -> dict:
    """
    Seed database with system email templates.

    Args:
        session: Optional existing database session. If not provided, creates new one.

    Returns:
        dict with 'created', 'skipped', and 'total' counts
    """
    # Use provided session or create new one
    should_close = False
    if session is None:
        session = AsyncSessionLocal()
        should_close = True

    try:
        created_count = 0
        skipped_count = 0

        for template_data in SYSTEM_TEMPLATES:
            # Extract variables from subject and body
            subject_vars = extract_variables(template_data['subject'])
            body_vars = extract_variables(template_data['body_html'])
            all_variables = list(set(subject_vars + body_vars))

            # Check if template already exists by name
            query = select(EmailTemplate).where(
                EmailTemplate.name == template_data['name'],
                EmailTemplate.is_system == True
            )
            result = await session.execute(query)
            existing_template = result.scalar_one_or_none()

            if existing_template:
                print(f"  - Skipped (exists): {template_data['name']}")
                skipped_count += 1
                continue

            # Create new system template
            template = EmailTemplate(
                name=template_data['name'],
                category=template_data['category'],
                subject=template_data['subject'],
                body_html=template_data['body_html'],
                is_system=True,
                is_active=True,
                user_id=None,  # System templates have no user
                variables=all_variables,
                usage_count=0,
            )

            session.add(template)
            print(f"  [OK] Created: {template_data['name']} ({len(all_variables)} variables)")
            created_count += 1

        # Commit all changes
        await session.commit()

        result = {
            'created': created_count,
            'skipped': skipped_count,
            'total': len(SYSTEM_TEMPLATES)
        }

        print(f"\n[SUCCESS] Email template seeding complete!")
        print(f"   Created: {created_count}")
        print(f"   Skipped: {skipped_count}")
        print(f"   Total templates: {len(SYSTEM_TEMPLATES)}")

        return result

    except Exception as e:
        await session.rollback()
        print(f"\n[ERROR] Error seeding email templates:")
        print(f"   {str(e)}")
        raise
    finally:
        if should_close:
            await session.close()


async def main():
    """Run seed script as standalone"""
    print("Starting email template seed script...")
    print(f"Seeding {len(SYSTEM_TEMPLATES)} system templates...\n")

    try:
        result = await seed_email_templates()
        return result
    except Exception as e:
        print(f"\nFailed to seed templates: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
