# INBOX EMAIL SEND PRODUCTION TEST - PROFILE_ID FIX VERIFICATION

## Test Information
- **Date:** 2025-12-06
- **Production URL:** https://crm.senovallc.com
- **Purpose:** Verify that inbox email sending includes `profile_id` parameter and no longer shows "No email profile selected" error

---

## AUTOMATED TEST (Currently Running)

A Playwright test is running in the background. Follow these steps:

### Step 1: Login Manually
1. A Chrome browser window should have opened automatically
2. Navigate to https://crm.senovallc.com/login if not already there
3. Login with your credentials:
   - Email: james@senovallc.com
   - Password: Senova2024!
4. After successful login, return to the terminal and **press Enter** to continue the test

### Step 2: Watch the Automated Test
The test will automatically:
- Navigate to /dashboard/inbox
- Click on an email conversation
- Type a test message
- Click Send
- Capture the network request
- Verify profile_id is included

### Step 3: Review Results
After the test completes, press Enter again to close the browser.

---

## MANUAL VERIFICATION CHECKLIST

If you prefer to test manually or need to verify the automated results, follow these steps:

### Pre-Test Setup
- [ ] Open Chrome DevTools (F12)
- [ ] Navigate to Network tab
- [ ] Filter by "send-email" to see only relevant requests
- [ ] Keep Console tab visible to watch for errors

### Test Steps

#### 1. Login
- [ ] Navigate to https://crm.senovallc.com/login
- [ ] Enter email: james@senovallc.com
- [ ] Enter password: Senova2024!
- [ ] Click "Sign in"
- [ ] Verify successful redirect to dashboard

#### 2. Navigate to Inbox
- [ ] Click "Inbox" in the sidebar navigation
- [ ] URL should be: https://crm.senovallc.com/dashboard/inbox
- [ ] Wait for inbox to load

#### 3. Open Email Conversation
- [ ] Click on any existing email conversation from the list
- [ ] The conversation details should appear on the right
- [ ] Scroll to bottom to find the message composer

#### 4. Compose Test Message
- [ ] In the message text area, type: "Test email - verifying profile_id fix"
- [ ] (Optional) Add a small attachment to test full functionality

#### 5. CRITICAL: Monitor Network Request
- [ ] Ensure Network tab is open in DevTools
- [ ] Click the "Send" button
- [ ] **IMMEDIATELY** check the Network tab for the request

#### 6. Verify Request Contains profile_id
In the Network tab, find the `send-email` request and check:

- [ ] Request URL: `https://crm.senovallc.com/api/v1/inbox/send-email`
- [ ] Request Method: `POST`
- [ ] Click on the request to view details
- [ ] Go to "Payload" or "Request" tab
- [ ] Verify FormData includes: **`profile_id: 1`** (or another number)

**CRITICAL CHECK:**
```
Form Data should look like:
------WebKitFormBoundary...
Content-Disposition: form-data; name="profile_id"

1
------WebKitFormBoundary...
Content-Disposition: form-data; name="thread_id"

...
```

#### 7. Verify Response
- [ ] Response Status: **200 OK** (NOT 400 Bad Request)
- [ ] Response Body: Check for success message
- [ ] No error toast appears saying "No email profile selected"
- [ ] Success toast appears (green notification)

#### 8. Verify Backend Logs
Open a terminal and SSH to production server:

```bash
ssh -i "C:\Users\jwood\.ssh\id_ed25519_sonovallc" deploy@178.156.181.73
```

Then check backend logs:

```bash
docker logs senova_crm_backend --tail=50 2>&1 | grep -i 'sending email\|profile\|mailgun'
```

Look for:
- [ ] Log line: "Sending email from admin@mg.senovallc.com"
- [ ] No error messages about missing profile_id
- [ ] Mailgun API call logged

---

## SUCCESS CRITERIA

