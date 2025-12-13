# Senova CRM - Email System Architecture

**Last Updated:** December 10, 2024
**Version:** 1.0
**Status:** Production Ready

---

## 1. System Overview

### High-Level Architecture

```
                                    SENOVA CRM EMAIL SYSTEM

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                           INBOUND FLOW                                   │
    │                                                                          │
    │   External Email ──► Mailgun ──► Webhook ──► Backend ──► Database       │
    │                      (receives)   POST       /webhooks    communications │
    │                                   /mailgun                               │
    │                                   /inbound                               │
    └─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                          OUTBOUND FLOW                                   │
    │                                                                          │
    │   ┌──────────────┐     ┌─────────────┐     ┌─────────────┐              │
    │   │ Autoresponder│     │   Celery    │     │   Mailgun   │              │
    │   │   Trigger    │────►│   Worker    │────►│     API     │──► Recipient │
    │   │  (tag added) │     │  (5 min)    │     │   (POST)    │              │
    │   └──────────────┘     └─────────────┘     └─────────────┘              │
    │                                                                          │
    │   Database: autoresponder_executions (PENDING → SENT)                   │
    └─────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Mailgun** | Email sending/receiving via API | External service |
| **Celery Worker** | Background task processing | Docker container |
| **Celery Beat** | Scheduled task triggering | Docker container |
| **Autoresponder Service** | Queue processing, email assembly | `backend/app/services/autoresponder_service.py` |
| **Webhook Handler** | Inbound email processing | `backend/app/api/v1/webhooks.py` |

---

## 2. Database Schema

### Entity Relationship Diagram

```
┌─────────────────────┐
│      objects        │◄─────────────────────────────────────────┐
│  (business entity)  │                                          │
├─────────────────────┤                                          │
│ id (PK)             │                                          │
│ name                │                                          │
│ ...                 │                                          │
└─────────────────────┘                                          │
         │                                                        │
         │ 1:N                                                    │
         ▼                                                        │
┌─────────────────────────────┐      ┌──────────────────────────┐│
│  object_mailgun_settings    │      │   email_sending_profiles ││
│  (API endpoint config)      │      │   (sender identity)      ││
├─────────────────────────────┤      ├──────────────────────────┤│
│ id (PK)                     │◄─────│ mailgun_settings_id (FK) ││
│ object_id (FK)              │      │ object_id (FK) ──────────┘│
│ sending_domain **CRITICAL** │      │ email_address             │
│ api_key (encrypted)         │      │ display_name              │
│ verified_at                 │      │ reply_to_address          │
│ is_active                   │      │ is_active                 │
└─────────────────────────────┘      └──────────────────────────┘
                                                  │
                                                  │ N:M
                                                  ▼
                                     ┌──────────────────────────┐
                                     │ user_email_profile_      │
                                     │ assignments              │
                                     ├──────────────────────────┤
                                     │ user_id (FK)             │
                                     │ profile_id (FK)          │
                                     │ is_default               │
                                     └──────────────────────────┘

┌─────────────────────┐      ┌──────────────────────────────────┐
│     contacts        │      │       autoresponders             │
├─────────────────────┤      ├──────────────────────────────────┤
│ id (PK)             │      │ id (PK)                          │
│ email               │      │ name                             │
│ first_name          │      │ trigger_type (TAG_ADDED, etc.)   │
│ primary_object_id   │─┐    │ trigger_config (JSON)            │
│ ...                 │ │    │ is_active                        │
└─────────────────────┘ │    │ total_sent                       │
         │              │    │ total_failed                     │
         │              │    └──────────────────────────────────┘
         │              │                    │
         │              │                    │ 1:N
         │              │                    ▼
         │              │    ┌──────────────────────────────────┐
         │              │    │     autoresponder_actions        │
         │              │    │     (email content)              │
         │              │    ├──────────────────────────────────┤
         │              │    │ id (PK)                          │
         │              │    │ autoresponder_id (FK)            │
         │              │    │ action_order                     │
         │              │    │ subject **EMAIL SUBJECT**        │
         │              │    │ body_html **EMAIL BODY**         │
         │              │    │ recipient_type                   │
         │              │    │ is_active                        │
         │              │    └──────────────────────────────────┘
         │              │
         │              └──────────────┐
         │                             │
         ▼                             ▼
