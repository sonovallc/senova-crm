# Secrets Management Guide - Senova CRM

**Version:** 1.0
**Last Updated:** 2025-12-12
**Status:** Production Guide

---

## Overview

This guide documents all secrets, credentials, and sensitive configuration required for Senova CRM across development, staging, and production environments.

---

## Required Secrets

### Critical (Must Have)

| Secret | Purpose | Format | Required In |
|--------|---------|--------|-------------|
| `SECRET_KEY` | JWT token signing | 64-char hex string | All environments |
| `ENCRYPTION_KEY` | Fernet encryption for API keys | 44-char Fernet key | All environments |
| `DATABASE_URL` | PostgreSQL connection | Connection string | All environments |
| `MASTER_OWNER_PASSWORD` | Initial admin account | 24+ char password | First deployment only |
| `MAILGUN_API_KEY` | Email sending | Mailgun API key | Production/Staging |
| `MAILGUN_WEBHOOK_SIGNING_KEY` | Webhook verification | Mailgun signing key | Production/Staging |

### Important (Recommended)

| Secret | Purpose | Format | Required In |
|--------|---------|--------|-------------|
| `REDIS_URL` | Celery broker | Redis connection string | Production |
| `STRIPE_API_KEY` | Payment processing | Stripe secret key | Production (if using payments) |
| `STRIPE_WEBHOOK_SECRET` | Payment webhooks | Stripe webhook secret | Production (if using payments) |
| `SENTRY_DSN` | Error monitoring | Sentry DSN URL | Production/Staging |
| `CLOUDFLARE_API_TOKEN` | DNS/CDN management | Cloudflare token | Production (optional) |

### Optional (Feature-Specific)

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `BANDWIDTH_USER_ID` | SMS/Voice via Bandwidth | Voice/SMS features |
| `BANDWIDTH_APPLICATION_ID` | Bandwidth app config | Voice/SMS features |
| `BANDWIDTH_API_TOKEN` | Bandwidth authentication | Voice/SMS features |
| `BANDWIDTH_API_SECRET` | Bandwidth signing | Voice/SMS features |
| `TWILIO_ACCOUNT_SID` | SMS/Voice via Twilio | Alternative SMS provider |
| `TWILIO_AUTH_TOKEN` | Twilio authentication | Alternative SMS provider |
| `CLOUDINARY_CLOUD_NAME` | File storage | File upload features |
| `CLOUDINARY_API_KEY` | Cloudinary auth | File upload features |
| `CLOUDINARY_API_SECRET` | Cloudinary signing | File upload features |

---

## Secret Generation Commands

### SECRET_KEY (64-char hex)
```bash
openssl rand -hex 32
```
**Example output:** `f3a8b2c1d4e5f6789012345678901234567890abcdef1234567890abcdef1234`

### ENCRYPTION_KEY (Fernet key)
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
**Example output:** `k7X9mQpT8vR2nL5wF6bA4cD1eG3hJ0iK8lM9oP2qS4u=`

### Strong Password (24+ characters)
```bash
openssl rand -base64 24
```
**Example output:** `aB3dE7fG9hJ2kL5mN8pQ1rS4tV6wX9y=`

### Database Password (32+ characters)
```bash
openssl rand -base64 32
```
**Example output:** `aB3dE7fG9hJ2kL5mN8pQ1rS4tV6wX9yZ1aB3cD5eF7gH9iJ=`

---

## Environment-Specific Configuration

### Development Environment

**Location:** `backend/.env` (gitignored)

**Security Requirements:**
- Use weak secrets for local development (easy to remember)
- Use localhost URLs
- DEBUG=true is acceptable
- No real payment credentials
- Use Mailgun sandbox domain

**Example:**
```bash
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=dev-secret-key-not-for-production
DATABASE_URL=postgresql+asyncpg://senova_crm_user:dev_password@localhost:5432/senova_crm
MAILGUN_API_KEY=your-sandbox-key
```

### Staging Environment

**Location:** Server environment variables or `.env` file (not in Git)

**Security Requirements:**
- Use production-strength secrets
- Use staging domain URLs
- DEBUG=false
- Separate database from production
- Use Mailgun sandbox or test keys
- Enable Sentry for error tracking

