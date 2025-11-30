# BUG-1 QUICK FIX GUIDE
## 60-Second Summary

---

## THE PROBLEM

Inbox "Unread" and "Read" tabs show the same messages because:
- Backend sends: `direction: "inbound"` (lowercase)
- Frontend checks: `direction === 'INBOUND'` (uppercase)
- Result: Comparison fails, messages never get marked as read

---

## THE FIX

**File:** `frontend/src/app/(dashboard)/dashboard/inbox/page.tsx`

**Change this:** `'INBOUND'` → `'inbound'` (lowercase)

**5 Locations:**

```typescript
// Line 315
if (thread.latest_message.direction === 'inbound' && thread.latest_message.status !== 'READ') {

// Line 407
if (conversation.direction === 'inbound' && conversation.status !== 'READ') {

// Line 419
conversations.filter((c) => c.direction === 'inbound' &&

// Line 428
if (conversation.direction === 'inbound' && conversation.status !== 'READ') {

// Line 438
conversations.filter((c) => c.direction === 'inbound' &&
```

**Search & Replace:**
```
Find:    direction === 'INBOUND'
Replace: direction === 'inbound'
```

---

## TEST THE FIX

1. Open inbox: `http://localhost:3000/dashboard/inbox`
2. Click on a message
3. Check database:

```bash
docker exec eve_crm_postgres psql -U evecrm -d eve_crm -c \
  "SELECT direction, status, read_at FROM communications WHERE direction = 'INBOUND' ORDER BY created_at DESC LIMIT 1;"
```

**Expected:** Status should be 'READ' and read_at should have timestamp

4. **Unread tab** should now show only unread messages
5. **Read tab** should show only read messages

---

## ROOT CAUSE

**Backend Enum** (`backend/app/models/communication.py` line 24):
```python
INBOUND = "inbound"  # ← lowercase!
```

**Frontend uses:** `'INBOUND'` (uppercase)

**Mismatch:** `"inbound" === "INBOUND"` → FALSE ❌

---

## CONFIDENCE: 100%

✅ Backend enum confirmed lowercase
✅ Database shows no READ status (mutation never fired)
✅ read_at is NULL (mutation never ran)
✅ Backend logs show no /read endpoint calls
✅ Frontend comparison uses uppercase

---

**Time to Fix:** 2 minutes
**Risk Level:** LOW (simple string change)
**Files Changed:** 1 file, 5 lines

---

For detailed analysis, see:
- `BUG001_DEBUGGER_FINAL_REPORT.md` (complete investigation)
- `BUG001_VISUAL_SUMMARY.md` (visual explanation)
- `BUG001_INBOX_TABS_ROOT_CAUSE_REPORT.md` (technical deep dive)
