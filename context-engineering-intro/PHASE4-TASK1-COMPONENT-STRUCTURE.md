# EmailComposer Component Structure

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                     Compose New Email                       │  <- Dialog Title
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  To:  [recipient@example.com] [x]  [___input___]  [Cc][Bcc]│  <- To field with tags
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Cc:  [cc@example.com] [x]  [___input___]           [x]    │  <- CC field (toggleable)
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Bcc: [bcc@example.com] [x]  [___input___]          [x]    │  <- BCC field (toggleable)
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Subject: [_______________________________]                 │  <- Subject input
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [📎 image.png x] [📄 document.pdf x]                      │  <- File attachments
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [B] [I] | [•] [1.] | [↶] [↷]                         │ │  <- Rich text toolbar
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                       │ │
│  │  Compose your email...                               │ │  <- Rich text editor
│  │                                                       │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [📎]                                     [Send Email]      │  <- Actions
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
EmailComposer
├── To Field Section
│   ├── Label: "To:"
│   ├── Email Tags (Badge components)
│   │   └── Remove button (X)
│   ├── Text Input (for new emails)
│   └── Action Buttons
│       ├── "Cc" toggle button
│       └── "Bcc" toggle button
│
├── CC Field Section (conditional)
│   ├── Label: "Cc:"
│   ├── Email Tags (Badge components)
│   │   └── Remove button (X)
│   ├── Text Input (for new emails)
│   └── Close button (X)
│
├── BCC Field Section (conditional)
│   ├── Label: "Bcc:"
│   ├── Email Tags (Badge components)
│   │   └── Remove button (X)
│   ├── Text Input (for new emails)
│   └── Close button (X)
│
├── Subject Field
│   └── Input component
│
├── File Attachments Section (conditional)
│   └── File Preview Cards
│       ├── File Icon (Image/Document)
│       ├── File Name
│       └── Remove button (X)
│
├── Rich Text Editor
│   ├── Toolbar
│   │   ├── Bold button
│   │   ├── Italic button
│   │   ├── Bullet list button
│   │   ├── Numbered list button
│   │   ├── Undo button
│   │   └── Redo button
│   └── Editor Content (TipTap)
│
└── Action Bar
    ├── File input (hidden)
    ├── Attach button (📎)
    ├── Spacer
    └── Send button
```

## State Management

```typescript
// Email recipient states
const [to, setTo] = useState<string[]>([])
const [cc, setCc] = useState<string[]>([])
const [bcc, setBcc] = useState<string[]>([])

// Visibility states
const [showCc, setShowCc] = useState(false)
const [showBcc, setShowBcc] = useState(false)

// Content states
const [subject, setSubject] = useState('')
const [message, setMessage] = useState('')
const [selectedFiles, setSelectedFiles] = useState<File[]>([])

// Input buffer states (for email entry)
const [toInput, setToInput] = useState('')
const [ccInput, setCcInput] = useState('')
const [bccInput, setBccInput] = useState('')
```

## User Interaction Flow

### Adding an Email Address

```
1. User types email in input field
2. User presses Enter, comma, or tabs away
   ├─> Validate email format
   ├─> Check for duplicates
   ├─> Add to email list (to/cc/bcc)
   └─> Clear input field
```

### Removing an Email Address

```
Option 1: Click X button on tag
  └─> Remove from email list

Option 2: Backspace on empty input
  └─> Remove last email from list
```

### Toggling CC/BCC

```
Showing:
  Click "Cc" button
  └─> setShowCc(true)
  └─> Render CC field section

Hiding:
  Click X on CC field
  ├─> setShowCc(false)
  ├─> Clear CC list
  └─> Clear CC input
```

### Attaching Files

```
1. Click paperclip button
2. File picker opens
3. User selects files
4. For each file:
   ├─> Validate file type
   ├─> Validate file size (<10MB)
   └─> Add to selectedFiles or show error
5. Display file previews
```

### Sending Email

```
1. Click "Send Email" button
2. Validate:
   ├─> At least one recipient in To
   ├─> Non-empty subject
   └─> Non-empty message
3. Call onSend callback with data:
   {
     to: string[],
     cc: string[],
     bcc: string[],
     subject: string,
     message: string (HTML),
     files?: File[]
   }
4. Reset form state
```

## Props Interface

```typescript
interface EmailComposerProps {
  onSend: (data: {
    to: string[]
    cc: string[]
    bcc: string[]
    subject: string
    message: string
    files?: File[]
  }) => void
  disabled?: boolean
  defaultTo?: string[]
  defaultSubject?: string
}
```

## Key Functions

```typescript
// Email management
addEmail(email, list, setList)        // Add email to a list
removeEmail(email, list, setList)     // Remove email from a list
handleEmailKeyDown(...)               // Handle Enter/comma/backspace
handleEmailBlur(...)                  // Add email on blur

// File management
handleFileSelect(e)                   // Validate and add files
removeFile(index)                     // Remove a file

// Form submission
handleSubmit(e)                       // Validate and send email
```

## Integration Example (from inbox/page.tsx)

```tsx
// 1. Import
import { EmailComposer } from '@/components/inbox/email-composer'

// 2. State
const [composeDialogOpen, setComposeDialogOpen] = useState(false)

// 3. Handler
const handleSendComposedEmail = async (data) => {
  // Upload files
  let mediaUrls = undefined
  if (data.files?.length > 0) {
    mediaUrls = await communicationsApi.uploadFiles(data.files)
  }

  // Send email via API
  await sendEmailAPI({
    to: data.to,
    cc: data.cc,
    bcc: data.bcc,
    subject: data.subject,
    body: data.message,
    media_urls: mediaUrls
  })

  // Close dialog
  setComposeDialogOpen(false)
}

// 4. UI
<Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
  <DialogTrigger asChild>
    <Button>
      <PenSquare className="mr-2 h-4 w-4" />
      Compose Email
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Compose New Email</DialogTitle>
    </DialogHeader>
    <EmailComposer
      onSend={handleSendComposedEmail}
      disabled={false}
    />
  </DialogContent>
</Dialog>
```

## File Locations

```
context-engineering-intro/
└── frontend/
    └── src/
        ├── components/
        │   └── inbox/
        │       ├── email-composer.tsx           <- Main component
        │       ├── rich-text-editor.tsx         <- Reused from existing
        │       ├── message-composer.tsx         <- Existing (reply)
        │       └── README-EMAIL-COMPOSER.md     <- Documentation
        │
        └── app/
            └── (dashboard)/
                └── dashboard/
                    └── inbox/
                        └── page.tsx             <- Integration example
```

## Dependencies Used

- React hooks: useState, useRef, useEffect
- UI Components: Button, Input, Badge (shadcn/ui)
- Icons: Lucide React (Send, Paperclip, X, etc.)
- Rich Text: TipTap React + Starter Kit
- Utilities: cn() from lib/utils

## Browser Compatibility

- Modern browsers with ES6+ support
- React 19
- Next.js 15
- Works on desktop and tablet (responsive)
