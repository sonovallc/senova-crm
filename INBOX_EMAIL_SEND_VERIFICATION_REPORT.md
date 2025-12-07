# Inbox Email Send Verification Report - Profile ID Fix

**Date:** 2025-12-06
**Production URL:** https://crm.senovallc.com
**Test Objective:** Verify that email sending from inbox includes `profile_id` in request payload

---

## Executive Summary

**Status:** ⚠️ **TESTING INCOMPLETE - TECHNICAL BLOCKERS**

Multiple autonomous Playwright tests were executed to verify the inbox email sending functionality and confirm that the `profile_id` field is being sent in the email send request. While **Phases 2 and 3 were successful**, **Phase 4 (capturing the send-email network request) could not be completed** due to technical issues with the compose form.

---

## Test Phases

### ✅ Phase 1: Database Verification (COMPLETED MANUALLY)
**Verified:**
- User `jwoodcapital@gmail.com` has email profile: `admin@mg.senovallc.com`
- Email profile `is_default: true`
- `mailgun_settings` table is empty (0 rows) - **CORRECT** (per-profile settings used)
- Test contact available: `john.test@example.com`

**Status:** ✅ PASS

---

### ✅ Phase 2: Frontend Email Profile Fetching (COMPLETED)
**Test Results:**
- ✅ Login successful
- ✅ Inbox page loaded
- ✅ Email profile fetch detected: `GET /api/v1/email-profiles/my-profiles`
- ✅ Profile returned: "Senova CRM Admin <admin@mg.senovallc.com>"

**Network Requests Captured:**
```
POST /api/v1/auth/login
GET /api/v1/auth/me
GET /api/v1/communications/inbox/threads
GET /api/v1/email-profiles/my-profiles  ← PROFILE FETCH
```

**Status:** ✅ PASS

**Screenshot Evidence:**
- `03-inbox-loaded.png` - Shows inbox with profile loaded
- `04-network-profile-fetch.png` - Network tab showing profile fetch

---

### ✅ Phase 3: Compose Email UI (COMPLETED)
**Test Results:**
- ✅ "Compose Email" button clicked successfully
- ✅ Compose modal opened
- ✅ From field visible: "Senova CRM Admin <admin@mg.senovallc.com>"
- ✅ To field filled: `john.test@example.com`
- ⚠️ Subject field: Form structure unclear (see Technical Issues)
- ⚠️ Message field: Typing successful but validation unclear

**Screenshot Evidence:**
- `05-compose-modal-opened.png` - Modal with all fields visible
- `06-to-field-filled.png` - Recipient added as pill
- `08-message-filled.png` - Content filled in editor

**Status:** ✅ PARTIALLY PASS (form filled, but submit behavior unclear)

---

### ❌ Phase 4: Send Email Network Monitoring (BLOCKED)
**Test Results:**
- ❌ Send button click attempted (force click used due to disabled state)
- ❌ No `/send-email` request captured
- ❌ No POST request to `/communications` endpoint captured
- ❌ `profile_id` NOT verified in payload
- ❌ Response status: NOT CAPTURED
- ✅ No error toast detected

**Network Requests After Clicking Send:**
```
(NO ADDITIONAL POST REQUESTS CAPTURED)
```

**Status:** ❌ FAIL - Unable to complete verification

**Screenshot Evidence:**
- `09-before-send.png` - Form filled, ready to send
- `12-final.png` - Modal still open after clicking Send (indicates validation failure)

---

## Technical Issues Encountered

### Issue 1: Compose Form Structure Ambiguity
**Problem:** The compose modal does NOT have a separate subject input field as expected.

**Observations:**
1. Form shows "Subject" label, but no dedicated `<input>` field for subject
2. Only visible input: Rich text editor (`[contenteditable="true"]`)
3. When attempting to fill "subject", it was misinterpreted as a contact in the To field
   - Evidence: Network request `GET /contacts/?search=Autonomous+Test+-+Profile+ID+Verification`

**Hypothesis:** The rich text editor may handle BOTH subject and body (e.g., first line = subject)

---

### Issue 2: Send Button Disabled State
**Problem:** Send button remained disabled even after filling all visible fields

**Evidence:**
- Playwright error: "element is not enabled" (repeated 57+ times)
- Required force click: `sendButton.click({ force: true })`

**Possible Causes:**
1. Form validation failed (required field missing)
2. Subject not properly filled
3. React state not updated correctly
4. Frontend bug preventing submission

---

### Issue 3: No Network Request Captured
**Problem:** No `/send-email` request was captured after clicking Send

**Evidence:**
- Modal remained open (screenshot `12-final.png`)
- No POST requests in network log after Send click
- Network listener configured to capture:
  - `/send-email`
  - `/communications` (POST)
  - All `/api/` requests

**Possible Causes:**
1. Form validation prevented submission (most likely)
2. JavaScript error preventing request
3. Send button click didn't trigger handler
4. Request endpoint is different than expected

---

## Test Execution History

