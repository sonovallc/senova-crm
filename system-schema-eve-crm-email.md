# SYSTEM SCHEMA: EVE CRM EMAIL CHANNEL

**Created:** 2025-11-24
**Last Updated:** 2025-11-24 16:05:00
**Last Full Audit:** 2025-11-24 16:05:00

---

## EMAIL COMPOSER PAGE
**URL:** http://localhost:3004/dashboard/email/compose

### Header Section
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Back to Inbox link | link | "← Back to Inbox" | navigates | /dashboard/inbox |
| Page title | heading | "Compose Email" | - | - |
| Subtitle | text | "Send an email to a contact" | - | - |

### Template Selection
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Template dropdown | select | "Select a template to get started..." | opens dropdown | Shows 0 template options (EMPTY) |
| Help text | text | "Select a pre-built template..." | - | - |

### Email Fields
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| To field label | label | "To" | - | - |
| To field input | input | "Type email address or select contact..." | type email + Enter | ❌ FAIL: Email chip does not appear |
| Select from contacts link | link | "Select from contacts" | click | ❌ FAIL: 0 contacts in dropdown |
| Add Cc button | button | "Add Cc" | click | ✅ PASS: CC field appears |
| Add Bcc button | button | "Add Bcc" | click | ✅ PASS: BCC field appears |
| Subject field | input | "Email subject" | type text | ✅ PASS: Accepts text input |

### Rich Text Editor
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Message label | label | "Message" | - | - |
| Bold button | button | "B" icon | click | ✅ PASS: Toggles bold formatting |
| Italic button | button | "I" icon | click | ✅ PASS: Toggles italic formatting |
| Underline button | button | "U" icon | click | ❌ FAIL: Timeout - element intercepts prevented click |
| Bullet list button | button | Bullet icon | click | ❌ FAIL: Element not found |
| Numbered list button | button | Number icon | click | ❌ FAIL: Element not found |
| Undo button | button | Undo icon | click | Present (not tested) |
| Redo button | button | Redo icon | click | Present (not tested) |
| Link button | button | Link icon | click | ❌ FAIL: Element not found |
| Variables dropdown | button | "Variables" | click | ❌ FAIL: Element not found |
| Content area | textarea | - | type text | Not tested |

### Action Buttons
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Attachment button | button | Paperclip icon | click | Not tested |
| Cancel button | button | "Cancel" | click | Not tested |
| Send Email button | button | "Send Email" | click | ✅ PASS: Button exists and visible |

### Variable System (Expected but not working)
**Expected Variables:**
- {{contact_name}} - Full contact name
- {{first_name}} - First name
- {{last_name}} - Last name
- {{email}} - Email address
- {{company}} - Company name
- {{phone}} - Phone number

**Status:** ❌ Variables dropdown not accessible

---

## EMAIL TEMPLATES PAGE
**URL:** http://localhost:3004/dashboard/email/templates

### Header Section
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Page title | heading | "Email Templates" | - | - |
| Subtitle | text | "Create and manage reusable email templates..." | - | - |
| New Template button | button | "+ New Template" | click | ✅ PASS: Opens creation modal |

### Filter Tabs
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| All Templates tab | button | "All Templates" | click | Shows all templates |
| My Templates tab | button | "My Templates" | click | Filters to user's templates |
| System Templates tab | button | "System Templates" | click | Shows system templates |

### Filters & Search
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Search input | input | "Search templates by name or subject..." | type text | ✅ PASS: Filters templates |
| Category filter | select | "All Categories" | select option | ❌ FAIL: 0 options found (empty dropdown) |
| Sort dropdown | select | "Recently Created" | select option | Not tested |
| View toggle | button | Grid/List icon | click | ❌ FAIL: Element not found |

### Template Cards (6 templates visible)
| Template Name | Category | Subject Line | Actions Available |
|---------------|----------|--------------|-------------------|
| This is my test template | Appointment | "This is a test to {{first_name}} with {{company}}" | Preview, Edit, Copy, Delete |
| Final Fix Test 1763952992411 | General | "Test Subject Line" | Preview, Edit, Copy, Delete |
| Working Test 1763898561774 | General | "Working Subject" | Preview, Edit, Copy, Delete |
| BUG-002 Test Template | General | "Test Subject {{contact_name}}" | Preview, Edit, Copy, Delete |
| New Service Announcement | General (System) | "Introducing Our Latest Treatment" | Preview, Edit, Copy, Delete |
| Birthday Wishes | General (System) | "Happy Birthday, {{first_name}}!" | Preview, Edit, Copy, Delete |

### Template Card Actions
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Preview button | button | "👁 Preview" | click | Opens preview modal |
| Edit button | button | "✏️" icon | click | ❌ FAIL: Timeout when clicking template card |
| Copy button | button | "📋" icon | click | Duplicates template |
| Delete button | button | "🗑️" icon | click | Shows delete confirmation |

