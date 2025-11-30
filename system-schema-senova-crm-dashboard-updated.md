# SYSTEM SCHEMA: SENOVA CRM DASHBOARD

**Created:** November 29, 2025
**Last Updated:** 2025-11-29 02:45 UTC
**Last Full Audit:** 2025-11-29 02:30 UTC
**Application URL:** http://localhost:3004

---

## LOGIN PAGE
**URL:** http://localhost:3004/login

| Element | Type | Text/Label | Action | Status |
|---------|------|------------|--------|--------|
| Email field | input | "Email" | accepts text | ✅ PASS |
| Password field | input | "Password" | accepts text | ✅ PASS |
| Sign In button | button | "Sign In" | submits form | ✅ PASS |
| Remember Me | checkbox | "Remember Me" | toggles | Not tested |
| Forgot Password | link | "Forgot Password?" | navigates | Not tested |

---

## MAIN DASHBOARD
**URL:** http://localhost:3004/dashboard

### Navigation Sidebar
| Element | Type | Text/Label | Destination | Status |
|---------|------|------------|-------------|--------|
| Dashboard | nav-link | "Dashboard" | /dashboard | ✅ PASS |
| Inbox | nav-link | "Inbox" | /dashboard/inbox | ✅ PASS |
| Contacts | nav-link | "Contacts" | /dashboard/contacts | ✅ PASS |
| Compose | nav-link | "Compose" | /dashboard/email/compose | ❌ FAIL - Not visible |
| Templates | nav-link | "Templates" | /dashboard/email/templates | ❌ FAIL - Not visible |
| Campaigns | nav-link | "Campaigns" | /dashboard/email/campaigns | ❌ FAIL - Not visible |
| Autoresponders | nav-link | "Autoresponders" | /dashboard/email/autoresponders | ❌ FAIL - Not visible |
| Activity | nav-link | "Activity" | /dashboard/activity-log | ✅ PASS |
| Settings | nav-link | "Settings" | /dashboard/settings | ❌ FAIL - Not visible |
| Calendar | nav-link | "Calendar" | /dashboard/calendar | ❌ FAIL - Not visible |
| Payments | nav-link | "Payments" | /dashboard/payments | ✅ PASS |
| AI Tools | nav-link | "AI Tools" | /dashboard/ai | ✅ PASS |

### Top Bar
| Element | Type | Text/Label | Action | Status |
|---------|------|------------|--------|--------|
| Admin dropdown | button | "Admin" | opens menu | ✅ Documented |
| Email button | button | "Email" | action | ✅ Documented |
| Settings button | button | "Settings" | navigates | ✅ Documented |
| Logout button | button | "Logout" | logs out | ✅ Documented |

---

## INBOX MODULE
**URL:** http://localhost:3004/dashboard/inbox

### Tabs
| Tab | Type | Text | Action | Status |
|-----|------|------|--------|--------|
| All | tab | "All" | shows all messages | ✅ PASS |
| Unread | tab | "Unread" | filters unread | ✅ PASS |
| Read | tab | "Read" | filters read | ✅ PASS |
| Archived | tab | "Archived" | shows archived | ✅ PASS |

### Actions
| Element | Type | Text/Label | Action | Status |
|---------|------|------------|--------|--------|
| Compose Email | button | "Compose Email" | opens composer | ✅ PASS |
| Sort dropdown | select | "Newest First" | sorts messages | Not tested |
| Archive button | button | "Archive" | archives selected | Not tested |
| Delete button | button | "Delete" | deletes selected | Not tested |

---

## CONTACTS MODULE
**URL:** http://localhost:3004/dashboard/contacts

### List View Controls
| Element | Type | Text/Label | Action | Status |
|---------|------|------------|--------|--------|
| Search field | input | "Search contacts..." | filters list | ✅ PASS |
| Status filter | select | "All Statuses" | filters by status | Not tested |
| Tag filter | select | "All Tags" | filters by tag | Not tested |
| Add Contact | button | "Add Contact" | opens modal | ✅ PASS |
| Import Contacts | button | "Import Contacts" | navigates to import | ✅ PASS |
| Export All | button | "Export All" | exports CSV | ✅ PASS |
| Bulk select | checkbox | - | selects all | Not tested |

### Add Contact Modal
| Field | Type | Required | Status |
|-------|------|----------|--------|
| First Name | input | Yes | ❌ FAIL - Not found |
| Last Name | input | Yes | ❌ FAIL - Not found |
| Email | input | Yes | ❌ FAIL - Not found |
| Phone | input | No | Not tested |
| Company | input | No | Not tested |
| Tags | multi-select | No | Not tested |

