# 🚨 URGENT SECURITY FIXES REQUIRED

**Status:** DEPLOYMENT BLOCKED
**Priority:** CRITICAL
**Estimated Time:** 3-4 hours

---

## IMMEDIATE ACTIONS REQUIRED

### FIX #1: Remove Hardcoded Password (15 min) ⏱️ URGENT

**Problem:** Master admin password "D3n1w3n1!" is hardcoded in migration file

**Steps to fix:**

```bash
# 1. Edit the migration file
# File: backend/alembic/versions/20251127_1900_seed_senova_initial_data.py

# 2. Change line 33 from:
MASTER_OWNER_PASSWORD = "D3n1w3n1!"

# 3. To:
import os
MASTER_OWNER_PASSWORD = os.getenv("MASTER_OWNER_PASSWORD")
if not MASTER_OWNER_PASSWORD:
    raise ValueError("MASTER_OWNER_PASSWORD environment variable must be set")

# 4. Add to backend/.env.example:
# Master owner password (set this securely in production)
# MASTER_OWNER_PASSWORD=<generate-strong-password-here>

# 5. For production, use a strong password like:
# openssl rand -base64 32
```

**After fix:**
- Change actual admin password in production database
- Audit logs for any unauthorized access using old password

---

### FIX #2: Remove .env Files from Git (30 min) ⏱️ URGENT

**Problem:** Environment files tracked in Git version control

**Steps to fix:**

```bash
cd context-engineering-intro

# 1. Remove from Git tracking (keep local files)
git rm --cached backend/.env
git rm --cached backend/.env.local
git rm --cached frontend/.env.local
# Keep frontend/.env.production - only has public vars

# 2. Verify .gitignore has:
cat >> .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.*.local
**/.env
backend/.env
backend/.env.local
frontend/.env.local
EOF

# 3. Create .env.example templates
cp backend/.env backend/.env.example
# Then edit backend/.env.example to replace all real values with placeholders

cp frontend/.env.local frontend/.env.example

# 4. Commit the removal
git add .gitignore
git commit -m "security: Remove .env files from version control and add templates"

# 5. Audit Git history for real secrets (run this command)
git log -p backend/.env backend/.env.local frontend/.env.local | grep -i "api_key\|secret\|password" | head -50
```

**Important:** Review the git log output above. If you find any REAL API keys/secrets, those keys must be rotated immediately.

---

### FIX #3: Remove SSL Certificates from Git (20 min) ⏱️ URGENT

**Problem:** SSL private keys in repository

**Steps to verify and fix:**

```bash
cd context-engineering-intro

# 1. Check if these are production certificates
openssl x509 -in nginx/ssl/fullchain.pem -text -noout | grep "Subject:"
openssl x509 -in nginx/ssl/fullchain.pem -text -noout | grep "CN="

# 2. If domain is crm.senovallc.com (production):
#    - Revoke these certificates immediately
#    - These are compromised
#    - Reissue new certificates

# 3. Remove from Git
git rm --cached nginx/ssl/fullchain.pem
git rm --cached nginx/ssl/privkey.pem

# 4. Add to .gitignore
cat >> nginx/ssl/.gitignore << 'EOF'
*.pem
*.key
*.crt
*.p12
*.pfx
EOF

# 5. Create placeholder README
cat > nginx/ssl/README.md << 'EOF'
# SSL Certificates

DO NOT commit actual certificates to Git.

For production, mount certificates as Docker volumes from a secure location.

Recommended: Use Cloudflare SSL/TLS (Origin Certificates) instead.
EOF

# 6. Commit the changes
git add nginx/ssl/.gitignore nginx/ssl/README.md
git commit -m "security: Remove SSL certificates from version control"
```

---

### FIX #4: Remove Database Credentials from Code (10 min)

**Problem:** Development database credentials in reset_admin_password.py

**Steps to fix:**

```bash
# Edit: backend/reset_admin_password.py
# Change line 12 from:
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://senova_crm_user:senova_dev_password@localhost:5432/senova_crm")

# To:
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable must be set")
```

---

### FIX #5: Create Production Configuration (2 hours)

**Create these files:**

#### 1. `backend/.env.production.template`

```bash
# Copy from backend/.env but with production-specific changes
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING

DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/senova_crm
SECRET_KEY=<generate-with-openssl-rand-hex-32>
ENCRYPTION_KEY=<generate-with-fernet>
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Production URLs
FRONTEND_URL=https://crm.senovallc.com
BACKEND_URL=https://crm.senovallc.com/api
ALLOWED_ORIGINS=https://crm.senovallc.com

# Redis (Docker internal)
REDIS_URL=redis://redis:6379/0

# Production API keys (set these securely)
MAILGUN_API_KEY=<production-key>
MAILGUN_WEBHOOK_SIGNING_KEY=<production-key>
MAILGUN_DOMAIN=mg.senovallc.com

# Monitoring
SENTRY_DSN=<production-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

#### 2. `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: senova-postgres-prod
    restart: always
    environment:
      POSTGRES_DB: senova_crm
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - senova-network

  redis:
    image: redis:7-alpine
    container_name: senova-redis-prod
    restart: always
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - senova-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: senova-backend-prod
    restart: always
    env_file:
      - ./backend/.env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - senova-network

  celery-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: senova-celery-worker-prod
    restart: always
    command: celery -A app.tasks.celery_app worker --loglevel=info
    env_file:
      - ./backend/.env.production
    depends_on:
      - redis
      - postgres
    networks:
      - senova-network

  celery-beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: senova-celery-beat-prod
    restart: always
    command: celery -A app.tasks.celery_app beat --loglevel=info
    env_file:
      - ./backend/.env.production
    depends_on:
      - redis
      - postgres
    networks:
      - senova-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://crm.senovallc.com/api
        NEXT_PUBLIC_WS_URL: wss://crm.senovallc.com/api
    container_name: senova-frontend-prod
    restart: always
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - senova-network

  nginx:
    image: nginx:alpine
    container_name: senova-nginx-prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - senova-network

volumes:
  postgres_data:
    name: senova_postgres_data_prod
  redis_data:
    name: senova_redis_data_prod

networks:
  senova-network:
    name: senova-network-prod
    driver: bridge
```

---

## VERIFICATION CHECKLIST

After completing all fixes, verify:

- [ ] No passwords in code (`grep -r "password.*=.*\"" backend/`)
- [ ] No .env files tracked (`git ls-files | grep .env`)
- [ ] No SSL certs tracked (`git ls-files | grep -E "\.pem|\.key|\.crt"`)
- [ ] .gitignore updated
- [ ] Production config templates created
- [ ] Strong secrets generated for production
- [ ] Git history audited for real secrets
- [ ] All commits made documenting security fixes

---

## GENERATE STRONG SECRETS FOR PRODUCTION

```bash
# SECRET_KEY for JWT
openssl rand -hex 32

# ENCRYPTION_KEY for Fernet
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Database password
openssl rand -base64 32

# Master owner password
openssl rand -base64 24
```

---

## AFTER FIXES - NEXT STEPS

1. Re-run security audit
2. Test all fixes in local environment
3. Proceed with Phase 2: Configuration Analysis
4. Create deployment plan
5. Set up staging environment
6. Deploy to staging for testing
7. Only then deploy to production

---

**Time to complete:** 3-4 hours
**Blockers removed:** Ready for Phase 2 after fixes complete
**Status:** In Progress - Awaiting fixes

**Created:** 2025-12-12
**Priority:** P0 - CRITICAL
