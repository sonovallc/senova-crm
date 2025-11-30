'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react'
import { RichTextEditor } from './rich-text-editor'
import { emailTemplatesApi } from '@/lib/queries/email-templates'
import { EmailTemplate, Paginated } from '@/types'
import { cn } from '@/lib/utils'

interface MessageComposerProps {
  onSend: (data: { message: string; subject?: string; files?: File[]; channel?: string }) => void
  disabled?: boolean
  contactChannels?: { email?: string; phone?: string; hasWebChat?: boolean }
  threadType?: string // Type of the current thread (email, sms, web_chat)
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

export function MessageComposer({ onSend, disabled, contactChannels, threadType }: MessageComposerProps) {
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>((threadType || 'web_chat').toLowerCase())
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch templates for email replies
  const { data: templatesData } = useQuery<Paginated<EmailTemplate>>({
    queryKey: ['email-templates'],
    queryFn: async () => {
      return await emailTemplatesApi.getTemplates()
    },
  })

  // Update selected channel when threadType changes
  // CRITICAL FIX: Normalize to lowercase to match backend enum values
  useEffect(() => {
    if (threadType) {
      setSelectedChannel(threadType.toLowerCase())
    }
  }, [threadType])

  // Debug: Log file input mount
  useEffect(() => {
    if (fileInputRef.current) {
      console.log('✅ File input mounted:', fileInputRef.current)
    }
  }, [])

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

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = templatesData?.items?.find((t) => t.id === templateId)
    if (template) {
      // CRITICAL FIX: Ensure subject and message are never undefined/null
      setSubject(template.subject || '')
      setMessage(template.body_html || '')
    } else if (templateId === 'no-template') {
      // Clear fields if "no template" is selected
      setSubject('')
      setMessage('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // CRITICAL FIX: Ensure message is a string before calling trim()
    if ((message || '').trim() || selectedFiles.length > 0) {
      onSend({
        message,
        subject: isEmailThread ? subject : undefined,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
        channel: selectedChannel
      })
      setMessage('')
      setSubject('')
      setSelectedFiles([])
    }
  }

  // Determine if this is an email thread (case-insensitive to handle API returning "EMAIL")
  const isEmailThread = selectedChannel?.toLowerCase() === 'email'

  // Determine available channels
  const availableChannels = []
  if (contactChannels?.hasWebChat !== false) {
    availableChannels.push({ value: 'web_chat', label: 'Web Chat' })
  }
  if (contactChannels?.email) {
    availableChannels.push({ value: 'email', label: `Email (${contactChannels.email})` })
  }
  if (contactChannels?.phone) {
    availableChannels.push({ value: 'sms', label: `SMS (${contactChannels.phone})` })
  }

  const showChannelSelector = availableChannels.length > 1

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 space-y-3">
      {/* Template Selector (only for email threads) */}
      {isEmailThread && (
        <div className="space-y-1">
          <Label htmlFor="reply-template" className="text-xs text-muted-foreground">
            Select Template (Optional)
          </Label>
          <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
            <SelectTrigger id="reply-template" disabled={disabled} data-testid="inbox-template-selector">
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
      )}

      {/* Email Subject Field (only for email threads) */}
      {isEmailThread && (
        <div>
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={disabled}
            className="w-full"
            data-testid="email-subject-input"
          />
        </div>
      )}

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

      {/* Message Input - Rich Text Editor for Email, Plain Textarea for SMS/Chat */}
      {isEmailThread ? (
        <RichTextEditor
          value={message}
          onChange={setMessage}
          placeholder="Type your email message..."
          className="w-full"
        />
      ) : (
        <Textarea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
          className="w-full min-h-[100px] resize-none"
        />
      )}

      <div className="flex gap-2">
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
          onClick={() => {
            console.log('🔴 ATTACH BUTTON CLICKED', {
              fileInputRef: fileInputRef.current,
              inputElement: document.querySelector('input[type="file"]'),
              timestamp: new Date().toISOString()
            })
            fileInputRef.current?.click()
          }}
          disabled={disabled}
          title="Attach files (images, PDFs, documents - Max 10MB)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Channel Selector (if multiple channels available) */}
        {showChannelSelector && (
          <Select value={selectedChannel} onValueChange={setSelectedChannel} disabled={disabled}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableChannels.map((channel) => (
                <SelectItem key={channel.value} value={channel.value}>
                  {channel.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex-1" />

        {/* Send Button */}
        <Button
          type="submit"
          disabled={disabled || (!(message || '').trim() && selectedFiles.length === 0)}
          data-testid="inbox-reply-button"
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
    </form>
  )
}