┌──────────────────────────────────────────────────────────────┐
│               autoresponder_executions                        │
│               (queue / audit log)                             │
├──────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ autoresponder_id (FK)                                         │
│ contact_id (FK) ─── Contact must have primary_object_id!     │
│ sequence_step                                                 │
│ status (PENDING / SENT / FAILED / SKIPPED)                   │
│ scheduled_for (timestamp)                                     │
│ executed_at (timestamp)                                       │
│ mailgun_message_id                                            │
│ error_message                                                 │
└──────────────────────────────────────────────────────────────┘
```

### Table Purposes

| Table | Purpose |
|-------|---------|
| `objects` | Business entities (Eve Beauty MA, Hana Beauty, Moda Beauty) |
| `object_mailgun_settings` | Mailgun API configuration per object (domain, API key) |
| `email_sending_profiles` | Sender identities (From address, display name) |
| `user_email_profile_assignments` | Which users can send from which profiles |
| `contacts` | Contact records with `primary_object_id` for object assignment |
| `autoresponders` | Autoresponder definitions (trigger type, conditions) |
| `autoresponder_actions` | Email content (subject, body_html) |
| `autoresponder_executions` | Queue of pending/sent/failed executions |
| `communications` | Log of all sent/received emails |

---

## 3. Critical Architecture Note - Domain Configuration

### The Two Domains (IMPORTANT!)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     CRITICAL: TWO DIFFERENT DOMAINS                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  object_mailgun_settings.sending_domain = "mg.senovallc.com"               │
│  ├── Used for: Mailgun API endpoint                                        │
│  ├── API URL: https://api.mailgun.net/v3/mg.senovallc.com/messages        │
│  └── Must be: A verified Mailgun domain                                    │
│                                                                             │
│  email_sending_profiles.email_address = "evebeauty@senovallc.com"          │
│  ├── Used for: From header recipients see                                  │
│  ├── Header: "Eve Beauty <evebeauty@senovallc.com>"                        │
│  └── Can be: Any domain with SPF/DKIM pointing to Mailgun                  │
│                                                                             │
│  THEY ARE DIFFERENT! Don't confuse them!                                   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Bug That Was Fixed (December 10, 2024)

**Problem:** Code was extracting domain from email address for API calls.

```python
# WRONG - Bug that caused 401 Unauthorized
sending_domain = from_email.split('@')[1]
# evebeauty@senovallc.com → senovallc.com (WRONG!)
# API call went to: https://api.mailgun.net/v3/senovallc.com/messages
# Result: 401 Unauthorized (API key only valid for mg.senovallc.com)
```

**Fix:** Always use `mailgun_settings.sending_domain` for API calls.

```python
# CORRECT - Fixed code
sending_domain = mailgun_settings.sending_domain
# Returns: mg.senovallc.com (CORRECT!)
# API call goes to: https://api.mailgun.net/v3/mg.senovallc.com/messages
# Result: 200 OK
```

**File Changed:** `backend/app/services/autoresponder_service.py` lines 416-419

---

## 4. Autoresponder Email Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTORESPONDER EMAIL FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  1. TRIGGER      │  Form submission adds tag to contact
    │                  │  OR manual tag addition in CRM
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │  2. QUEUE CREATION                                                    │
    │  File: backend/app/api/v1/tags.py                                    │
    │  Function: add_tag_to_contact()                                       │
    │                                                                       │
    │  → Calls check_and_queue_autoresponders(                             │
    │        trigger_type=TriggerType.TAG_ADDED,                           │
    │        contact_id=contact_id,                                         │
    │        trigger_data={"tag_id": tag_id}                               │
    │    )                                                                  │
    │  → Creates autoresponder_execution with status=PENDING               │
    └────────┬─────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │  3. CELERY BEAT TRIGGER                                               │
    │  Schedule: Every 5 minutes                                            │
    │  Task: autoresponder.process_queue                                    │
    │  File: backend/app/tasks/autoresponder_tasks.py                       │
    └────────┬─────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │  4. QUEUE PROCESSING                                                  │
    │  File: backend/app/services/autoresponder_service.py                 │
    │  Function: process_autoresponder_queue()                             │
    │                                                                       │
    │  Query: SELECT * FROM autoresponder_executions                       │
    │         WHERE status = 'PENDING'                                      │
    │         AND scheduled_for <= NOW()                                    │
    │         LIMIT 100                                                     │
    └────────┬─────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │  5. EMAIL ASSEMBLY (per execution)                                    │
    │  Function: send_autoresponder_email()                                │
    │                                                                       │
    │  Step A: Get contact.primary_object_id                               │
    │          └─ FAIL if NULL: "Contact not assigned to any object"       │
    │                                                                       │
    │  Step B: Query email_sending_profiles                                │
    │          WHERE object_id = contact.primary_object_id                 │
    │          AND is_active = true                                         │
    │          └─ FAIL if NULL: "Object has no email sending profile"      │
    │                                                                       │
    │  Step C: Query object_mailgun_settings                               │
    │          WHERE id = email_profile.mailgun_settings_id                │
    │          └─ FAIL if NULL: "Object Mailgun not configured"            │
    │                                                                       │
    │  Step D: Query autoresponder_actions                                 │
    │          WHERE autoresponder_id = autoresponder.id                   │
    │          AND is_active = true                                         │
    │          ORDER BY action_order LIMIT 1                               │
    │          └─ Get subject and body_html from action                    │
    └────────┬─────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │  6. MAILGUN API CALL                                                  │
    │                                                                       │
    │  POST https://api.mailgun.net/v3/{sending_domain}/messages           │
    │                                        ▲                              │
    │                                        │                              │
    │                    mailgun_settings.sending_domain                   │
    │                    (e.g., mg.senovallc.com)                          │
    │                                                                       │
    │  Headers:                                                             │
    │    From: {display_name} <{email_address}>                            │
    │          email_profile.display_name                                   │
    │          email_profile.email_address                                  │
    │                                                                       │
    │    To: contact.email                                                  │
    │    Subject: action.subject                                            │
    │    Body: action.body_html                                             │
    └────────┬─────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │  7. STATUS UPDATE                                                     │
    │                                                                       │
    │  Success (HTTP 200):                                                  │
    │    execution.status = SENT                                            │
    │    execution.executed_at = NOW()                                      │
    │    execution.mailgun_message_id = response.message_id                │
    │    autoresponder.total_sent += 1                                      │
    │                                                                       │
    │  Failure:                                                             │
    │    execution.status = FAILED                                          │
    │    execution.error_message = error_description                        │
    │    autoresponder.total_failed += 1                                    │
    └──────────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Function | Purpose |
|------|----------|---------|
| `backend/app/api/v1/tags.py` | `add_tag_to_contact()` | Triggers autoresponder check on tag add |
| `backend/app/api/v1/contacts.py` | `create_contact()` | Triggers autoresponder check on contact create |
| `backend/app/services/autoresponder_service.py` | `check_and_queue_autoresponders()` | Creates PENDING executions |
| `backend/app/services/autoresponder_service.py` | `process_autoresponder_queue()` | Processes PENDING → SENT |
| `backend/app/services/autoresponder_service.py` | `send_autoresponder_email()` | Assembles and sends email |
| `backend/app/tasks/autoresponder_tasks.py` | `process_queue()` | Celery task definition |

---

## 5. Email Receiving Flow

### Inbound Email Processing

```
    External Sender
          │
          ▼
    ┌─────────────┐
    │   Mailgun   │  Receives email at mg.senovallc.com
    │   (MX DNS)  │
    └──────┬──────┘
           │
           │  Webhook POST
           ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │  Webhook Endpoint: POST /api/v1/webhooks/mailgun/inbound             │
    │  File: backend/app/api/v1/webhooks.py                                │
    │                                                                       │
    │  1. Verify webhook signature (HMAC)                                  │
    │  2. Parse sender email address                                        │
    │  3. Match to contact: SELECT * FROM contacts WHERE email = sender    │
    │  4. Store attachments (if any)                                        │
    │  5. Create communication record:                                      │
    │     - direction: 'inbound'                                            │
    │     - contact_id: matched contact                                     │
    │     - subject, body, attachments                                      │
    └──────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────┐
    │   Unified Inbox UI      │  Dashboard → Inbox
    │   Shows all inbound     │
    │   and outbound emails   │
    └─────────────────────────┘
