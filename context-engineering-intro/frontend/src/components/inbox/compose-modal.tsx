'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EnhancedRichTextEditor } from '@/components/ui/enhanced-rich-text-editor'
import { emailTemplatesApi } from '@/lib/queries/email-templates'
import { EmailTemplate, Paginated } from '@/types'
import { emailProfilesApi, AssignedProfile } from '@/lib/api/email-profiles'
import {
  Send,
  Paperclip,
  X,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  FileText,
  Image as ImageIcon,
  Upload,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComposeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: {
    id: string
    name: string
    emails?: string[]
    phones?: string[]
    hasWebChat?: boolean  // True if contact has initiated web chat
  }
  defaultChannel?: 'email' | 'sms' | 'web_chat'
  defaultSubject?: string
  defaultBody?: string
  onSend: (data: {
    channel: string
    to: string
    cc?: string[]
    bcc?: string[]
    subject?: string
    body: string
    attachments?: File[]
    profileId?: string
  }) => void
}

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB for modal
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]

export function ComposeModal({
  open,
  onOpenChange,
  contact,
  defaultChannel = 'email',
  defaultSubject = '',
  defaultBody = '',
  onSend,
}: ComposeModalProps) {
  const [channel, setChannel] = useState<'email' | 'sms' | 'web_chat'>(defaultChannel === 'web_chat' ? 'web_chat' : defaultChannel)
  const [to, setTo] = useState('')
  const [cc, setCc] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [ccInput, setCcInput] = useState('')
  const [bccInput, setBccInput] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [attachments, setAttachments] = useState<File[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [assignedProfiles, setAssignedProfiles] = useState<AssignedProfile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)

  // Fetch email templates
  const { data: templatesData } = useQuery<Paginated<EmailTemplate>>({
    queryKey: ['email-templates'],
    queryFn: async () => {
      return await emailTemplatesApi.getTemplates()
    },
    enabled: channel === 'email',
  })

  // Initialize 'to' field based on contact and channel
  useEffect(() => {
    if (contact) {
      if (channel === 'email' && contact.emails && contact.emails.length > 0) {
        setTo(contact.emails[0])
      } else if (channel === 'sms' && contact.phones && contact.phones.length > 0) {
        setTo(contact.phones[0])
      } else if (channel === 'web_chat') {
        // For web chat, use contact name as identifier (no phone/email needed)
        setTo(contact.name || 'Contact')
      }
    }
  }, [contact, channel])

  // Fetch user's assigned email profiles when modal opens for email channel
  useEffect(() => {
    if (open && channel === 'email') {
      setProfilesLoading(true)
      emailProfilesApi.getMyProfiles()
        .then((profiles) => {
          setAssignedProfiles(profiles)
          // Auto-select default profile
          const defaultProfile = profiles.find(p => p.is_default)
          if (defaultProfile) {
            setSelectedProfileId(defaultProfile.id)
          } else if (profiles.length > 0) {
            setSelectedProfileId(profiles[0].id)
          }
        })
        .catch((error) => {
          console.error('Failed to load email profiles:', error)
          setAssignedProfiles([])
        })
        .finally(() => {
          setProfilesLoading(false)
        })
    }
  }, [open, channel])

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = templatesData?.items?.find((t) => t.id === templateId)
    if (template) {
      setSubject(template.subject || '')
      setBody(template.body_html || '')
    } else if (templateId === 'no-template') {
      setSubject('')
      setBody('')
    }
  }

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(files).forEach((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type.`)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 25MB).`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    setAttachments((prev) => [...prev, ...validFiles])
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [])

  // Handle adding CC/BCC
  const addCc = () => {
    const email = ccInput.trim()
    if (email && !cc.includes(email)) {
      setCc([...cc, email])
      setCcInput('')
    }
  }

  const addBcc = () => {
    const email = bccInput.trim()
    if (email && !bcc.includes(email)) {
      setBcc([...bcc, email])
      setBccInput('')
    }
  }

  // Handle send
  const handleSend = () => {
    if (!to.trim()) {
      alert('Please enter a recipient')
      return
    }

    // Validate profile selection for email
    if (channel === 'email') {
      if (assignedProfiles.length === 0) {
        alert('No email profiles available. Contact your administrator.')
        return
      }
      if (!selectedProfileId) {
        alert('Please select a sending profile')
        return
      }
      if (!subject.trim()) {
        alert('Please enter a subject')
        return
      }
    }

    if (!body.trim()) {
      alert('Please enter a message')
      return
    }

    onSend({
      channel,
      to: to.trim(),
      cc: channel === 'email' ? cc : undefined,
      bcc: channel === 'email' ? bcc : undefined,
      subject: channel === 'email' ? subject : undefined,
      body,
      attachments: attachments.length > 0 ? attachments : undefined,
      profileId: channel === 'email' ? selectedProfileId : undefined,
    })

    // Reset form
    setTo('')
    setCc([])
    setBcc([])
    setSubject('')
    setBody('')
    setAttachments([])
    setSelectedTemplateId('')
    setShowCc(false)
    setShowBcc(false)
    onOpenChange(false)
  }

  // Get available recipients based on channel
  const getAvailableRecipients = () => {
    if (!contact) return []
    if (channel === 'email') return contact.emails || []
    if (channel === 'sms') return contact.phones || []
    if (channel === 'web_chat') return [contact.name || 'Contact'] // Web chat uses contact name
    return []
  }

  const availableRecipients = getAvailableRecipients()
  // Always show dropdown if there are recipients (even if just 1) - better UX
  const showRecipientDropdown = availableRecipients.length >= 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel Selector */}
          <div className="flex items-center gap-4">
            <Label htmlFor="channel" className="min-w-[80px]">
              Channel
            </Label>
            <Select
              value={channel}
              onValueChange={(value) => setChannel(value as 'email' | 'sms' | 'web_chat')}
            >
              <SelectTrigger id="channel" className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    SMS
                  </div>
                </SelectItem>
                {/* Only show web chat option if contact has initiated web chat */}
                {contact?.hasWebChat && (
                  <SelectItem value="web_chat">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Web Chat
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Template Selector (only for email) */}
            {channel === 'email' && templatesData && (
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-template">No Template</SelectItem>
                  {templatesData.items?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* From Profile Selector (only for email) */}
          {channel === 'email' && (
            <div className="flex items-center gap-4">
              <Label htmlFor="from" className="min-w-[80px]">
                From
              </Label>
              {profilesLoading ? (
                <span className="text-sm text-muted-foreground">Loading profiles...</span>
              ) : assignedProfiles.length === 0 ? (
                <span className="text-sm text-destructive">
                  No sending profiles available. Contact your administrator.
                </span>
              ) : (
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger id="from" className="flex-1">
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
          )}

          {/* To Field */}
          <div className="flex items-center gap-4">
            <Label htmlFor="to" className="min-w-[80px]">
              To
            </Label>
            {showRecipientDropdown ? (
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger id="to" className="flex-1">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {availableRecipients.map((recipient) => (
                    <SelectItem key={recipient} value={recipient}>
                      {recipient}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="to"
                type={channel === 'email' ? 'email' : 'text'}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={
                  channel === 'email' ? 'email@example.com' : '+1234567890'
                }
                className="flex-1"
              />
            )}

            {/* CC/BCC Toggle Buttons (only for email) */}
            {channel === 'email' && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCc(!showCc)}
                  className="text-xs"
                >
                  {showCc ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                  Cc
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBcc(!showBcc)}
                  className="text-xs"
                >
                  {showBcc ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                  Bcc
                </Button>
              </div>
            )}
          </div>

          {/* CC Field (collapsible) */}
          {channel === 'email' && showCc && (
            <div className="flex items-center gap-4">
              <Label htmlFor="cc" className="min-w-[80px]">
                Cc
              </Label>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="cc"
                    type="email"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCc()
                      }
                    }}
                    placeholder="Add email and press Enter"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCc}>
                    Add
                  </Button>
                </div>
                {cc.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {cc.map((email, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => setCc(cc.filter((_, i) => i !== index))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BCC Field (collapsible) */}
          {channel === 'email' && showBcc && (
            <div className="flex items-center gap-4">
              <Label htmlFor="bcc" className="min-w-[80px]">
                Bcc
              </Label>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="bcc"
                    type="email"
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addBcc()
                      }
                    }}
                    placeholder="Add email and press Enter"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addBcc}>
                    Add
                  </Button>
                </div>
                {bcc.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {bcc.map((email, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => setBcc(bcc.filter((_, i) => i !== index))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subject (only for email) */}
          {channel === 'email' && (
            <div className="flex items-center gap-4">
              <Label htmlFor="subject" className="min-w-[80px]">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
                className="flex-1"
              />
            </div>
          )}

          {/* Message Body */}
          <div className="space-y-2">
            <Label>Message</Label>
            {channel === 'email' ? (
              <EnhancedRichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Type your email message..."
                minHeight="300px"
                showAllFeatures={true}
                data-testid="compose-email-editor"
              />
            ) : (
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={channel === 'sms' ? "Type your SMS message..." : "Type your chat message..."}
                className="min-h-[150px] resize-none"
                maxLength={channel === 'sms' ? 1600 : undefined} // SMS character limit
              />
            )}
            {channel === 'sms' && (
              <p className="text-xs text-muted-foreground text-right">
                {body.length}/1600 characters
              </p>
            )}
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-4 text-center transition-colors',
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                multiple
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Images, PDFs, Documents (max 25MB each)
                </p>
              </label>
            </div>

            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm"
                  >
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span className="max-w-[200px] truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)}MB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={channel === 'email' && (assignedProfiles.length === 0 || !selectedProfileId)}
          >
            <Send className="mr-2 h-4 w-4" />
            Send {channel === 'email' ? 'Email' : channel === 'sms' ? 'SMS' : 'Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}