**Example:**
```bash
ENVIRONMENT=staging
DEBUG=false
LOG_LEVEL=INFO
SECRET_KEY=<strong-64-char-hex>
DATABASE_URL=postgresql+asyncpg://user:<strong-password>@staging-db:5432/senova_staging
MAILGUN_API_KEY=<sandbox-or-test-key>
SENTRY_DSN=<staging-sentry-dsn>
```

### Production Environment

**Location:** Server environment variables (Hetzner: 178.156.181.73)

**Security Requirements:**
- Use cryptographically strong secrets (generated with commands above)
- Use production domains (crm.senovallc.com)
- DEBUG=false
- LOG_LEVEL=WARNING or ERROR
- Real API keys (Mailgun, Stripe, etc.)
- Enable Sentry for production monitoring
- Rotate secrets quarterly

**Template:** See `backend/.env.production.template`

**Critical Settings:**
```bash
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
SECRET_KEY=<64-char-hex-from-openssl>
ENCRYPTION_KEY=<fernet-key-from-python>
DATABASE_URL=postgresql+asyncpg://user:<32-char-password>@postgres:5432/senova_crm
ALLOWED_ORIGINS=https://crm.senovallc.com,https://senovallc.com
MAILGUN_API_KEY=<production-api-key>
MAILGUN_WEBHOOK_SIGNING_KEY=<webhook-signing-key>
REDIS_URL=redis://redis:6379/0
SENTRY_DSN=<production-sentry-dsn>
```

---

## Secret Storage Best Practices

### DO ✅

1. **Use Environment Variables**
   - Store all secrets as environment variables
   - Never hardcode secrets in source code
   - Use `.env` files locally (gitignored)

2. **Generate Strong Secrets**
   - Use cryptographically secure random generation
   - Minimum 32 characters for passwords
   - Use the commands provided in this document

3. **Separate Environments**
   - Development secrets ≠ Production secrets
   - Use different databases for dev/staging/prod
   - Use different API keys for each environment

4. **Rotate Regularly**
   - API keys: Every 90 days
   - Passwords: Every 90 days
   - JWT secrets: Annually (with migration strategy)
   - Encryption keys: Annually (with data re-encryption)

5. **Use Secret Managers (Production)**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Docker Secrets
   - Environment variables on server

6. **Document Changes**
   - Log when secrets are rotated
   - Maintain audit trail
   - Update this documentation

### DON'T ❌

1. **Never Commit Secrets to Git**
   - No `.env` files in version control
   - No hardcoded passwords
   - No API keys in code
   - No certificates in repository

2. **Never Share Secrets Insecurely**
   - Don't send via email
   - Don't paste in Slack/Discord
   - Don't store in Google Docs
   - Use secure password managers (1Password, LastPass, etc.)

3. **Never Reuse Secrets**
   - Don't use the same password for multiple services
   - Don't use development secrets in production
   - Don't reuse rotated secrets

4. **Never Use Weak Secrets**
   - No default passwords ("admin123", "password")
   - No simple patterns ("12345678")
   - No dictionary words
   - No personal information

---

## Secret Rotation Procedures

### Rotating SECRET_KEY (JWT Secret)

**Impact:** Invalidates all existing user sessions

**Procedure:**
1. Generate new secret: `openssl rand -hex 32`
2. Update `SECRET_KEY` in `.env.production`
3. Restart backend: `docker compose -f docker-compose.prod.yml restart backend`
4. All users will need to log in again
5. Update documentation with rotation date

**Frequency:** Annually or after suspected compromise

### Rotating ENCRYPTION_KEY

**Impact:** Cannot decrypt existing encrypted data

**Procedure:**
1. **CRITICAL:** Must re-encrypt all encrypted data first
2. Export encrypted credentials from database
3. Decrypt using old key
4. Generate new key: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
5. Re-encrypt data with new key
6. Update `ENCRYPTION_KEY` in `.env.production`
7. Restart backend
8. Verify all encrypted data accessible

**Frequency:** Annually (complex procedure - plan carefully)

### Rotating Database Password

**Impact:** Database becomes inaccessible during rotation

**Procedure:**
1. Connect to PostgreSQL: `docker exec -it postgres psql -U senova_crm_user -d senova_crm`
2. Change password: `ALTER USER senova_crm_user WITH PASSWORD 'new-strong-password';`
3. Update `DATABASE_URL` in `.env.production`
4. Restart all services: `docker compose -f docker-compose.prod.yml restart`
5. Verify health endpoint: `curl https://crm.senovallc.com/health`

