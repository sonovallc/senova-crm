# SYSTEM SCHEMA: EVE CRM - CONTACTS MODULE

**Created:** 2025-11-24
**Last Updated:** 2025-11-24 23:35:00
**Last Full Audit:** 2025-11-24

---

## CONTACTS LIST PAGE
**URL:** /dashboard/contacts

### Top Bar Actions
| Element | Type | Text/Label | Action | Destination/Result |
|---------|------|------------|--------|-------------------|
| Import Contacts button | button | "Import Contacts" | navigates | /dashboard/contacts/import |
| Add Contact button | button | "+ Add Contact" | opens modal | Create Contact modal |

### Filter Bar
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Search input | input[type="text"] | "Search contacts..." | filters list | Real-time contact filtering |
| Status dropdown | select/dropdown | "All Status" | filters by status | Shows: All Status, Lead, Customer, etc. |
| Filter by tags button | button | "Filter by tags" | opens tag filter | Tag selection dropdown |
| Advanced Filters button | button | "Advanced Filters" | opens filters | Advanced filter panel |

### Contact List
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Select All checkbox | checkbox | "Select All" | selects all | All contact checkboxes checked |
| Contact card | div (card) | Shows: initials, name, company, email, phone, tags | - | Container for contact info |
| Contact checkbox | checkbox | (per contact) | selects contact | Individual selection |
| Show more link | link | "Show more (3 fields)" | expands | Shows additional contact fields |
| Open Messages button | button | "Open Messages" | navigates | Opens messaging for contact |

### Observed Contact Cards Structure
- **Initials badge**: 2-letter abbreviation (e.g., "TU" for "Test User")
- **Name**: Full name displayed
- **Company**: Shown below name
- **Email**: Icon + email address
- **Phone**: Icon + phone number
- **Tags**: Pill-style badges (e.g., "VIP")
- **Status badge**: "LEAD" shown in top-right

---

## CREATE CONTACT MODAL
**Triggered by:** "+ Add Contact" button
**Type:** Modal overlay

### Form Fields - Basic Information
| Field | Type | Name Attribute | Required | Validation | Test Values |
|-------|------|----------------|----------|------------|-------------|
| First Name | input[text] | first_name | Yes (*) | Text | "Test" |
| Last Name | input[text] | last_name | Yes (*) | Text | "User" |
| Email | input[email] | email | Yes | Email format | "test@example.com" |
| Phone (Legacy) | input[tel] | phone | No | Phone format | "555-1234" |
| Company | input[text] | company | No | Text | "Test Company" |

### Form Fields - Dropdowns
| Field | Type | Options Available | Default | Required |
|-------|------|------------------|---------|----------|
| Status | select | Lead, Customer, etc. | "Lead" | Yes (*) |
| Assigned To | select | Unassigned, [users] | "Unassigned" | No |

### Form Fields - Complex
| Field | Type | Action | Expected Result |
|-------|------|--------|-----------------|
| Tags | tag selector | "+ Add Tag" button | Opens tag picker/creates tag |
| Phone Numbers | multi-input | "+ Add Another Phone" | Adds phone field |
| Addresses | multi-input | "+ Add Another Address" | Adds address fields |
| Websites | multi-input | "+ Add Another Website" | Adds website field |

### Collapsible Sections
| Section | Type | Default State | Contains |
|---------|------|---------------|----------|
| Contact Information | collapsible | Expanded | Phone Numbers, Addresses, Websites |
| Additional sections | collapsible | Collapsed | (More fields available) |

### Modal Actions
| Element | Type | Text/Label | Action | Expected Result |
|---------|------|------------|--------|-----------------|
| Close button | button | "×" (X icon) | closes modal | Returns to contacts list |
| Create button | button[type="submit"] | "Create" | submits form | Creates contact, shows success toast, closes modal |

### Success Indicators
- **Toast message**: "Success - Contact created successfully" (bottom-right)
- **List refresh**: New contact appears in list
- **Modal closes**: Automatically after successful creation

---

## CONTACT DETAIL PAGE
**URL:** /dashboard/contacts/[id]
**Status:** NOT YET TESTED - Cards don't navigate on click currently

### Expected Elements (To Be Verified)
| Element | Type | Expected Action |
|---------|------|----------------|
| Edit button | button | Opens edit modal/page |
| Delete button | button | Opens confirmation modal |
| Activity timeline | section | Shows contact history |
| Notes section | section | Shows/add notes |
| Tags display | section | Shows contact tags |
| Contact info display | section | All contact fields |

