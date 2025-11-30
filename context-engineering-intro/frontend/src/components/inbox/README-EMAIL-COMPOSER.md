# Email Composer Component

## Overview

The `EmailComposer` component is a full-featured email composition UI with support for multiple recipients, CC/BCC fields, rich text editing, and file attachments.

## Features

- **To Field**: Required field for primary recipients
  - Tag-based input (multiple email addresses)
  - Email validation
  - Add emails via Enter key, comma, or blur
  - Remove emails by clicking X or backspace on empty input

- **CC Field**: Optional field (toggleable)
  - Same tag-based interface as To field
  - Can be hidden/shown via button
  - Clears when hidden

- **BCC Field**: Optional field (toggleable)
  - Same tag-based interface as To field
  - Can be hidden/shown via button
  - Clears when hidden

- **Subject Field**: Required text input for email subject

- **Rich Text Editor**: TipTap-powered WYSIWYG editor
  - Bold, Italic formatting
  - Bullet and numbered lists
  - Undo/Redo support
  - Clean, professional toolbar

- **File Attachments**:
  - Support for images, PDFs, documents (max 10MB each)
  - Visual file preview with icons
  - Remove individual files
  - File type and size validation

## Usage

### Basic Usage

```tsx
import { EmailComposer } from '@/components/inbox/email-composer'

function MyComponent() {
  const handleSend = (data) => {
    console.log('Sending email:', data)
    // data contains: { to, cc, bcc, subject, message, files? }
  }

  return (
    <EmailComposer
      onSend={handleSend}
      disabled={false}
    />
  )
}
```

### Pre-populated Reply

```tsx
<EmailComposer
  onSend={handleSend}
  defaultTo={['recipient@example.com']}
  defaultSubject="Re: Previous Subject"
/>
```

### In a Dialog (as used in Inbox)

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmailComposer } from '@/components/inbox/email-composer'

function InboxPage() {
  const [open, setOpen] = useState(false)

  const handleSend = async (data) => {
    // Send email via API
    await sendEmailAPI(data)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <EmailComposer onSend={handleSend} />
      </DialogContent>
    </Dialog>
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSend` | `(data: EmailData) => void` | Yes | Callback when email is sent |
| `disabled` | `boolean` | No | Disable all inputs and send button |
| `defaultTo` | `string[]` | No | Pre-populate To field |
| `defaultSubject` | `string` | No | Pre-populate subject field |

### EmailData Type

```typescript
interface EmailData {
  to: string[]           // Required: at least one recipient
  cc: string[]           // Optional: CC recipients
  bcc: string[]          // Optional: BCC recipients
  subject: string        // Required: email subject
  message: string        // Required: HTML content from rich text editor
  files?: File[]         // Optional: attached files
}
```

## Validation

The component validates:
- Email addresses using regex pattern
- At least one recipient in To field
- Non-empty subject
- Non-empty message body
- File types (images, PDFs, Word docs, text files)
- File size (max 10MB per file)
- Duplicate email addresses (prevented)

## Keyboard Shortcuts

- **Enter** or **Comma**: Add email address to current field
- **Backspace** (on empty input): Remove last email tag
- **Ctrl+B**: Bold text in editor
- **Ctrl+I**: Italic text in editor
- **Ctrl+Z**: Undo in editor
- **Ctrl+Y**: Redo in editor

## Design Decisions

1. **Tag-based input**: More user-friendly than plain text input for multiple emails
2. **Toggleable CC/BCC**: Reduces clutter for simple emails, available when needed
3. **Rich text editor**: Professional email composition with formatting
4. **File validation**: Prevents errors and ensures supported file types
5. **Inline validation**: Immediate feedback on invalid emails

## Integration with Backend

The component is UI-only. Backend integration requires:

1. **Send Email API**: Endpoint that accepts To, CC, BCC, subject, body (HTML), and attachment URLs
2. **File Upload**: Use existing `communicationsApi.uploadFiles()` to upload files first, then include URLs in email data
3. **Contact lookup**: Optional autocomplete for email addresses from contacts database

## Future Enhancements (Phase 5+)

- Email address autocomplete from contacts
- Email templates
- Signature support
- Scheduled sending
- Save as draft
- Reply/Forward modes with quoted text
- Inline image embedding