```

### Webhook Configuration

| Setting | Value |
|---------|-------|
| Endpoint | `https://crm.senovallc.com/api/v1/webhooks/mailgun/inbound` |
| Signing Key | Stored in `object_mailgun_settings.webhook_signing_key` |
| Events | `stored` (for inbound emails) |

---

## 6. Object-Based Multi-Tenancy

### How Objects Isolate Email Sending

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-TENANT ISOLATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Object: Eve Beauty MA                                                       │
│  ├── Email Profile: evebeauty@senovallc.com                                 │
│  ├── Display Name: "Eve Beauty"                                              │
│  ├── Mailgun Domain: mg.senovallc.com                                       │
│  └── Contacts: 29 contacts assigned via primary_object_id                   │
│                                                                              │
│  Object: Hana Beauty                                                         │
│  ├── Email Profile: HanaBeauty@senovallc.com                                │
│  ├── Display Name: "Hana Beauty"                                             │
│  ├── Mailgun Domain: mg.senovallc.com                                       │
│  └── Contacts: Assigned via primary_object_id                               │
│                                                                              │
│  Object: Moda Beauty                                                         │
│  ├── Email Profile: ModaBeauty@senovallc.com                                │
│  ├── Display Name: "Moda Beauty"                                             │
│  ├── Mailgun Domain: mg.senovallc.com                                       │
│  └── Contacts: Assigned via primary_object_id                               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  KEY RULE: When autoresponder sends to contact, it uses that contact's      │
│            object's email profile - NOT the autoresponder creator's email.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Contact Object Assignment