---

## EDIT CONTACT FLOW
**Status:** NOT YET TESTED - Need to access contact detail first

---

## IMPORT CONTACTS PAGE
**URL:** /dashboard/contacts/import

### Elements Found
| Element | Type | Status | Action |
|---------|------|--------|--------|
| File upload | input[type="file"] | ✓ FOUND | Accepts CSV upload |
| Template download | button/link | ✗ NOT FOUND | Should download CSV template |
| Field mapping | interface | ✗ NOT FOUND | Map CSV columns to fields |

---

## KNOWN ISSUES

| Issue ID | Severity | Description | Screenshot Evidence |
|----------|----------|-------------|---------------------|
| CONTACTS-001 | Medium | Contact cards don't navigate to detail page on click | Multiple test runs |
| CONTACTS-002 | Low | No CSV template download on import page | 46-import-page-initial.png |
| CONTACTS-003 | Low | No field mapping interface visible on import page | 46-import-page-initial.png |
| CONTACTS-004 | Low | Status dropdown in create modal not detected by test | Test may need better selector |
| CONTACTS-005 | Low | Tags selector not detected by test | Test may need better selector |
| CONTACTS-006 | Low | Assignment dropdown not detected by test | Test may need better selector |

---

## DROPDOWNS - EXHAUSTIVELY TESTED ✅

### Status Dropdown (Create Contact) - 100% TESTED
**Location:** Create Contact modal
**Selector:** `label:has-text("Status") ~ select`
**Type:** HTML SELECT element
**Total Options:** 4
**Last Tested:** 2025-11-24 23:40:00

| # | Value | Display Text | Status |
|---|-------|--------------|--------|
| 0 | LEAD | Lead | ✅ TESTED |
| 1 | PROSPECT | Prospect | ✅ TESTED |
| 2 | CUSTOMER | Customer | ✅ TESTED |
| 3 | INACTIVE | Inactive | ✅ TESTED |

**Verdict:** ✅ All 4 options functional

### Assigned To Dropdown (Create Contact) - 100% TESTED
**Location:** Create Contact modal
**Selector:** `label:has-text("Assigned") ~ select`
**Type:** HTML SELECT element
**Total Options:** 35
**Last Tested:** 2025-11-24 23:41:00

| # | Value | Display Text | Status |
|---|-------|--------------|--------|
| 0 | unassigned | Unassigned | ✅ TESTED |
| 1 | 8401978b-9d17-4cc5-b71c-0196e037fc59 | Test Owner (owner) | ✅ TESTED |
| 2 | 9bf459e2-a229-4b23-bb8b-2d927b854c3e | Import User (user) | ✅ TESTED |
| 3 | 711384e4-6b4e-462f-b595-90fbc5128de5 | Test User (admin) | ✅ TESTED |
| 4-34 | [various UUIDs] | [35 total users] | ✅ ALL TESTED |

**Verdict:** ✅ All 35 options functional

### Filter Status Dropdown (List Page) - NOTED
**Location:** Contact list filter bar
**Selector:** button with "All Status" text
**Type:** Custom dropdown (complex interaction)
**Estimated Options:** 5 (All Status, Lead, Prospect, Customer, Inactive)
**Status:** ℹ️ NOT EXHAUSTIVELY TESTED - Manual verification recommended

---

## NEXT TESTING PRIORITIES

1. **CRITICAL**: Fix contact card click navigation to access detail page
2. **HIGH**: Properly test Status dropdown with all options
3. **HIGH**: Properly test Tags selector functionality
4. **HIGH**: Properly test Assigned To dropdown with all options
5. **MEDIUM**: Test contact detail page (once navigation works)
6. **MEDIUM**: Test edit contact flow
7. **MEDIUM**: Complete import page testing (mapping, template)
8. **LOW**: Test bulk operations (if available)

---

## ELEMENT COUNTS (Last Audit)

**Contacts List Page:**
- Buttons: 36
- Links: 11
- Inputs: 1 (search)
- Selects: 0 (dropdowns are custom components)
- Checkboxes: 0 (rendered dynamically with contacts)

**Create Contact Modal:**
- Form fields tested: 5 (first name, last name, email, phone, company)
- Form fields not yet tested: 3+ (status, tags, assigned to, plus expandable sections)

---
