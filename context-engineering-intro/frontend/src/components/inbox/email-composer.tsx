'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, Paperclip, X, Image as ImageIcon, FileText, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { RichTextEditor } from './rich-text-editor'
import { ContactSelector } from './contact-selector'
import { EmailPreviewDialog } from './email-preview-dialog'
import { useAuth } from '@/contexts/auth-context'
import { contactsApi } from '@/lib/queries/contacts'
import { emailTemplatesApi } from '@/lib/queries/email-templates'
import { emailProfilesApi, type AssignedProfile } from '@/lib/api/email-profiles'
import { Contact, EmailTemplate, Paginated } from '@/types'
import { cn } from '@/lib/utils'

interface EmailComposerProps {
  onSend: (data: {
    to: string[]
    cc: string[]
    bcc: string[]
    subject: string
    message: string
    files?: File[]
    profileId?: string
  }) => void
  disabled?: boolean
  defaultTo?: string[] // Pre-populate To field (e.g., for replies)
  defaultSubject?: string // Pre-populate subject (e.g., for Re: replies)
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
  'image/heic',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

export function EmailComposer({ onSend, disabled, defaultTo = [], defaultSubject = '' }: EmailComposerProps) {
  const [to, setTo] = useState<string[]>(defaultTo)
  const [cc, setCc] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [subject, setSubject] = useState(defaultSubject)
  const [message, setMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewContact, setPreviewContact] = useState<Contact | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  // Email profile state
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [assignedProfiles, setAssignedProfiles] = useState<AssignedProfile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)

  // Get current user for preview
  const { user } = useAuth()

  // Fetch user's assigned email profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      setProfilesLoading(true)
      try {
        const profiles = await emailProfilesApi.getMyProfiles()
        setAssignedProfiles(profiles)
        // Auto-select default profile if available
        const defaultProfile = profiles.find(p => p.is_default)
        if (defaultProfile) {
          setSelectedProfileId(defaultProfile.id)
        } else if (profiles.length > 0) {
          setSelectedProfileId(profiles[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch email profiles:', error)
        setAssignedProfiles([])
      } finally {
        setProfilesLoading(false)
      }
    }
    fetchProfiles()
  }, [])