### Create Template Modal
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Modal title | heading | "Create Email Template" | - | - |
| Subtitle | text | "Create a reusable email template with variable support" | - | - |
| Template Name field | input | "e.g., Welcome Email" | type text | ✅ PASS: Accepts text |
| Category dropdown | select | "General" (default) | select option | ❌ FAIL: 0 options found |
| Subject field | input | "Email subject (use variables like {{first_name}})" | type text | ✅ PASS: Accepts text |
| Body rich text editor | editor | - | edit content | Present (not fully tested) |
| Variables dropdown | button | "Variables" | click | Shows variable list in modal |
| Cancel button | button | "Cancel" | click | ✅ PASS: Closes modal |
| Create Template button | button | "Create Template" | click | Creates template |

### Available Variables (shown in modal)
| Variable | Description |
|----------|-------------|
| {{contact_name}} | Full contact name |
| {{first_name}} | First name |
| {{last_name}} | Last name |
| {{email}} | Email address |
| {{company}} | Company name |
| {{phone}} | Phone number |

---

## EMAIL CAMPAIGNS PAGE
**URL:** http://localhost:3004/dashboard/email/campaigns

### Initial State
**Status:** ❌ CRITICAL - Page shows "Failed to load campaigns - Network Error"

### Header Section
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Page title | heading | "Email Campaigns" | - | - |
| Subtitle | text | "Create and manage mass email campaigns" | - | - |
| Create Campaign button | button | "+ Create Campaign" | click | ✅ PASS: Opens campaign wizard |

### Filters & Search
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Search input | input | "Search campaigns..." | type text | ✅ PASS: Accepts text (but no data loads due to CORS) |
| Status filter | select | "All Status" | select option | ❌ FAIL: 0 options found (empty dropdown) |

### Error State (Current)
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Error icon | icon | Red X circle | - | Indicates error |
| Error message | text | "Failed to load campaigns" | - | - |
| Error detail | text | "Network Error" | - | - |
| Try Again button | button | "Try Again" | click | Retries data fetch (still fails due to CORS) |

### Campaign Wizard - Step 1
**Status:** Opens but form fields fail to load

| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Campaign name field | input | "Campaign name" | type text | ❌ FAIL: Element not found (timeout) |
| Template dropdown | select | "Select template" | select option | ❌ FAIL: 0 options found |
| Subject field | input | "Email subject" | type text | ❌ FAIL: Element not found (timeout) |
| Content editor | editor | - | edit content | Not tested |
| Next button | button | "Next" | click | Proceeds to Step 2 |

---

## AUTORESPONDERS PAGE
**URL:** http://localhost:3004/dashboard/email/autoresponders

### Initial State
**Status:** Empty state - "No autoresponders yet"

### Header Section
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Page title | heading | "Autoresponders" | - | - |
| Subtitle | text | "Automatically send emails based on triggers" | - | - |
| Create Autoresponder button (top-right) | button | "+ Create Autoresponder" | click | ✅ PASS: Navigates to create page |

### Filters & Search
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Search input | input | "Search autoresponders..." | type text | Not tested (no data) |
| Status filter | select | "All" | select option | Visible but not tested |
| Triggers filter | select | "All Triggers" | select option | Visible but not tested |

### Empty State
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Empty icon | icon | Envelope icon | - | - |
| Empty message | text | "No autoresponders yet" | - | - |
| Empty subtitle | text | "Create your first autoresponder to get started" | - | - |
| Create Autoresponder button (center) | button | "+ Create Autoresponder" | click | ✅ PASS: Navigates to create page |

### Create Autoresponder Form
**URL:** /dashboard/email/autoresponders/create
**Status:** Form navigation succeeds but fields fail to load

| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Name field | input | "Autoresponder name" | type text | ❌ FAIL: Element not found (navigation still loading) |
| Trigger type dropdown | select | "Trigger type" | select option | ❌ FAIL: 0 options found |
| Status toggle | checkbox | "Active" | toggle | ❌ FAIL: Element not found |
| Timing mode dropdown | select | "Timing mode" | select option | ❌ FAIL: 0 options found |

### Expected Trigger Types (from requirements)
- new_contact - When new contact is created
- tag_added - When tag is added to contact
- date_based - Based on date field

### Expected Timing Modes (from requirements)
- FIXED_DURATION - Send after fixed delay
- WAIT_FOR_TRIGGER - Wait for specific trigger
- EITHER_OR - Either condition triggers send

---

## UNIFIED INBOX PAGE
**URL:** http://localhost:3004/dashboard/inbox