| Test Version | Phase 2 | Phase 3 | Phase 4 | Notes |
|--------------|---------|---------|---------|-------|
| v1 (conversation reply) | ✅ | ❌ | ❌ | Conversation didn't open |
| v2 (improved selectors) | ✅ | ❌ | ❌ | Conversation clicked but not opened |
| v3 (Compose Email button) | ✅ | ⚠️ | ❌ | To/Message fields not found |
| v4 (correct selectors) | ✅ | ✅ | ❌ | Subject filled in To field by mistake |
| v5 (subject in editor) | ✅ | ✅ | ❌ | Send button disabled |
| v6 (force click) | ✅ | ✅ | ❌ | Click worked but no network request |

---

## Manual Testing Recommendation

**Given the technical blockers in autonomous testing, manual testing is required to:**

1. **Understand the compose form behavior:**
   - How is subject supposed to be entered?
   - Is there a hidden field?
   - Is the rich text editor multi-purpose?

2. **Verify the email send flow:**
   - Manually compose and send an email
   - Open browser DevTools Network tab
   - Capture the actual `/send-email` request
   - Inspect request payload for `profile_id`

3. **Check for validation errors:**
   - Are there any console errors?
   - Are there validation messages not visible in screenshots?

---

## What We Know So Far

### ✅ Confirmed Working:
1. Email profiles API endpoint: `GET /api/v1/email-profiles/my-profiles`
2. User has default profile: `admin@mg.senovallc.com`
3. Profile is fetched when compose modal opens
4. From field shows correct profile
5. Inbox page loads correctly

### ❓ Unknown:
1. Does the send-email request include `profile_id`?
2. What is the correct endpoint: `/send-email` or `/communications/send`?
3. How should subject be entered in the compose form?
4. Why is Send button disabled after filling fields?

---

## Next Steps

### Option 1: Manual Verification (RECOMMENDED)
1. Login to https://crm.senovallc.com
2. Navigate to Inbox
3. Click "Compose Email"
4. Open DevTools Network tab
5. Fill form and click Send
6. Capture `/send-email` request payload
7. Verify `profile_id` is present

**Expected Payload:**
```
Content-Disposition: form-data; name="profile_id"

[UUID of admin@mg.senovallc.com profile]
```

### Option 2: Backend Log Verification
Since frontend testing is blocked, verify backend received `profile_id`:

1. SSH to production server:
   ```bash
   ssh -i "C:\Users\jwood\.ssh\id_ed25519_sonovallc" deploy@178.156.181.73
   ```

2. Check FastAPI logs:
   ```bash
   cd ~/senova-crm
   docker compose logs backend | grep "send-email" | tail -50
   ```

3. Look for log entry showing `profile_id` in request data

### Option 3: Frontend Code Review
Review the compose email component to understand:
- Where is `profile_id` added to the request?
- What is the actual API endpoint?
- What is the expected form structure?

**File to check:** `context-engineering-intro/frontend/src/components/inbox/ComposeEmail.tsx` (or similar)

---

## Test Artifacts

### Screenshots
All screenshots saved to: `screenshots/inbox-email-verification-autonomous/`

**Key Screenshots:**
- `03-inbox-loaded.png` - Inbox with profile loaded
- `05-compose-modal-opened.png` - Compose form (empty)
- `09-before-send.png` - Form filled (subject+message in editor)
- `12-final.png` - After clicking Send (modal still open)

### Test Results JSON
- `inbox-email-verification-final-results.json`
- `inbox-send-final-results.json`
- `inbox-send-correct-results.json`
- `inbox-verification-success.json`

### Test Scripts
- `test-inbox-email-verification-autonomous.mjs`
- `test-inbox-email-verification-v2.mjs`
- `test-inbox-compose-email-v3.mjs`
- `test-inbox-final-autonomous.mjs`
- `test-inbox-send-final.mjs`
- `test-inbox-send-correct.mjs`
- `test-inbox-SUCCESS.mjs`

---

## Conclusion

Automated verification of the `profile_id` fix **could not be completed** due to technical issues with the compose email form. However, **Phase 2 confirmation shows that the email profile IS being fetched correctly** when the compose modal opens.

The critical question remains: **Does the send-email request include profile_id?**

**Recommended Action:** Perform manual testing with browser DevTools to capture the actual network request and verify `profile_id` is in the payload.

---

## Appendix: Network Requests Logged

### During Inbox Load:
```
GET /api/v1/communications/inbox/threads
GET /api/v1/email-profiles/my-profiles  ← Profile fetched
```

### During Compose Modal Open:
```
GET /api/v1/email-profiles/my-profiles  ← Profile fetched again
GET /api/v1/email-templates
```

### During To Field Autocomplete:
```
GET /api/v1/contacts/?search=john.test%40example.com
```

### After Clicking Send:
```
(NO REQUESTS CAPTURED - VALIDATION LIKELY FAILED)
```

---

**Report Generated:** 2025-12-06
**Test Framework:** Playwright 1.57.0
**Browser:** Chromium (headless: false)
**Test Duration:** ~2 minutes per test run
**Total Test Runs:** 7 attempts