  // Input refs for file upload
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch templates
  const { data: templatesData } = useQuery<Paginated<EmailTemplate>>({
    queryKey: ['email-templates'],
    queryFn: async () => {
      return await emailTemplatesApi.getTemplates()
    },
  })

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Allowed: images, PDFs, and documents.`)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 10MB.`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    setSelectedFiles((prev) => [...prev, ...validFiles])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId)

    if (templateId === 'no-template') {
      // Clear fields if "no template" is selected
      setSubject('')
      setMessage('')
      return
    }

    // BUG FIX: Fetch full template data to get body_html (list endpoint doesn't include it)
    try {
      const fullTemplate = await emailTemplatesApi.getTemplate(templateId)
      setSubject(fullTemplate.subject)
      setMessage(fullTemplate.body_html || '')
    } catch (error) {
      console.error('Failed to fetch template:', error)
      // Fallback: use data from list if available
      const template = templatesData?.items?.find((t) => t.id === templateId)
      if (template) {
        setSubject(template.subject)
        // body_html not available in list, leave message empty
        setMessage('')
      }
    }
  }

  const handlePreview = async () => {
    setLoadingPreview(true)
    setPreviewContact(null)

    // If we have a recipient, try to fetch their contact data
    if (to.length > 0) {
      const firstRecipient = to[0]
      try {
        // Search for contact by email
        const response = await contactsApi.getContacts({
          search: firstRecipient,
          page_size: 1,
        })

        if (response.items && response.items.length > 0) {
          // Find contact with matching email
          const matchingContact = response.items.find(
            contact => contact.email?.toLowerCase() === firstRecipient.toLowerCase()
          )
          if (matchingContact) {
            setPreviewContact(matchingContact)
          }
        }
      } catch (error) {
        console.error('Failed to fetch contact for preview:', error)
        // Continue with preview anyway, just without contact data
      }
    }

    setLoadingPreview(false)
    setShowPreview(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (assignedProfiles.length > 0 && !selectedProfileId) {
      alert('Please select a sending profile')
      return
    }

    if (to.length === 0) {
      alert('Please add at least one recipient in the "To" field')
      return
    }

    if (!subject?.trim()) {
      alert('Please enter a subject')
      return
    }

    if (!message?.trim() || message === '<p></p>') {
      alert('Please enter a message')
      return
    }

    onSend({
      to,
      cc,
      bcc,
      subject,
      message,
      files: selectedFiles.length > 0 ? selectedFiles : undefined,
      profileId: selectedProfileId || undefined
    })

    // Reset form
    setTo([])
    setCc([])
    setBcc([])
    setShowCc(false)
    setShowBcc(false)
    setSubject('')
    setMessage('')
    setSelectedFiles([])
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-3 bg-white">
      {/* From Profile Selector */}
      <div className="space-y-1">
        <Label htmlFor="from-profile" className="text-xs text-muted-foreground">
          From
        </Label>
        {profilesLoading ? (
          <div className="text-sm text-muted-foreground py-2">Loading profiles...</div>
        ) : assignedProfiles.length === 0 ? (
          <div className="text-sm text-destructive py-2">
            No sending profiles available. Contact your administrator.
          </div>
        ) : (
          <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
            <SelectTrigger id="from-profile" disabled={disabled}>
              <SelectValue placeholder="Select sending profile" />
            </SelectTrigger>
            <SelectContent>
              {assignedProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.display_name} &lt;{profile.email_address}&gt;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* To Field with Contact Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <ContactSelector
              selectedContacts={to}
              onContactsChange={setTo}
              disabled={disabled}
              placeholder="Search contacts or enter email (comma or enter to add)"
              label="To:"
            />
          </div>
          <div className="flex gap-2 ml-2">
            {!showCc && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(true)}
                className="text-xs h-7"
              >
                Cc
              </Button>
            )}
            {!showBcc && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(true)}
                className="text-xs h-7"
              >
                Bcc
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* CC Field (toggleable) */}
      {showCc && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ContactSelector
              selectedContacts={cc}
              onContactsChange={setCc}
              disabled={disabled}
              placeholder="Search contacts or enter CC email"
              label="Cc:"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowCc(false)
              setCc([])
            }}
            className="text-xs h-7"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* BCC Field (toggleable) */}
      {showBcc && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ContactSelector
              selectedContacts={bcc}
              onContactsChange={setBcc}
              disabled={disabled}
              placeholder="Search contacts or enter BCC email"
              label="Bcc:"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowBcc(false)
              setBcc([])
            }}
            className="text-xs h-7"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Template Selector */}
      <div className="space-y-1">
        <Label htmlFor="template" className="text-xs text-muted-foreground">
          Select Template (Optional)
        </Label>
        <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
          <SelectTrigger id="template" disabled={disabled}>
            <SelectValue placeholder="Choose a template or write custom" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-template">Custom (No Template)</SelectItem>
            {templatesData?.items?.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} - {template.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject Field */}
      <div className="border-b pb-2">
        <Input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={disabled}
          className="w-full border-0 focus-visible:ring-0 px-0"
        />
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
            >
              {file.type.startsWith('image/') ? (
                <ImageIcon className="h-4 w-4 text-primary" />
              ) : (
                <FileText className="h-4 w-4 text-primary" />
              )}
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rich Text Editor for Message Body */}
      <RichTextEditor
        value={message}
        onChange={setMessage}
        placeholder="Compose your email..."
        className="w-full"
      />

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {/* File Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          multiple
          onChange={handleFileSelect}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          disabled={disabled}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach files (images, PDFs, documents - Max 10MB)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {/* Preview Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handlePreview}
          disabled={disabled || !subject?.trim() || !message?.trim() || loadingPreview}
          className="min-w-[100px]"
          data-testid="preview-email-button"
        >
          <Eye className="h-4 w-4 mr-2" />
          {loadingPreview ? 'Loading...' : 'Preview'}
        </Button>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={disabled || to.length === 0 || !subject?.trim() || !message?.trim()}
          className="min-w-[100px]"
        >
          <Send className="h-4 w-4 mr-2" />
          Send Email
        </Button>
      </div>

      {/* Preview Dialog */}
      <EmailPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        subject={subject}
        body={message}
        recipient={previewContact}
        currentUser={user}
      />
    </form>
  )
}