**Frequency:** Quarterly

### Rotating API Keys (Mailgun, Stripe, etc.)

**Impact:** API calls fail until new keys configured

**Procedure:**
1. Generate new key in provider dashboard (Mailgun, Stripe, etc.)
2. Update `.env.production` with new key
3. Restart backend: `docker compose -f docker-compose.prod.yml restart backend`
4. Verify integration works (send test email, process test payment)
5. Delete old key from provider dashboard
6. Update documentation

**Frequency:** Every 90 days (quarterly)

---

## Security Incident Response

### If Secrets Are Compromised

1. **Immediate Actions** (within 1 hour)
   - Rotate all compromised secrets immediately
   - Review access logs for unauthorized access
   - Disable compromised API keys in provider dashboards
   - Force logout all users (rotate SECRET_KEY)

2. **Investigation** (within 24 hours)
   - Determine scope of compromise
   - Identify how secrets were exposed
   - Check database for unauthorized changes
   - Review Git history for committed secrets

3. **Remediation** (within 1 week)
   - Fix vulnerability that led to exposure
   - Update security procedures
   - Document incident and lessons learned
   - Train team on security best practices

4. **Follow-Up** (within 1 month)
   - Conduct security audit
   - Implement additional security measures
   - Update this documentation
   - Review and improve secret management practices

### If Secrets Found in Git History

1. **DO NOT** attempt to delete Git history (it's distributed)
2. **DO** treat all secrets as compromised
3. **DO** rotate all secrets immediately
4. **DO** use tools like `git-secrets` or `trufflehog` to scan history
5. **CONSIDER** migrating to a new repository with clean history

---

## Compliance & Audit Trail

### Secret Access Logging

**What to Log:**
- When secrets are accessed
- Who accessed secrets (user/service)
- Which secret was accessed
- Success or failure of access

**Where to Log:**
- Application logs (Sentry)
- Audit database table (recommended)
- Server access logs (nginx)

### Regular Audits

**Monthly:**
- Review who has access to production secrets
- Check for unused API keys
- Verify environment variable configurations

**Quarterly:**
- Rotate all API keys
- Rotate database passwords
- Review and update access permissions
- Test secret rotation procedures

**Annually:**
- Full security audit
- Rotate JWT secrets and encryption keys
- Review and update this documentation
- Test incident response procedures

---

## Tools & Resources

### Recommended Tools

1. **Password Managers**
   - 1Password (Team plan recommended)
   - LastPass
   - Bitwarden

2. **Secret Scanning**
   - `git-secrets` - Prevent committing secrets
   - `trufflehog` - Scan Git history for secrets
   - GitHub Secret Scanning (if using GitHub)

3. **Secret Management (Production)**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Docker Secrets
   - Kubernetes Secrets

4. **Environment Management**
   - `python-dotenv` (already included)
   - `direnv` - Auto-load environment variables
   - `envchain` - Secure credential storage

### Installation Commands

**git-secrets:**
```bash
# macOS
brew install git-secrets

# Windows (via Git Bash)
git clone https://github.com/awslabs/git-secrets
cd git-secrets && make install
```

**trufflehog:**
```bash
# macOS/Linux
pip install trufflehog

# Scan repository
trufflehog filesystem /path/to/repo
```

---

## Quick Reference Card

### Emergency Contacts
- **Security Issues:** Technical Lead
- **API Key Issues:** DevOps Team
- **Database Issues:** Database Administrator

### Common Commands
```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate ENCRYPTION_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Generate password
openssl rand -base64 24

# Check environment variables (production server)
ssh -i "C:\Users\jwood\.ssh\id_ed25519_sonovallc" deploy@178.156.181.73
cd ~/senova-crm/context-engineering-intro
grep -v '^#' backend/.env.production | grep -v '^$'

# Restart services after secret rotation
docker compose -f docker-compose.prod.yml restart backend
```

### Secret Locations
- **Development:** `backend/.env` (gitignored)
- **Production Template:** `backend/.env.production.template` (in Git)
- **Production Actual:** Server env vars (not in Git)
- **Documentation:** This file

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-12 | Initial security hardening guide | Claude Code |

---

**Status:** ✅ PRODUCTION READY
**Last Review:** 2025-12-12
**Next Review:** 2026-03-12 (Quarterly)
