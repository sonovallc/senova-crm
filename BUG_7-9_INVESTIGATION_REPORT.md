# Bug Investigation Report: Bugs #7-9 - Email Compose Flow Issues

**Investigation Date:** 2025-11-25  
**Status:** Analysis Complete  
**Severity:** High (3 blocking bugs in email compose flow)

---

## Executive Summary

Found root causes for all three bugs. All are related to the backend email sending endpoint requiring a contact_id (UUID) but the frontend allows sending to non-database emails. Bugs 8 and 9 are frontend template selector state management issues.

---

## BUG #7: UUID Error for Non-Database Emails

### Root Cause

**File:** page.tsx  
**Lines:** 289-302

The compose page uses contact_id which is either:
- A database contact's UUID (if contact selected)
- Hardcoded fallback 'manual-recipient' (if email typed manually)

**File:** communications.ts  
**Lines:** 27-40

The sendMessage() function passes contact_id to backend API endpoint /api/v1/communications/send

**File:** communications.py (backend)  
**Lines:** 204-227

The backend endpoint REQUIRES a valid UUID contact_id:

When frontend sends 'manual-recipient' as contact_id:
- Backend tries to query database for contact with id='manual-recipient'
- UUID parsing fails (string 'manual-recipient' is not valid UUID format)
- Returns 422/400 error about invalid UUID

### What Should Happen

When user enters email not in database:
1. User should get prompt: "Contact not found. Create new contact?"
2. New contact created with that email
3. Email sent successfully

### Code Evidence

**Frontend compose page (Line 292):**
```
const primaryContactId = selectedContact?.id || 'manual-recipient'
```

This is a placeholder that doesn't work with UUID requirement.

**Backend validation (Line 224-227):**
```
contact = await db.get(Contact, data.contact_id)
if not contact:
    raise NotFoundError(f"Contact {data.contact_id} not found")
```

Backend expects valid contact to exist.

---

## BUG #8: Template Selector Locks After Recipient Selected

### Root Cause Analysis

**PRIMARY ISSUE:** NO DISABLED STATE FOUND - This may be a misdiagnosis or edge case

Examined:
- email-composer.tsx (Lines 297-315): Template selector has NO disabled condition
- page.tsx (Lines 396-454): Template selector Popover has NO disabled based on recipients
- contact-selector.tsx: No state prevents template selection

**POSSIBLE ISSUES:**

1. **Race condition in template loading** - Templates take time to fetch, selector might lock UI
   
   File: page.tsx Lines 102-108
   
   If loadingTemplates is true while selecting recipient, popup might close

2. **Popover closed on recipient selection** - When contact selected, popover closes automatically

   File: page.tsx Line 324
   
   handleSelectContact closes the dropdown automatically

3. **Order-dependent bug** - contact selector state affecting template selector
   - If truly order-dependent: selecting recipient first, then trying template fails
   - No explicit prevention found in code
   - Could be UI rendering issue where templates query invalidates

### Recommended Investigation

1. Test step-by-step:
   - Select template FIRST -- works?
   - Select recipient FIRST -- template broken?
   - If step 2 fails -- this is the order dependency

2. Check for:
   - Race conditions in query key dependencies
   - Template query being refetched on recipient change
   - Popover state interference

---

## BUG #9: Template Cannot Be Changed Once Selected

### Root Cause

**File:** page.tsx  
**Lines:** 349-362

The handleUseTemplate() function modifies form fields but there is NO component state tracking selected template ID.

**EVIDENCE:**

The template selector button always shows placeholder text, never showing active template name:

**Line 406-410:**
```
<Button
  type="button"
  variant="outline"
  className="w-full justify-between"
>
  <span className="flex items-center">
    <FileCode className="mr-2 h-4 w-4" />
    Select a template to get started...  // ALWAYS shows default text!
  </span>
  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
```

### Problem Sequence

1. User selects Template A
2. setTemplateSearchOpen(false) closes the dropdown
3. User tries to click button to open dropdown again
4. Template selector shows "Select a template to get started..." (default)
5. NO visual indication that Template A is active
6. User thinks it's broken/locked

### Why It Looks Locked

- No state tracks which template is selected
- Button text never updates to show active template
- User gets no feedback that template was applied
- Dropdown closes automatically when template selected
- No "Clear template" option visible

### Solution Needed

1. Track selected template ID in state
2. Display active template name in button
3. Allow re-opening to change template
4. Reset button text when no template selected

**Missing state:**
```
const [selectedTemplateId, setSelectedTemplateId] = useState('')
```

**Missing button logic:**
```
Show template name instead of default text
{selectedTemplateId 
  ? `Using: ${templatesData?.items?.find(t => t.id === selectedTemplateId)?.name}`
  : 'Select a template to get started...'
}
```

### Additional Issue: No Way to Clear Selection

Once a template applied:
- No "Clear template" or "Use custom" button
- User must manually clear subject/body
- Feels like selection is permanent/locked

---

## Impact Analysis

Bug #7: Cannot send to non-database emails - Gets UUID error
Bug #8: Template selector becomes unresponsive after selecting recipient (possible race condition)
Bug #9: No feedback on active template - User thinks selection is locked, doesn't know how to change

---

## File Locations

Frontend Files:
1. email-composer.tsx (327 lines) - Has proper selectedTemplateId state on line 66
2. page.tsx (760 lines) - MAIN ISSUE - Missing template tracking
3. contact-selector.tsx (217 lines) - Properly manages contact state
4. communications.ts (116 lines) - Frontend API wrapper

Backend Files:
1. communications.py (913 lines) - Requires valid contact UUID
2. communication_router.py - Also depends on existing contact

---

## Testing Recommendations

### Test Bug #7: Non-Database Email
```
1. Open compose
2. Type manual email not in database
3. Enter subject and message
4. Click Send
Expected: Should create contact OR prompt to create
Actual: Gets UUID error
```

### Test Bug #8: Template After Recipient
```
1. Select a contact first
2. Try to open template selector
3. Try to select different template
Expected: Should work both directions without locking
Actual: Template selector locks/becomes unresponsive
```

### Test Bug #9: Change Templates
```
1. Select Template A
2. Check if button shows which template is active
3. Click button again to open
4. Try to select Template B
Expected: Should show active template and allow changing
Actual: Button always shows default text, template can't be changed
```

---

## Implementation Priority

BUG #7 - CRITICAL: Backend must handle non-database emails (create contact flow)
BUG #9 - HIGH: Frontend must track and display active template state
BUG #8 - MEDIUM: Investigate race condition between template and contact queries