### PASS Criteria (All must be true):
- ✅ Network request includes `profile_id` in FormData
- ✅ Response status is 200 OK
- ✅ No "No email profile selected" error toast
- ✅ Success toast appears
- ✅ Backend logs show successful email send
- ✅ No console errors in browser
- ✅ Email appears in sent items (if visible in UI)

### FAIL Criteria (Any of these = FAIL):
- ❌ Network request missing `profile_id` parameter
- ❌ Response status is 400 Bad Request
- ❌ Error toast: "No email profile selected"
- ❌ Console errors related to email sending
- ❌ Backend logs show "profile_id is required" error

---

## EXPECTED RESULTS

### Before Fix (Old Behavior):
```
Network Request: POST /api/v1/inbox/send-email
FormData:
  - thread_id: 123
  - message: "test"
  - (profile_id MISSING!)

Response: 400 Bad Request
Error: "No email profile selected. Please choose a profile."
```

### After Fix (Expected Behavior):
```
Network Request: POST /api/v1/inbox/send-email
FormData:
  - profile_id: 1                    <-- NOW INCLUDED!
  - thread_id: 123
  - message: "test"
  - attachments: []

Response: 200 OK
Success: Email sent successfully
```

---

## TROUBLESHOOTING

### If profile_id is still missing:
1. Check that the frontend code change was deployed
2. Verify the email compose form is using the updated component
3. Check browser cache - do a hard refresh (Ctrl+Shift+R)
4. Inspect the form to see if profile selector is visible

### If getting 400 Bad Request:
1. Check backend logs for exact error message
2. Verify email profile exists in database (profile_id=1)
3. Check Mailgun configuration in email profile

### If email doesn't send despite 200 OK:
1. Check backend logs for Mailgun API errors
2. Verify Mailgun domain is verified
3. Check Mailgun API key is correct

---

## SCREENSHOTS TO CAPTURE

For documentation purposes, capture these screenshots:

1. **Network Request with profile_id**
   - DevTools Network tab showing FormData with profile_id
   - File: `network-request-with-profile-id.png`

2. **200 OK Response**
   - DevTools showing 200 status
   - File: `response-200-ok.png`

3. **Success Toast**
   - Green notification showing "Email sent"
   - File: `success-toast.png`

4. **Backend Logs**
   - Terminal showing successful email send logs
   - File: `backend-logs-success.png`

---

## TEST RESULTS

Fill in after testing:

**Test Date:** _______________
**Tester:** _______________
**Test Environment:** Production (crm.senovallc.com)

### Results:
- [ ] PASS - profile_id included in request
- [ ] PASS - 200 OK response received
- [ ] PASS - No error toast appeared
- [ ] PASS - Success toast appeared
- [ ] PASS - Backend logs confirm send
- [ ] FAIL - (specify reason): _______________________

### Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

### Screenshot Locations:
- Network request: _______________________________________
- Response: _______________________________________
- Toast: _______________________________________
- Backend logs: _______________________________________

---

## NEXT STEPS

### If Test PASSES:
1. Document the fix as verified in production
2. Close related tickets/issues
3. Update status: "Inbox email send fix VERIFIED in production"

### If Test FAILS:
1. Document exact failure mode
2. Check if fix was properly deployed
3. Review code changes in production
4. May need to redeploy or investigate further
5. Check if there are multiple email compose forms (some may not have the fix)

---

## RELATED FILES

**Frontend Code:**
- `context-engineering-intro/frontend/src/components/inbox/EmailCompose.tsx`
- Should include: `profile_id` in FormData when calling send-email API

**Backend Code:**
- `context-engineering-intro/backend/app/api/v1/endpoints/inbox.py`
- Should accept `profile_id` parameter and use it

**Recent Fix Commit:**
- Check git log for recent commits related to inbox email sending

---

## CONTACT

If you need assistance or have questions:
- Review backend logs for detailed error messages
- Check browser console for frontend errors
- Verify Mailgun dashboard for delivery status