Every contact MUST have `primary_object_id` set for autoresponders to work:

```sql
-- Check if contact has object assignment
SELECT id, email, primary_object_id FROM contacts WHERE email = 'test@example.com';

-- Assign contact to object
UPDATE contacts SET primary_object_id = 'object-uuid-here' WHERE id = 'contact-id';
```

---

## 7. Celery Tasks

### Task Configuration

| Task Name | Schedule | Function |
|-----------|----------|----------|
| `autoresponder.process_queue` | Every 5 minutes | Process PENDING executions |
| `autoresponder.check_date_triggers` | Daily at midnight | Check date-based autoresponders |
| `autoresponder.cleanup_old_executions` | Weekly | Remove old execution records |

### Queue Processing Logic

```python
# Celery beat schedule (celerybeat-schedule)
CELERY_BEAT_SCHEDULE = {
    'process-autoresponder-queue': {
        'task': 'autoresponder.process_queue',
        'schedule': timedelta(minutes=5),
    },
}

# What gets processed
query = select(AutoresponderExecution).where(
    and_(
        AutoresponderExecution.status == ExecutionStatus.PENDING,
        AutoresponderExecution.scheduled_for <= datetime.utcnow()  # Due now or past
    )
).limit(100)
```

### Monitoring Celery

```bash
# Check worker status
docker compose logs celery_worker --tail=50

# Check beat schedule
docker compose logs celery_beat --tail=20

# Expected log output (success)
[INFO] Processing autoresponder queue...
[INFO] Processing 1 pending autoresponder executions
[INFO] HTTP Request: POST https://api.mailgun.net/v3/mg.senovallc.com/messages "HTTP/1.1 200 OK"
[INFO] Sent autoresponder <uuid> to recipient@email.com
[INFO] Autoresponder queue processed: 1 sent, 0 failed, 0 skipped
```

---

## 8. Error Handling

### Failure Scenarios and Status Codes

| Error | Status | error_message | Cause | Solution |
|-------|--------|---------------|-------|----------|
| No object | `FAILED` | "Contact not assigned to any object" | `contact.primary_object_id` is NULL | Assign contact to object |
| No profile | `FAILED` | "Object has no email sending profile configured" | No active email_sending_profile for object | Create email profile for object |
| No Mailgun | `FAILED` | "Object Mailgun not configured" | No object_mailgun_settings or no API key | Configure Mailgun settings |
| 401 Unauthorized | `FAILED` | "Mailgun API error: 401" | Wrong sending_domain | Use `mailgun_settings.sending_domain` |
| Suppressed | `SKIPPED` | (none) | Email on suppression list | Remove from suppressions |
| Unsubscribed | `SKIPPED` | (none) | Contact unsubscribed | Respect preference |
| No email | `SKIPPED` | (none) | Contact has no email address | Add email to contact |

### Exception Handling in Code

```python
# backend/app/services/autoresponder_service.py

try:
    success = await send_autoresponder_email(execution.id, db)
    if success:
        stats["sent"] += 1
    else:
        stats["failed"] += 1
except Exception as e:
    logger.error(f"Error processing execution {execution.id}: {e}")
    stats["failed"] += 1
    execution.status = ExecutionStatus.FAILED
    execution.error_message = str(e)
    await db.commit()
```

---

## 9. Troubleshooting Guide

| Symptom | Likely Cause | Diagnostic Query | Solution |
|---------|--------------|------------------|----------|
| Execution stuck in PENDING | `scheduled_for` in future | `SELECT scheduled_for FROM autoresponder_executions WHERE status='PENDING'` | Wait or update timestamp |
| 401 Unauthorized from Mailgun | Wrong API domain | Check logs for API URL | Use `mailgun_settings.sending_domain` |
| NULL subject/body in email | Reading from wrong table | `SELECT subject, body_html FROM autoresponder_actions WHERE autoresponder_id=?` | Query `autoresponder_actions` |
| Email sent from wrong address | Legacy user-based lookup | Check `from_email` in logs | Use object-based email profile |
| Autoresponder not triggering | Contact missing object | `SELECT primary_object_id FROM contacts WHERE id=?` | Assign contact to object |
| No executions created | Tag doesn't match config | `SELECT trigger_config FROM autoresponders WHERE is_active=true` | Verify tag_id matches |
| Celery not processing | Worker not running | `docker compose ps celery_worker` | Restart worker |

