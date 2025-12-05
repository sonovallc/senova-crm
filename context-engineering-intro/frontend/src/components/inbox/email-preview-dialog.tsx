'use client'

import { useState, useEffect } from 'react'
import { Contact } from '@/types'
import { User } from '@/lib/auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Mail, User as UserIcon } from 'lucide-react'
import api from '@/lib/api'

interface EmailPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: string
  body: string
  recipient?: Contact | null
  currentUser?: User | null
}

// Sample data for when no contact is selected
const SAMPLE_DATA = {
  first_name: 'Jane',
  last_name: 'Smith',
  contact_name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '(555) 123-4567',
  company: 'ABC Corporation',
  company_name: 'ABC Corporation',
}

export function EmailPreviewDialog({
  open,
  onOpenChange,
  subject,
  body,
  recipient,
  currentUser,
}: EmailPreviewDialogProps) {
  // State for contact selector
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string>('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(recipient || null)
  const [loadingContacts, setLoadingContacts] = useState(false)

  // Fetch contacts when dialog opens
  useEffect(() => {
    if (open && contacts.length === 0) {
      fetchContacts()
    }
  }, [open])

  // Update selected contact when recipient prop changes
  useEffect(() => {
    if (recipient) {
      setSelectedContact(recipient)
      setSelectedContactId(recipient.id)
    }
  }, [recipient])

  const fetchContacts = async () => {
    setLoadingContacts(true)
    try {
      const response = await api.get('/v1/contacts', {
        params: { limit: 100, offset: 0 }
      })
      const contactsData = response.data?.contacts || response.data?.items || []
      setContacts(contactsData)
    } catch (error) {
      console.error('Failed to fetch contacts for preview:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  const handleContactChange = (contactId: string) => {
    setSelectedContactId(contactId)
    if (contactId === 'sample') {
      setSelectedContact(null)
    } else {
      const contact = contacts.find(c => c.id === contactId)
      setSelectedContact(contact || null)
    }
  }

  // Function to replace variables with actual or sample data
  const replaceVariables = (text: string): string => {
    if (!text) return ''

    let result = text

    // Contact variables - use selectedContact from state instead of recipient prop
    const contactData = selectedContact || SAMPLE_DATA
    result = result.replace(/\{\{first_name\}\}/g, contactData.first_name || SAMPLE_DATA.first_name)
    result = result.replace(/\{\{last_name\}\}/g, contactData.last_name || SAMPLE_DATA.last_name)
    result = result.replace(/\{\{contact_name\}\}/g,
      selectedContact
        ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim()
        : SAMPLE_DATA.contact_name
    )
    result = result.replace(/\{\{email\}\}/g, contactData.email || SAMPLE_DATA.email)
    result = result.replace(/\{\{phone\}\}/g, contactData.phone || SAMPLE_DATA.phone)
    result = result.replace(/\{\{company\}\}/g, contactData.company || SAMPLE_DATA.company)
    result = result.replace(/\{\{company_name\}\}/g, contactData.company || SAMPLE_DATA.company_name)

    // User variables (sender)
    if (currentUser) {
      const userName = currentUser.first_name
        ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
        : currentUser.email
      result = result.replace(/\{\{user_name\}\}/g, userName)
      result = result.replace(/\{\{user_email\}\}/g, currentUser.email)
    } else {
      result = result.replace(/\{\{user_name\}\}/g, 'Your Name')
      result = result.replace(/\{\{user_email\}\}/g, 'your.email@example.com')
    }

    return result
  }

  const previewSubject = replaceVariables(subject)
  const previewBody = replaceVariables(body)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preview
          </DialogTitle>
          <DialogDescription>
            Preview how your email will look with real contact data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Contact Selector */}
          <div className="border-b pb-4">
            <Label htmlFor="preview-contact-selector" className="text-sm font-medium mb-2 block">
              Preview with Contact Data
            </Label>
            <Select
              value={selectedContactId || 'sample'}
              onValueChange={handleContactChange}
              disabled={loadingContacts}
            >
              <SelectTrigger
                id="preview-contact-selector"
                data-testid="preview-contact-selector"
                className="w-full"
              >
                <SelectValue placeholder={loadingContacts ? "Loading contacts..." : "Select a contact"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sample">
                  Sample Data (Jane Smith)
                </SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} - {contact.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContact && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <UserIcon className="h-3 w-3" />
                Previewing for: {selectedContact.first_name} {selectedContact.last_name} ({selectedContact.email})
              </p>
            )}
            {!selectedContact && (
              <p className="text-xs text-amber-600 mt-2">
                Using sample data - select a contact to preview with real data
              </p>
            )}
          </div>
          {/* Subject Line Preview */}
          <div className="border-b pb-3">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-1">
              Subject
            </div>
            <div className="text-base font-semibold">
              {previewSubject || '(No subject)'}
            </div>
          </div>

          {/* Email Body Preview */}
          <div className="border rounded-lg p-4 bg-slate-50 min-h-[200px]">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-3">
              Message Body
            </div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewBody || '<p class="text-muted-foreground">(No message)</p>' }}
            />
          </div>

          {/* Variable Legend */}
          {(subject.includes('{{') || body.includes('{{')) && (
            <div className="border-t pt-3 mt-4">
              <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Variables Replaced
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div><span className="font-mono bg-slate-200 px-1 rounded">{'{{first_name}}'}</span> → {selectedContact?.first_name || SAMPLE_DATA.first_name}</div>
                  <div><span className="font-mono bg-slate-200 px-1 rounded">{'{{last_name}}'}</span> → {selectedContact?.last_name || SAMPLE_DATA.last_name}</div>
                  <div><span className="font-mono bg-slate-200 px-1 rounded">{'{{email}}'}</span> → {selectedContact?.email || SAMPLE_DATA.email}</div>
                  <div><span className="font-mono bg-slate-200 px-1 rounded">{'{{phone}}'}</span> → {selectedContact?.phone || SAMPLE_DATA.phone}</div>
                </div>
                <div className="space-y-1">
                  <div><span className="font-mono bg-slate-200 px-1 rounded">{'{{company}}'}</span> → {selectedContact?.company || SAMPLE_DATA.company}</div>
                  <div><span className="font-mono bg-slate-200 px-1 rounded">{'{{contact_name}}'}</span> → {selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim() : SAMPLE_DATA.contact_name}</div>
                  {currentUser && (
                    <>
                      <div><span className="font-mono bg-slate-200 px-1 rounded">{'{{user_name}}'}</span> → {currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : currentUser.email}</div>
                      <div><span className="font-mono bg-slate-200 px-1 rounded">{'{{user_email}}'}</span> → {currentUser.email}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
