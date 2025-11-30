# BUG-INBOX-FILTERS - Exact Code Changes

## File 1: Backend Enum
**Path:** `backend/app/models/communication.py`

```python
# Lines 28-35 (BEFORE)
class CommunicationStatus(str, enum.Enum):
    """Status of communication"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    READ = "read"

# Lines 28-35 (AFTER)
class CommunicationStatus(str, enum.Enum):
    """Status of communication"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    READ = "read"
    ARCHIVED = "archived"  # ← ADDED
```

---

## File 2: Frontend TypeScript Types
**Path:** `frontend/src/types/index.ts`

```typescript
// Lines 114-121 (BEFORE)
export enum CommunicationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

// Lines 114-121 (AFTER)
export enum CommunicationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
  ARCHIVED = 'archived',  // ← ADDED
}
```

---

## File 3: Inbox Page UI
**Path:** `frontend/src/app/(dashboard)/dashboard/inbox/page.tsx`

### Change 3A: TabsList Layout (Lines 309-322)

```tsx
// BEFORE
<TabsList className="w-full">
  <TabsTrigger value="all" className="flex-1">
    All
  </TabsTrigger>
  <TabsTrigger value="unread" className="flex-1">
    Unread
  </TabsTrigger>
  <TabsTrigger value="pending" className="flex-1">
    Pending
  </TabsTrigger>
</TabsList>

// AFTER
<TabsList className="w-full grid grid-cols-4">  {/* ← CHANGED: added grid cols */}
  <TabsTrigger value="all" className="flex-1">
    All
  </TabsTrigger>
  <TabsTrigger value="unread" className="flex-1">
    Unread
  </TabsTrigger>
  <TabsTrigger value="read" className="flex-1">  {/* ← NEW */}
    Read
  </TabsTrigger>
  <TabsTrigger value="archived" className="flex-1">  {/* ← NEW */}
    Archived
  </TabsTrigger>
</TabsList>
```

### Change 3B: Unread Filter Logic (Line 341)

```tsx
// BEFORE (Line 341)
conversations.filter((c) => c.status !== 'read')

// AFTER (Line 341)
conversations.filter((c) => c.status !== 'read' && c.status !== 'archived')
```

### Change 3C: Read Filter Content (Lines 347-353) - NEW

```tsx
<TabsContent value="read" className="m-0 h-[calc(100%-60px)]">
  <ConversationList
    conversations={conversations.filter((c) => c.status === 'read')}
    selectedId={selectedConversation?.id}
    onSelect={setSelectedConversation}
  />
</TabsContent>
```

### Change 3D: Archived Filter Content (Lines 355-361) - NEW

```tsx
<TabsContent value="archived" className="m-0 h-[calc(100%-60px)]">
  <ConversationList
    conversations={conversations.filter((c) => c.status === 'archived')}
    selectedId={selectedConversation?.id}
    onSelect={setSelectedConversation}
  />
</TabsContent>
```

### Change 3E: Removed Pending Filter - DELETED

```tsx
// THIS WAS REMOVED (previously lines 344-350)
<TabsContent value="pending" className="m-0 h-[calc(100%-60px)]">
  <ConversationList
    conversations={conversations.filter((c) => c.status === 'pending')}
    selectedId={selectedConversation?.id}
    onSelect={setSelectedConversation}
  />
</TabsContent>
```

---

## Summary of Changes

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `communication.py` | 35 | Addition | Added `ARCHIVED = "archived"` to enum |
| `types/index.ts` | 120 | Addition | Added `ARCHIVED = 'archived'` to enum |
| `inbox/page.tsx` | 309 | Modification | Changed TabsList to 4-column grid |
| `inbox/page.tsx` | 316-321 | Addition | Added "Read" and "Archived" tabs |
| `inbox/page.tsx` | 341 | Modification | Updated Unread filter logic |
| `inbox/page.tsx` | 347-353 | Addition | Added Read filter content |
| `inbox/page.tsx` | 355-361 | Addition | Added Archived filter content |
| `inbox/page.tsx` | ~344-350 | Deletion | Removed Pending filter content |

**Total Lines Changed:** 8 modifications across 3 files
**Total Lines Added:** ~20 new lines
**Total Lines Removed:** ~7 lines (Pending filter)
**Net Change:** +13 lines of code

---

**Implementation Status:** COMPLETE ✅  
**Code Review:** READY  
**Testing:** PENDING (awaiting tester agent)
