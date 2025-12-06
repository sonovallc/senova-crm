'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { contactsApi } from '@/lib/queries/contacts'
import { communicationsApi } from '@/lib/queries/communications'
import { emailTemplatesApi } from '@/lib/queries/email-templates'
import { emailProfilesApi, AssignedProfile } from '@/lib/api/email-profiles'
import { Contact, EmailTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { RichTextEditor } from '@/components/inbox/rich-text-editor'
import { useToast } from '@/hooks/use-toast'
import { formatErrorMessage } from '@/lib/error-handler'
import {
  Send,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  ArrowLeft,
  Loader2,
  ChevronDown,
  FileCode,
  Mail
} from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ApiError = {
  response?: {
    data?: {
      detail?: string
    }
  }
}

export default function ComposeEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateIdParam = searchParams.get('templateId')
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contactSearchOpen, setContactSearchOpen] = useState(false)
  const [toRecipients, setToRecipients] = useState<string[]>([]) // Array of email addresses (from contacts or manual)
  const [toInput, setToInput] = useState('') // Manual email input for "To" field
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [cc, setCc] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [ccInput, setCcInput] = useState('')
  const [bccInput, setBccInput] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [templateSearchOpen, setTemplateSearchOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false)
  const [manualRecipient, setManualRecipient] = useState<string>('')
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [profileSearchOpen, setProfileSearchOpen] = useState(false)

  // Fetch user's assigned email profiles
  const { data: emailProfiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['my-email-profiles'],
    queryFn: () => emailProfilesApi.getMyProfiles(),
  })

  // Auto-select default profile or first available profile
  useEffect(() => {
    if (emailProfiles && emailProfiles.length > 0 && !selectedProfileId) {
      const defaultProfile = emailProfiles.find(p => p.is_default)
      if (defaultProfile) {
        setSelectedProfileId(defaultProfile.id)
      } else {
        setSelectedProfileId(emailProfiles[0].id)
      }
    }
  }, [emailProfiles, selectedProfileId])

  // Fetch contacts for dropdown
  const { data: contactsData, isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts', contactSearch],
    queryFn: () => contactsApi.getContacts({
      search: contactSearch,
      page_size: 50
    }),
  })

  // Fetch email templates
  const { data: templatesData, isLoading: loadingTemplates } = useQuery({
    queryKey: ['email-templates-compose'],
    queryFn: () => emailTemplatesApi.getTemplates({
      page: 1,
      page_size: 100,
    }),
  })

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (email: string) => {
      return contactsApi.createContact({
        email,
        first_name: 'Unknown',
        last_name: '',
        status: 'LEAD',
      })
    },
    onSuccess: (newContact, email) => {
      toast({
        title: 'Contact created',
        description: `Created new contact for ${email}`,
      })
      setSelectedContact(newContact)
      setShowCreateContactDialog(false)
      // Now send the email with the selected profile
      sendEmailMutation.mutate({
        to: toRecipients,
        subject,
        body_html: message,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
        profile_id: selectedProfileId || undefined,
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to create contact',
        description: formatErrorMessage(error) || 'An error occurred while creating the contact',
        variant: 'destructive',
      })
      setShowCreateContactDialog(false)
    },
  })

  // Send email mutation - use sendEmail API with profile_id
  const sendEmailMutation = useMutation({
    mutationFn: async (data: {
      to: string[]
      subject: string
      body_html: string
      cc?: string[]
      bcc?: string[]
      attachments?: File[]
      profile_id?: string
    }) => {
      return communicationsApi.sendEmail({
        to: data.to,
        subject: data.subject,
        body_html: data.body_html,
        cc: data.cc,
        bcc: data.bcc,
        attachments: data.attachments,
        profile_id: data.profile_id,
      })
    },
    onSuccess: () => {
      toast({
        title: 'Email sent successfully',
        description: 'Your email has been sent.',
      })
      // Reset form
      setSelectedContact(null)
      setToRecipients([])
      setToInput('')
      setSubject('')
      setMessage('')
      setCc([])
      setBcc([])
      setSelectedFiles([])
      setShowCc(false)
      setShowBcc(false)
      setSelectedTemplateId('')
      setManualRecipient('')
      // Note: Don't reset selectedProfileId - keep the user's preference
      // Redirect to inbox
      router.push('/dashboard/inbox')
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to send email',
        description: formatErrorMessage(error) || 'An error occurred while sending the email',
        variant: 'destructive',
      })
    },
  })

  // Handle adding email to CC/BCC list
  const addEmail = (email: string, list: string[], setList: (emails: string[]) => void) => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return false

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast({
        title: 'Invalid email',
        description: `Invalid email address: ${trimmedEmail}`,
        variant: 'destructive',
      })
      return false
    }

    if (list.includes(trimmedEmail)) {
      toast({
        title: 'Duplicate email',
        description: `Email already added: ${trimmedEmail}`,
        variant: 'destructive',
      })
      return false
    }

    setList([...list, trimmedEmail])
    return true
  }

  // Handle removing email from list
  const removeEmail = (email: string, list: string[], setList: (emails: string[]) => void) => {
    setList(list.filter(e => e !== email))
  }

  // Handle key press in email input fields
  const handleEmailKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    setInput: (value: string) => void,
    list: string[],
    setList: (emails: string[]) => void
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (addEmail(input, list, setList)) {
        setInput('')
      }
    } else if (e.key === 'Backspace' && input === '' && list.length > 0) {
      setList(list.slice(0, -1))
    }
  }

  // Handle blur on email input fields
  const handleEmailBlur = (
    input: string,
    setInput: (value: string) => void,
    list: string[],
    setList: (emails: string[]) => void
  ) => {
    if (input.trim()) {
      if (addEmail(input, list, setList)) {
        setInput('')
      }
    }
  }

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type`)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      toast({
        title: 'File upload errors',
        description: errors.join(', '),
        variant: 'destructive',
      })
    }

    setSelectedFiles((prev) => [...prev, ...validFiles])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (toRecipients.length === 0) {
      toast({
        title: 'No recipient',
        description: 'Please add at least one recipient (select a contact or type an email address)',
        variant: 'destructive',
      })
      return
    }

    if (!subject?.trim()) {
      toast({
        title: 'No subject',
        description: 'Please enter a subject for the email',
        variant: 'destructive',
      })
      return
    }

    if (!message?.trim() || message === '<p></p>') {
      toast({
        title: 'No message',
        description: 'Please enter a message body',
        variant: 'destructive',
      })
      return
    }

    // Validate email profile is selected
    if (!selectedProfileId) {
      toast({
        title: 'No email profile',
        description: 'Please select an email profile to send from',
        variant: 'destructive',
      })
      return
    }

    // Check if sending to a non-database email (manual recipient)
    // If selectedContact is null but we have recipients, show create contact dialog
    if (!selectedContact && toRecipients.length > 0) {
      setManualRecipient(toRecipients[0])
      setShowCreateContactDialog(true)
      return
    }

    // Send email with selected profile
    sendEmailMutation.mutate({
      to: toRecipients,
      subject,
      body_html: message,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
      profile_id: selectedProfileId,
    })
  }

  // Handle confirming contact creation from dialog
  const handleConfirmCreateContact = () => {
    createContactMutation.mutate(manualRecipient)
  }

  // Handle canceling contact creation
  const handleCancelCreateContact = () => {
    setShowCreateContactDialog(false)
    setManualRecipient('')
  }

  const getContactDisplayName = (contact: Contact) => {
    const name = `${contact.first_name} ${contact.last_name}`.trim()
    if (!name || contact.first_name === 'Unknown') {
      return contact.email || 'Unknown Contact'
    }
    return name
  }

  const getContactEmail = (contact: Contact) => {
    return contact.email || 'No email'
  }

  // Handle selecting a contact from dropdown
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    const email = contact.email
    if (email && !toRecipients.includes(email)) {
      setToRecipients([...toRecipients, email])
    }
    setContactSearchOpen(false)
  }

  // Replace template variables with contact data
  const replaceTemplateVariables = (text: string, contact: Contact | null): string => {
    if (!contact) return text

    let result = text

    // Contact variables
    result = result.replace(/\{\{first_name\}\}/g, contact.first_name || '')
    result = result.replace(/\{\{last_name\}\}/g, contact.last_name || '')
    result = result.replace(/\{\{contact_name\}\}/g, `${contact.first_name || ''} ${contact.last_name || ''}`.trim())
    result = result.replace(/\{\{email\}\}/g, contact.email || '')
    result = result.replace(/\{\{phone\}\}/g, contact.phone || '')
    result = result.replace(/\{\{company\}\}/g, contact.company || '')

    // These would need to come from user context (placeholder for now)
    result = result.replace(/\{\{company_name\}\}/g, 'Senova')
    result = result.replace(/\{\{user_name\}\}/g, 'Your Team')
    result = result.replace(/\{\{user_email\}\}/g, '')

    return result
  }

  // BUG FIX #6: Fetch single template to get body_html (list endpoint doesn't include it)
  const handleUseTemplate = async (template: EmailTemplate) => {
    setTemplateSearchOpen(false)
    setSelectedTemplateId(template.id)

    try {
      // Fetch full template data including body_html
      const fullTemplate = await emailTemplatesApi.getTemplate(template.id)

      // Replace variables in subject and body
      const populatedSubject = replaceTemplateVariables(fullTemplate.subject, selectedContact)
      const populatedBody = replaceTemplateVariables(fullTemplate.body_html || '', selectedContact)

      setSubject(populatedSubject)
      setMessage(populatedBody)

      toast({
        title: 'Template applied',
        description: `"${template.name}" template has been applied to your email.`,
      })
    } catch (error) {
      console.error('Failed to fetch template:', error)
      toast({
        title: 'Failed to apply template',
        description: 'Could not load template content.',
        variant: 'destructive',
      })
    }
  }

  // Handle clearing template selection
  const handleClearTemplate = () => {
    setSelectedTemplateId('')
    setSubject('')
    setMessage('')
    toast({
      title: 'Template cleared',
      description: 'Template selection has been cleared.',
    })
  }

  // Auto-load template from URL parameter
  useEffect(() => {
    if (templateIdParam && templatesData?.items) {
      const template = templatesData.items.find((t) => t.id === templateIdParam)
      if (template) {
        handleUseTemplate(template)
        // Clear the URL parameter after loading
        router.replace('/dashboard/email/compose', { scroll: false })
      }
    }
  }, [templateIdParam, templatesData, router])

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compose Email</h1>
          <p className="text-muted-foreground">Send an email to a contact</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/inbox')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inbox
        </Button>
      </div>

      {/* Compose Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label>Use Template (Optional)</Label>
            <div className="flex gap-2">
              <Popover open={templateSearchOpen} onOpenChange={setTemplateSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 justify-between"
                  >
                    <span className="flex items-center">
                      <FileCode className="mr-2 h-4 w-4" />
                      {selectedTemplateId && templatesData?.items ? (
                        templatesData.items.find(t => t.id === selectedTemplateId)?.name || 'Select a template to get started...'
                      ) : (
                        'Select a template to get started...'
                      )}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search templates..." />
                    <CommandEmpty>
                      {loadingTemplates ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        'No templates found.'
                      )}
                    </CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-auto">
                      {templatesData?.items.map((template) => (
                        <CommandItem
                          key={template.id}
                          value={`${template.name} ${template.category} ${template.subject}`}
                          onSelect={() => handleUseTemplate(template)}
                        >
                          <div className="flex flex-col w-full">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{template.name}</span>
                              {template.is_system && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  System
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {template.subject}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedTemplateId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearTemplate}
                  title="Clear template"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Select a pre-built template to auto-fill the subject and message. Variables will be replaced with contact data.
            </p>
          </div>

          {/* From Profile Selector */}
          <div className="space-y-2">
            <Label>From</Label>
            <Popover open={profileSearchOpen} onOpenChange={setProfileSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  disabled={loadingProfiles}
                >
                  <span className="flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    {loadingProfiles ? (
                      'Loading profiles...'
                    ) : selectedProfileId && emailProfiles ? (
                      (() => {
                        const profile = emailProfiles.find(p => p.id === selectedProfileId)
                        return profile ? `${profile.display_name} <${profile.email_address}>` : 'Select sending profile...'
                      })()
                    ) : emailProfiles && emailProfiles.length === 0 ? (
                      'No email profiles available'
                    ) : (
                      'Select sending profile...'
                    )}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search profiles..." />
                  <CommandEmpty>
                    {loadingProfiles ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      'No email profiles found. Contact your administrator to assign email profiles.'
                    )}
                  </CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-auto">
                    {emailProfiles?.map((profile) => (
                      <CommandItem
                        key={profile.id}
                        value={`${profile.display_name} ${profile.email_address}`}
                        onSelect={() => {
                          setSelectedProfileId(profile.id)
                          setProfileSearchOpen(false)
                        }}
                      >
                        <div className="flex flex-col w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{profile.display_name}</span>
                            {profile.is_default && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {profile.email_address}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {(!emailProfiles || emailProfiles.length === 0) && !loadingProfiles && (
              <p className="text-xs text-destructive">
                No email profiles assigned. Please contact your administrator to set up email sending.
              </p>
            )}
          </div>

          {/* To Field - Contact Selector + Manual Email Entry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>To</Label>
              <Popover open={contactSearchOpen} onOpenChange={setContactSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                  >
                    Select from contacts
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search contacts..."
                      value={contactSearch}
                      onValueChange={setContactSearch}
                    />
                    <CommandEmpty>
                      {loadingContacts ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        'No contacts found.'
                      )}
                    </CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-auto">
                      {contactsData?.items.map((contact) => (
                        <CommandItem
                          key={contact.id}
                          value={`${contact.first_name} ${contact.last_name} ${contact.email}`}
                          onSelect={() => handleSelectContact(contact)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{getContactDisplayName(contact)}</span>
                            <span className="text-xs text-muted-foreground">{getContactEmail(contact)}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-wrap gap-2 rounded-md border p-2">
              {toRecipients.map((email) => (
                <Badge key={email} variant="secondary" className="pl-2 pr-1">
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email, toRecipients, setToRecipients)}
                    className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <input
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyDown={(e) => handleEmailKeyDown(e, toInput, setToInput, toRecipients, setToRecipients)}
                onBlur={() => handleEmailBlur(toInput, setToInput, toRecipients, setToRecipients)}
                placeholder={toRecipients.length === 0 ? "Type email address or select contact..." : "Add another recipient..."}
                className="flex-1 min-w-[200px] outline-none text-sm bg-transparent"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Type an email address and press Enter, or click "Select from contacts" above. You can add multiple recipients.
            </p>
          </div>

          {/* CC/BCC Toggle Buttons */}
          {!showCc || !showBcc ? (
            <div className="flex gap-2">
              {!showCc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(true)}
                >
                  Add Cc
                </Button>
              )}
              {!showBcc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBcc(true)}
                >
                  Add Bcc
                </Button>
              )}
            </div>
          ) : null}

          {/* CC Field */}
          {showCc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cc</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCc(false)
                    setCc([])
                    setCcInput('')
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 rounded-md border p-2">
                {cc.map((email) => (
                  <Badge key={email} variant="secondary" className="pl-2 pr-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email, cc, setCc)}
                      className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) => handleEmailKeyDown(e, ccInput, setCcInput, cc, setCc)}
                  onBlur={() => handleEmailBlur(ccInput, setCcInput, cc, setCc)}
                  placeholder="Add CC recipients (comma or enter to add)"
                  className="flex-1 min-w-[200px] outline-none text-sm bg-transparent"
                />
              </div>
            </div>
          )}

          {/* BCC Field */}
          {showBcc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Bcc</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowBcc(false)
                    setBcc([])
                    setBccInput('')
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 rounded-md border p-2">
                {bcc.map((email) => (
                  <Badge key={email} variant="secondary" className="pl-2 pr-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email, bcc, setBcc)}
                      className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  value={bccInput}
                  onChange={(e) => setBccInput(e.target.value)}
                  onKeyDown={(e) => handleEmailKeyDown(e, bccInput, setBccInput, bcc, setBcc)}
                  onBlur={() => handleEmailBlur(bccInput, setBccInput, bcc, setBcc)}
                  placeholder="Add BCC recipients (comma or enter to add)"
                  className="flex-1 min-w-[200px] outline-none text-sm bg-transparent"
                />
              </div>
            </div>
          )}

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sendEmailMutation.isPending}
            />
          </div>

          {/* Attachments Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm"
                  >
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                    <span className="max-w-[200px] truncate">{file.name}</span>
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
            </div>
          )}

          {/* Message Body */}
          <div className="space-y-2">
            <Label>Message</Label>
            <RichTextEditor
              value={message}
              onChange={setMessage}
              placeholder="Compose your email message..."
              className="min-h-[300px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              {/* File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={sendEmailMutation.isPending}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendEmailMutation.isPending}
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/inbox')}
                disabled={sendEmailMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  sendEmailMutation.isPending ||
                  toRecipients.length === 0 ||
                  !subject?.trim() ||
                  !message?.trim() ||
                  message === '<p></p>'
                }
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Create Contact Confirmation Dialog - BUG #7 FIX */}
      <Dialog open={showCreateContactDialog} onOpenChange={setShowCreateContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Contact?</DialogTitle>
            <DialogDescription>
              The email address <strong>{manualRecipient}</strong> is not in your contacts.
              Would you like to create a new contact before sending this email?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCreateContact}
              disabled={createContactMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCreateContact}
              disabled={createContactMutation.isPending}
            >
              {createContactMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Contact & Send'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