### Header Section
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Page title | heading | "Inbox" | - | - |
| Subtitle | text | "Unified multi-channel communications" | - | - |
| Compose Email button | button | "✉️ Compose Email" | click | Navigates to /dashboard/email/compose |
| Connected badge | badge | "Connected" | - | Status indicator |

### Filter Tabs - ALL WORKING ✅
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| All tab | button/tab | "All" | click | ✅ PASS: Shows all conversations |
| Unread tab | button/tab | "Unread" | click | ✅ PASS: Shows unread conversations |
| Read tab | button/tab | "Read" | click | ✅ PASS: Shows read conversations |
| Archived tab | button/tab | "Archived" | click | ✅ PASS: Shows archived conversations |

### Filters & Sort
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Sort dropdown | select | "Recent Activity" | select option | Present |
| Search input | input | "Search..." | type text | ❌ FAIL: Element not found (timeout) |

### Conversation List (2 conversations visible)
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Conversation 1 | card | "Aaatest Update - EMAIL - This is just a test" | click | ❌ FAIL: Element not found for clicking |
| Conversation 2 | card | "testcustomer@example.com - EMAIL - Hi,I am interested in your services." | click | ❌ FAIL: Element not found for clicking |

### Conversation Actions (Expected)
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Reply button | button | "Reply" | click | Not tested (couldn't open conversation) |
| Mark as read/unread button | button | "Mark" | click | Not tested |
| Archive button | button | "Archive" | click | Not tested |
| Refresh button | button | "Refresh" | click | ❌ FAIL: Element not found |

### Right Panel
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Empty state message | text | "Select a conversation to start messaging" | - | Shows when no conversation selected |

---

## CRITICAL ISSUES SUMMARY

### CORS Errors (CRITICAL)
**20 console errors related to CORS:**
- All API calls to http://localhost:8000/api/v1/* blocked
- Error: "Access to XMLHttpRequest at 'http://localhost:8000/api/v1/campaigns?' from origin 'http://localhost:3004' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present"
- Affects: Campaigns page (can't load data), potentially other pages

### Missing/Broken Elements by Page

#### Email Composer (51.4% working)
**Working:**
- CC/BCC toggles
- Subject field
- Bold/Italic buttons
- Send button visibility

**Broken:**
- Contact dropdown (empty)
- Manual email chip creation
- Underline button (element intercepts)
- Bullet/Numbered list buttons (not found)
- Link button (not found)
- Variables dropdown (not found)
- Template dropdown (empty)

#### Email Templates (75% working)
**Working:**
- New Template button and modal
- Search functionality
- Template cards display
- Modal form fields (name, subject)
- Cancel button

**Broken:**
- View toggle (not found)
- Category filter dropdown (empty)
- Clicking template cards to edit (timeout)
- Category dropdown in modal (empty)

#### Email Campaigns (25% working)
**Working:**
- Create Campaign button
- Search field accepts input

**Broken:**
- CRITICAL: Data fails to load due to CORS
- Status filter dropdown (empty)
- Campaign wizard form fields (timeout)
- No campaign cards display

#### Autoresponders (33% working)
**Working:**
- Create Autoresponder button
- Empty state display

**Broken:**
- Form fields not loading (navigation issue)
- Trigger type dropdown (empty)
- Status toggle (not found)
- Timing mode dropdown (empty)
- Can't click existing autoresponders (none exist)

#### Unified Inbox (60% working)
**Working:**
- All 4 filter tabs (All, Unread, Read, Archived)
- Conversation list displays
- Compose Email button

**Broken:**
- Search field (not found)
- Can't click on conversations (timeout)
- Reply/Mark/Archive buttons (can't test without opening conversation)
- Refresh button (not found)

---

## HYDRATION WARNINGS

React hydration mismatch detected on login page:
- Server/client mismatch on input elements
- `style={{caret-color:"transparent"}}` attribute mismatch
- May cause visual inconsistencies

---

## PAGE ERRORS

3 JavaScript runtime errors:
1. "Cannot read properties of undefined (reading 'map')" - occurs on campaigns page (likely due to failed CORS request)
2. Repeated on campaigns page navigation
3. Repeated on campaigns page interaction

---

## OVERALL SYSTEM HEALTH

| Page | Pass Rate | Status | Blocker |
|------|-----------|--------|---------|
| Email Composer | 51.4% | ⚠️ PARTIAL | Variables system not accessible |
| Email Templates | 75% | ⚠️ PARTIAL | View toggle missing, categories empty |
| Email Campaigns | 25% | ❌ CRITICAL | CORS blocking all data |
| Autoresponders | 33% | ⚠️ PARTIAL | Form fields not loading properly |
| Unified Inbox | 60% | ⚠️ PARTIAL | Can't interact with conversations |

**Overall Pass Rate:** 51.4%
**Production Ready:** ❌ NO

---
