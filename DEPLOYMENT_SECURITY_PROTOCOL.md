# Deployment Security Protocol

## CRITICAL RULE: NO API KEYS IN GIT

**NEVER** commit API keys, secrets, passwords, or credentials to git repositories.

## Deployment Workflow

### Step 1: Code Deployment (Automated)
1. Commit code changes (WITHOUT secrets)
2. Push to GitHub
3. Pull code on production server
4. Rebuild containers

### Step 2: API Key Configuration (MANUAL - REQUIRED)
⚠️ **STOP POINT - HUMAN INTERACTION REQUIRED** ⚠️

After deployment, you MUST manually configure API keys via the CRM web interface:

1. Navigate to https://crm.senovallc.com
2. Login as owner user
3. Go to **Settings → Integrations → Mailgun**
4. Enter Mailgun configuration:
   - **API Key**: [Your Mailgun API key]
   - **Sending Domain**: [Your verified domain]
   - **Is Default**: ☑ Yes
5. Click **Save**

### Step 3: Verification (Automated)
1. Test email sending functionality
2. Verify inbox displays correctly
3. Confirm all features work

## Files That Must NEVER Be Committed

- `.env` files
- `*.py` files with `setup_`, `create_`, `seed_` prefixes
- Any file containing:
  - API keys
  - Passwords
  - Database credentials
  - Secret tokens

## Git History Cleanup

If secrets are accidentally committed:

```bash
# Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file-with-secret.py" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push --force origin main

# Rotate the exposed secret immediately
```

## Production Configuration Storage

API keys and secrets are stored:
- **Production**: PostgreSQL database (encrypted)
- **Local Development**: `.env.local` (gitignored)
- **Never**: Git repository

## Checklist Before Every Push

- [ ] No `.env` files staged
- [ ] No setup scripts with hardcoded keys
- [ ] No database dumps with sensitive data
- [ ] Gitignore is comprehensive
- [ ] Secrets will be configured via UI after deployment