---

## EMAIL COMPOSE
**URL:** http://localhost:3004/dashboard/email/compose

| Element | Type | Text/Label | Action | Status |
|---------|------|------------|--------|--------|
| To field | input | "To" | email recipients | ❌ FAIL - Not found |
| CC/BCC button | button | "CC/BCC" | expands fields | ❌ FAIL - Not found |
| Subject field | input | "Subject" | email subject | Not tested |
| Template dropdown | select | "Select Template" | loads template | ❌ FAIL - Not found |
| Variables dropdown | button | "Variables" | inserts variable | ✅ PASS |
| Body editor | textarea | - | compose message | Not tested |
| Send button | button | "Send" | sends email | Not tested |

---

## EMAIL TEMPLATES
**URL:** http://localhost:3004/dashboard/email/templates

| Element | Type | Text/Label | Action | Status |
|---------|------|------------|--------|--------|
| Create Template | button | "Create Template" | opens form | ❌ FAIL - Not found |
| Template list | table | - | lists templates | Not tested |
| Edit button | button | "Edit" | edits template | Not tested |
| Delete button | button | "Delete" | deletes template | Not tested |

---

## EMAIL CAMPAIGNS
**URL:** http://localhost:3004/dashboard/email/campaigns

| Element | Type | Text/Label | Action | Status |
|---------|------|------------|--------|--------|
| Create Campaign | button | "Create Campaign" | opens wizard | ✅ PASS |
| Status filter | select | "All Statuses" | filters list | Not tested |
| Campaign list | table | - | lists campaigns | Not tested |

---

## AUTORESPONDERS
**URL:** http://localhost:3004/dashboard/email/autoresponders

| Element | Type | Text/Label | Action | Status |
|---------|------|------------|--------|--------|
| Create Autoresponder | button | "Create Autoresponder" | opens form | ✅ PASS |
| Enable/Disable toggle | switch | - | toggles status | Not tested |
| Edit button | button | "Edit" | edits autoresponder | Not tested |

---

## SETTINGS
**URL:** http://localhost:3004/dashboard/settings

### Tabs
| Tab | Type | Text | Content | Status |
|-----|------|------|---------|--------|
| API Keys | tab | "API Keys" | API configuration | ✅ PASS |
| Email Config | tab | "Email Config" | Email settings | ✅ PASS |
| Integrations | tab | "Integrations" | Third-party apps | ✅ PASS |
| Profile | tab | "Profile" | User profile | ✅ PASS |

### Sub-pages
| Page | URL | Status |
|------|-----|--------|
| Users Management | /dashboard/settings/users | ✅ Loads |
| Tags Management | /dashboard/settings/tags | ✅ Loads |
| Field Visibility | /dashboard/settings/fields | ✅ Loads |
| Mailgun Setup | /dashboard/settings/integrations/mailgun | ✅ Loads |
| Closebot Setup | /dashboard/settings/integrations/closebot | ✅ Loads |

---

## OTHER PAGES

| Page | URL | Status | Issues |
|------|-----|--------|--------|
| Activity Log | /dashboard/activity-log | ✅ PASS | None |
| Payments | /dashboard/payments | ✅ PASS | None |
| AI Tools | /dashboard/ai | ✅ PASS | None |
| Calendar | /dashboard/calendar | ✅ PASS | None |
| Objects | /dashboard/objects | ✅ PASS | None |

---

## TEST SUMMARY

### Statistics
- **Total Elements Tested:** 41
- **Passed:** 28 (68.3%)
- **Failed:** 13 (31.7%)
- **Not Tested:** Many secondary elements

### Critical Failures
1. Navigation menu missing 6 key links
2. Email compose form fields not accessible
3. Contact modal form fields not found
4. Template creation button missing

### Color Compliance
✅ **PASS** - No purple or green colors detected

### Console Errors
⚠️ **45 errors** detected during testing

---

## PRODUCTION READINESS

❌ **NOT READY FOR PRODUCTION**

**Required Fixes:**
1. Restore missing navigation links
2. Fix email compose form
3. Fix contact modal fields
4. Add template creation button
5. Resolve console errors

**Pass Rate Required:** 95%+
**Current Pass Rate:** 68.3%

---

*Last Debugger Session: 2025-11-29 02:30 UTC*
*Total Screenshots: 165*
*Evidence Location: screenshots/debug-senova-dashboard/*