### Diagnostic Queries

```sql
-- Check execution status
SELECT id, status, scheduled_for, error_message
FROM autoresponder_executions
ORDER BY created_at DESC LIMIT 10;

-- Check contact's object assignment
SELECT c.id, c.email, c.primary_object_id, o.name as object_name
FROM contacts c
LEFT JOIN objects o ON o.id = c.primary_object_id
WHERE c.email = 'test@email.com';

-- Check object's email configuration
SELECT o.name, esp.email_address, oms.sending_domain
FROM objects o
JOIN email_sending_profiles esp ON esp.object_id = o.id
JOIN object_mailgun_settings oms ON oms.id = esp.mailgun_settings_id
WHERE o.id = 'object-uuid';

-- Check autoresponder configuration
SELECT a.id, a.name, a.trigger_type, a.trigger_config, a.is_active
FROM autoresponders a
WHERE a.is_active = true;

-- Check autoresponder actions (email content)
SELECT aa.subject, aa.body_html, aa.is_active
FROM autoresponder_actions aa
WHERE aa.autoresponder_id = 'autoresponder-uuid';
```

---

## 10. Current Configuration

### Objects and Email Profiles

| Object | Email Profile | Display Name | Mailgun Domain | Status |
|--------|---------------|--------------|----------------|--------|
| Eve Beauty MA | evebeauty@senovallc.com | Eve Beauty | mg.senovallc.com | Active |
| Hana Beauty | HanaBeauty@senovallc.com | Hana Beauty | mg.senovallc.com | Active |
| Moda Beauty | ModaBeauty@senovallc.com | Moda Beauty | mg.senovallc.com | Active |

### Active Autoresponders

| Name | Trigger Type | Tag | Status |
|------|--------------|-----|--------|
| Test autoresponder | TAG_ADDED | Eve Beauty MA Promotional Holiday Form Submission | Active |

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql+asyncpg://user:pass@postgres:5432/senova_crm` |
| `REDIS_URL` | Celery broker | `redis://redis:6379/0` |
| `MAILGUN_API_KEY` | Fallback (not used for autoresponders) | Stored in database |
| `MAILGUN_DOMAIN` | Fallback (not used for autoresponders) | Stored in database |

---

## 11. Code Reference

### Key Functions

| Function | File | Line | Purpose |
|----------|------|------|---------|
| `check_and_queue_autoresponders()` | `autoresponder_service.py` | 38 | Queue autoresponder for trigger |
| `process_autoresponder_queue()` | `autoresponder_service.py` | 194 | Process PENDING executions |
| `send_autoresponder_email()` | `autoresponder_service.py` | 248 | Assemble and send email |
| `add_tag_to_contact()` | `tags.py` | 260 | Tag addition endpoint |
| `process_queue()` | `autoresponder_tasks.py` | 26 | Celery task wrapper |

### Import Chain

```python
# autoresponder_service.py imports
from app.models.autoresponder import (
    Autoresponder,
    AutoresponderAction,
    AutoresponderExecution,
    TriggerType,
    ExecutionStatus,
)
from app.models.email_sending_profile import EmailSendingProfile
from app.models.object_mailgun_settings import ObjectMailgunSettings
from app.services.mailgun_service import MailgunService
from app.utils.encryption import decrypt_api_key
```

---

## 12. Deployment Notes

### After Code Changes

```bash
# Rebuild and restart affected containers
docker compose up -d --build backend celery_worker

# Verify worker restarted
docker compose logs celery_worker --tail=10

# Check for errors
docker compose logs celery_worker 2>&1 | grep -i error
```

### Production Checklist

- [ ] All objects have email_sending_profiles configured
- [ ] All profiles have valid mailgun_settings_id
- [ ] Mailgun domains are verified (check `verified_at`)
- [ ] API keys are encrypted and valid
- [ ] Celery worker and beat are running
- [ ] Test email sends successfully

---

## Appendix: Historical Bugs Fixed

### December 10, 2024 - Mailgun Domain Bug

**Symptom:** All autoresponder emails failing with 401 Unauthorized

**Root Cause:** Code extracted domain from email address instead of using configured Mailgun domain

**Fix:** Line 419 in `autoresponder_service.py`:
```python
# Before: sending_domain = from_email.split('@')[1]
# After:  sending_domain = mailgun_settings.sending_domain
```

**Verification:** Email to wooddeni04@gmail.com sent successfully, user confirmed receipt.

---

*Document maintained by Engineering Team. Last verified: December 10, 2024.*
