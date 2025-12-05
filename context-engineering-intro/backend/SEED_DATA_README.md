# Senova CRM Seed Data

This document explains how to set up the initial seed data for Senova CRM, including the master owner profile and the Senova CRM object.

## Master Owner Profile

- **Email:** jwoodcapital@gmail.com
- **Password:** D3n1w3n1!
- **Role:** owner
- **Name:** System Owner
- **Status:** Active, Verified, Approved

## Senova CRM Object

- **Name:** Senova CRM
- **Type:** Company
- **Legal Name:** Senova
- **Parent Company:** Noveris Data, LLC
- **Address:** 8 The Green #21994, Dover, DE 19901
- **Email:** info@senovallc.com
- **Website:** senovallc.com
- **Industry:** Technology / SaaS
- **Description:** B2B SaaS CRM and audience intelligence platform for medical aesthetics

## How to Seed the Data

### Method 1: Using the Python Script (Recommended)

Run the seed script from the backend directory:

```bash
cd backend
python -m scripts.seed_senova_data
```

This script will:
- Create the master owner profile if it doesn't exist
- Create the Senova CRM object if it doesn't exist
- Set up the proper relationships and permissions
- Verify that everything was created correctly

### Method 2: Using Alembic Migration

Run the Alembic migration to seed the data:

```bash
cd backend
alembic upgrade head
```

The migration `20251127_1900_seed_senova_initial_data.py` will:
- Check for existing data to avoid duplicates
- Create the master owner and Senova object
- Set up all necessary relationships

### Method 3: Manual SQL (For Fresh Databases)

If setting up a completely new database, you can use the SQL in `init_with_seed.sql` after tables are created:

1. First run migrations to create tables:
   ```bash
   alembic upgrade head
   ```

2. Then run the seed SQL (uncomment the seed section in the file)
   ```bash
   psql -U senova_crm_user -d senova_crm -f init_with_seed.sql
   ```

## Verification

After seeding, you can verify the data:

### Using the Python Script

The seed script automatically verifies the data and will show:
- ✅ Confirmation that owner was created/exists
- ✅ Confirmation that Senova object was created/exists
- ✅ Confirmation of the relationship between them

### Manual Verification

Connect to the database and run:

```sql
-- Check owner exists
SELECT email, role, is_active, is_verified
FROM users
WHERE email = 'jwoodcapital@gmail.com';

-- Check Senova object exists
SELECT name, type, company_info->>'website' as website
FROM objects
WHERE name = 'Senova CRM';

-- Check relationship
SELECT u.email, o.name, ou.role_name, ou.permissions
FROM object_users ou
JOIN users u ON u.id = ou.user_id
JOIN objects o ON o.id = ou.object_id
WHERE u.email = 'jwoodcapital@gmail.com';
```

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

1. **Change the Password:** The default password should be changed immediately after first login
2. **Enable 2FA:** If two-factor authentication is available, enable it for the owner account
3. **Secure Storage:** Never commit actual passwords to version control
4. **Environment Variables:** Consider moving credentials to environment variables for production
5. **Access Logs:** Monitor login attempts for the owner account

## Troubleshooting

### Error: "Admin user already exists"
This is normal if the seed script has been run before. The script is idempotent and safe to run multiple times.

### Error: "Integrity constraint violation"
Check if there are duplicate emails or conflicting data. The script handles existing data gracefully.

### Error: "Cannot connect to database"
Ensure:
- PostgreSQL is running
- Database `senova_crm` exists
- `.env` file has correct database credentials
- You're running from the `backend` directory

## Dependencies

The seed script requires:
- Python 3.9+
- SQLAlchemy (async)
- pwdlib (for password hashing)
- PostgreSQL database
- All dependencies in `requirements.txt`

Install with:
```bash
pip install -r requirements.txt
```

## Development vs Production

For production environments:
1. Use strong, unique passwords
2. Store credentials in secure vault (e.g., AWS Secrets Manager)
3. Use environment variables instead of hardcoded values
4. Enable audit logging for owner actions
5. Consider using SSO/SAML for authentication