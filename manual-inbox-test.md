# MANUAL INBOX EMAIL SEND TEST - QUICK GUIDE

## What We're Testing
Verifying that the inbox email compose form now includes `profile_id` when sending emails, fixing the "No email profile selected" error.

---

## QUICK TEST (5 Minutes)

### Setup
1. Open Chrome browser
2. Open DevTools (F12)
3. Click on **Network** tab
4. Click on **Console** tab (keep both visible)

### Step 1: Login
1. Go to: https://crm.senovallc.com/login
2. Login with:
   - Email: james@senovallc.com
   - Password: Senova2024!

### Step 2: Go to Inbox
1. Click "Inbox" in sidebar
2. URL should be: `https://crm.senovallc.com/dashboard/inbox`

### Step 3: Open a Conversation
1. Click on any email conversation in the list
2. Scroll to bottom of the conversation

### Step 4: Send Test Email
1. In the message box, type: "Test - verifying fix"
2. **BEFORE clicking Send:** Make sure Network tab is visible
3. Click **Send** button

### Step 5: CHECK THE NETWORK REQUEST
In the Network tab, you should see a request to `send-email`:

1. Click on the `send-email` request
2. Go to **Payload** or **Headers** tab
3. Scroll down to **Form Data** section

**CRITICAL CHECK:**
Look for this line:
```
profile_id: 1
```

### Step 6: CHECK THE RESPONSE
Still in that same request:
1. Click on **Response** tab
2. Status should be: **200** (not 400)

### Step 7: CHECK FOR ERRORS
1. Look at browser page - any error toasts?
2. Look at Console tab - any red errors?

---

## PASS/FAIL Criteria

### ✅ TEST PASSES IF:
- Network request shows `profile_id: 1` (or another number) in FormData
- Response status is **200**
- No error toast appears
- Email shows as sent in the conversation

### ❌ TEST FAILS IF:
- `profile_id` is **missing** from FormData
- Response status is **400 Bad Request**
- Error toast: "No email profile selected"
- Console shows errors

---

## What to Screenshot

Take these 2 screenshots:

1. **Network tab showing profile_id in FormData**
   - Save as: `profile-id-in-request.png`

2. **Response showing 200 status**
   - Save as: `200-response.png`

---

## Report Results

After testing, reply with:
- PASS or FAIL
- Screenshot of the FormData showing profile_id (or missing)
- Any error messages you saw

---

## Why This Matters

**Before fix:**
- FormData had no `profile_id`
- Backend rejected request with 400 error
- User saw: "No email profile selected"

**After fix:**
- FormData includes `profile_id: 1`
- Backend accepts request with 200 OK
- Email sends successfully
