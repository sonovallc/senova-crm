'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { communicationsApi } from '@/lib/queries/communications'
import { emailProfilesApi } from '@/lib/api/email-profiles'
import { Communication, InboxThread, Paginated, User, CommunicationDirection, CommunicationStatus } from '@/types'
import { ConversationList } from '@/components/inbox/conversation-list'
import { MessageThread } from '@/components/inbox/message-thread'
import { MessageComposer } from '@/components/inbox/message-composer'
import { EmailComposer } from '@/components/inbox/email-composer'
import { ComposeModal } from '@/components/inbox/compose-modal'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useWebSocket } from '@/hooks/use-websocket'
import { authService } from '@/lib/auth'
import { formatErrorMessage } from '@/lib/error-handler'
import { getPrimaryEmail } from '@/lib/utils'
import { Loader2, User as UserIcon, ArrowUpDown, Plus, PenSquare, Archive, ArchiveRestore, Forward, ChevronLeft } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'wss://crm.senovallc.com/api'
    : 'ws://localhost:8000')

type InboxSocketMessage = {
  type?: string
  contact_name?: string
}

type ApiError = {
  response?: {
    data?: {
      detail?: string
    }
  }
}

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<Communication | null>(null)
  const [sortBy, setSortBy] = useState('recent_activity')
  const [activeTab, setActiveTab] = useState('all')
  const [composeDialogOpen, setComposeDialogOpen] = useState(false)
  const [expandedReplyOpen, setExpandedReplyOpen] = useState(false)
  const [composeModalOpen, setComposeModalOpen] = useState(false)
  const [showMessageDetail, setShowMessageDetail] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const contactParam = searchParams.get('contact')

  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: () => authService.getMe(),
  })

  // Fetch inbox conversations (grouped by contact threads)
  // Pass status parameter based on active tab
  const { data: inboxData = [], isLoading } = useQuery<InboxThread[]>({
    queryKey: ['inbox-threads', sortBy, activeTab],
    queryFn: () => {
      // Determine status filter based on active tab
      let statusFilter = undefined
      if (activeTab === 'archived') {
        statusFilter = 'ARCHIVED'
      } else {
        // For all, unread, and read tabs, exclude archived (backend default)
        statusFilter = undefined
      }
      return communicationsApi.getInboxThreads({ sort_by: sortBy, status: statusFilter })
    },
  })

  // Fetch contact message history
  const contactId = selectedConversation?.contact_id
  const { data: messageHistory } = useQuery<Paginated<Communication>>({
    queryKey: ['contact-messages', contactId],
    queryFn: () => {
      if (!contactId) {
        throw new Error('Contact ID is required')
      }
      return communicationsApi.getContactHistory(contactId)
    },
    enabled: !!contactId,
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { contact_id: string; body: string; subject?: string; type?: string; media_urls?: string[] }) =>
      communicationsApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-threads'] })
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] })
      toast({
        title: 'Success',
        description: 'Message sent successfully',
      })
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Error',
        description: formatErrorMessage(error) || 'Failed to send message',
        variant: 'destructive',
      })
    },
  })

  // Fetch user's assigned email profiles
  const { data: emailProfiles } = useQuery({
    queryKey: ['my-email-profiles'],
    queryFn: () => emailProfilesApi.getMyProfiles(),
  })

  // Auto-select default profile
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

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (communicationId: string) => communicationsApi.markAsRead(communicationId),
    onSuccess: () => {
      // Invalidate both inbox threads and contact messages to update UI
      queryClient.invalidateQueries({ queryKey: ['inbox-threads'] })
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] })
    },
  })

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (communicationId: string) => communicationsApi.archive(communicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-threads'] })
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] })
      toast({
        title: 'Conversation archived',
        description: 'The conversation has been moved to archived',
      })
      // Clear selected conversation if it was archived
      setSelectedConversation(null)
      setShowMessageDetail(false) // Reset mobile view
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Error',
        description: formatErrorMessage(error) || 'Failed to archive conversation',
        variant: 'destructive',
      })
    },
  })

  // Unarchive mutation
  const unarchiveMutation = useMutation({
    mutationFn: (communicationId: string) => communicationsApi.unarchive(communicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-threads'] })
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] })
      toast({
        title: 'Conversation unarchived',
        description: 'The conversation has been restored to your inbox',
      })
      // BUG-1 FIX: Clear selected conversation and switch to All tab after unarchiving
      // This ensures the unarchived contact immediately disappears from Archived tab
      setSelectedConversation(null)
      setShowMessageDetail(false) // Reset mobile view
      setActiveTab('all')
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Error',
        description: formatErrorMessage(error) || 'Failed to unarchive conversation',
        variant: 'destructive',
      })
    },
  })

  // WebSocket message handler (memoized to prevent reconnection loops)
  const handleWebSocketMessage = useCallback((data: InboxSocketMessage) => {
    // Handle real-time message updates
    if (data.type === 'new_message' || data.type === 'new_webchat_message') {
      queryClient.invalidateQueries({ queryKey: ['inbox-threads'] })
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] })

      toast({
        title: 'New message',
        description: data.contact_name ? `New message from ${data.contact_name}` : 'You have a new message',
      })
    }
  }, [queryClient, toast])

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket({
    url: currentUser ? `${WS_URL}/v1/communications/ws/crm/${sessionStorage.getItem('access_token')}` : null,
    onMessage: handleWebSocketMessage,
  })

  const handleSendMessage = async (data: { message: string; subject?: string; files?: File[]; channel?: string }) => {
    if (!selectedConversation) return

    // Use thread type if no channel specified
    const messageType = data.channel || selectedConversation.type

    // For email threads, use the sendEmail endpoint with profile_id
    if (messageType.toLowerCase() === 'email') {
      try {
        // Find the matching InboxThread to get contact email
        const matchingThread = inboxData.find(t => t.contact.id === selectedConversation.contact_id)
        const contactEmail = matchingThread?.contact?.email || ''

        if (!contactEmail) {
          toast({
            title: 'Error',
            description: 'Contact email not found',
            variant: 'destructive',
          })
          return
        }

        await communicationsApi.sendEmail({
          to: [contactEmail],
          subject: data.subject || selectedConversation.subject || 'No Subject',
          body_html: data.message,
          attachments: data.files,
          profile_id: selectedProfileId, // Pass the profile_id!
        })

        queryClient.invalidateQueries({ queryKey: ['inbox-threads'] })
        queryClient.invalidateQueries({ queryKey: ['contact-messages'] })
        toast({
          title: 'Success',
          description: 'Email sent successfully',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to send email',
          variant: 'destructive',
        })
      }
      return
    }

    // For non-email messages (SMS, Web Chat), upload files first
    let mediaUrls: string[] | undefined = undefined

    if (data.files && data.files.length > 0) {
      try {
        toast({
          title: 'Uploading files...',
          description: `Uploading ${data.files.length} file(s)`,
        })

        mediaUrls = await communicationsApi.uploadFiles(data.files)

        toast({
          title: 'Files uploaded successfully',
          description: `${data.files.length} file(s) ready to send`,
        })
      } catch (error) {
        toast({
          title: 'File upload failed',
          description: 'Could not upload files. Sending text only.',
          variant: 'destructive',
        })
      }
    }

    sendMessageMutation.mutate({
      contact_id: selectedConversation.contact_id,
      body: data.message,
      subject: data.subject,
      type: messageType,
      media_urls: mediaUrls,
    })
  }

  // Handle sending new composed email
  const handleSendComposedEmail = async (data: {
    to: string[]
    cc: string[]
    bcc: string[]
    subject: string
    message: string
    files?: File[]
    profileId?: string
  }) => {
    try {
      // Send email via API with CC/BCC support and profile
      await communicationsApi.sendEmail({
        to: data.to,
        cc: data.cc.length > 0 ? data.cc : undefined,
        bcc: data.bcc.length > 0 ? data.bcc : undefined,
        subject: data.subject,
        body_html: data.message,
        attachments: data.files,
        profile_id: data.profileId,
      })

      toast({
        title: 'Email sent',
        description: `Email sent to ${data.to.join(', ')}`,
      })

      setComposeDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['inbox-threads'] })
    } catch (error) {
      toast({
        title: 'Failed to send email',
        description: formatErrorMessage(error as ApiError) || 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  // Handle sending message from compose modal
  const handleComposeModalSend = async (data: {
    channel: string
    to: string
    cc?: string[]
    bcc?: string[]
    subject?: string
    body: string
    attachments?: File[]
    profileId?: string
  }) => {
    try {
      if (data.channel === 'email') {
        // Send email via API with CC/BCC support and profile
        await communicationsApi.sendEmail({
          to: [data.to],
          cc: data.cc,
          bcc: data.bcc,
          subject: data.subject || '',
          body_html: data.body,
          attachments: data.attachments,
          profile_id: data.profileId,
        })

        toast({
          title: 'Email sent',
          description: `Email sent to ${data.to}`,
        })
      } else if (data.channel === 'sms') {
        // Send SMS - need to find or create contact first
        // For now, show an error that SMS without contact is not supported
        toast({
          title: 'SMS not supported',
          description: 'SMS can only be sent from an existing contact conversation',
          variant: 'destructive',
        })
        return
      }

      setComposeModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['inbox-threads'] })
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: formatErrorMessage(error as ApiError) || 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  // Transform threads to conversation format for ConversationList
  // BUG FIX: Include unread_count from thread level for proper filtering
  const conversations = inboxData.map((thread) => {
    const fallbackEmail = getPrimaryEmail(thread.contact)
    const displayName = `${thread.contact.first_name} ${thread.contact.last_name}`.trim()

    // Use email if first_name is "Unknown" or if displayName is empty
    const shouldUseEmail = !displayName || thread.contact.first_name === 'Unknown'
    const contactName = shouldUseEmail ? (fallbackEmail || 'Unknown') : displayName

    return {
      id: thread.latest_message.id,
      contact_id: thread.contact.id,
      contact_name: contactName,
      type: thread.latest_message.type,
      direction: thread.latest_message.direction,
      body: thread.latest_message.body,
      subject: thread.latest_message.subject,
      media_urls: thread.latest_message.media_urls,
      status: thread.latest_message.status,
      created_at: thread.latest_message.created_at,
      sent_at: thread.latest_message.sent_at,
      // BUG FIX: Include unread_count for proper Unread/Read tab filtering
      unread_count: thread.unread_count || 0,
    }
  })

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (contactParam && inboxData.length > 0) {
      const thread = inboxData.find((t) => t.contact.id === contactParam)
      if (thread) {
        const fallbackEmail = getPrimaryEmail(thread.contact)
        const displayName = `${thread.contact.first_name} ${thread.contact.last_name}`.trim()

        // Use email if first_name is "Unknown" or if displayName is empty
        const shouldUseEmail = !displayName || thread.contact.first_name === 'Unknown'
        const contactName = shouldUseEmail ? (fallbackEmail || 'Unknown') : displayName

        const conversation = {
          id: thread.latest_message.id,
          contact_id: thread.contact.id,
          contact_name: contactName,
          type: thread.latest_message.type,
          direction: thread.latest_message.direction,
          body: thread.latest_message.body,
          subject: thread.latest_message.subject,
          media_urls: thread.latest_message.media_urls,
          status: thread.latest_message.status,
          created_at: thread.latest_message.created_at,
          sent_at: thread.latest_message.sent_at,
        }
        setSelectedConversation(conversation)
        setShowMessageDetail(true) // Show message detail on mobile when auto-selected

        // Mark as read if it's an inbound message and not already read
        if (thread.latest_message.direction === CommunicationDirection.INBOUND && thread.latest_message.status !== CommunicationStatus.READ) {
          markAsReadMutation.mutate(thread.latest_message.id)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactParam, inboxData])

  // Computed contact data for compose components (shared between MessageComposer and ComposeModal)
  const contactData = useMemo(() => {
    if (!selectedConversation) {
      return { contactEmails: [], contactPhones: [], defaultChannel: 'email' as const }
    }

    // Find the matching InboxThread to get full contact data
    const matchingThread = inboxData.find(t => t.contact.id === selectedConversation.contact_id)
    const contact = matchingThread?.contact

    // Extract ALL emails from contact - prefer pre-computed emails array from backend
    const contactEmails: string[] = []
    // Use pre-computed emails array from backend if available (comprehensive extraction)
    if ((contact as { emails?: string[] })?.emails && Array.isArray((contact as { emails?: string[] }).emails)) {
      (contact as { emails?: string[] }).emails?.forEach((email: string) => {
        if (email && !contactEmails.includes(email)) {
          contactEmails.push(email)
        }
      })
    }
    // Fallback: extract from individual fields if no pre-computed list
    if (contactEmails.length === 0) {
      // Primary email
      if (contact?.email) contactEmails.push(contact.email)
      // Check overflow_data for email overflow fields
      if (contact?.overflow_data) {
        Object.entries(contact.overflow_data).forEach(([key, values]) => {
          if (key.toLowerCase().includes('email') && Array.isArray(values)) {
            values.forEach(val => {
              if (val && typeof val === 'string' && val.includes('@') && !contactEmails.includes(val)) {
                contactEmails.push(val)
              }
            })
          }
        })
      }
      // Check custom_fields for email fields
      if (contact?.custom_fields) {
        Object.entries(contact.custom_fields).forEach(([key, value]) => {
          if (key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@') && !contactEmails.includes(value)) {
            contactEmails.push(value)
          }
        })
      }
    }

    // Extract ALL phones from contact - prefer pre-computed phones array from backend
    const contactPhones: string[] = []
    // Use pre-computed phones array from backend if available (comprehensive extraction)
    if (contact?.phones && Array.isArray(contact.phones)) {
      contact.phones.forEach((p: { number?: string; type?: string } | string) => {
        const phoneNum = typeof p === 'string' ? p : p.number
        if (phoneNum && !contactPhones.includes(phoneNum)) {
          contactPhones.push(phoneNum)
        }
      })
    }
    // Fallback: extract from individual fields if no pre-computed list
    if (contactPhones.length === 0) {
      // Primary phone
      if (contact?.phone) contactPhones.push(contact.phone)
      // Check overflow_data for phone overflow fields
      if (contact?.overflow_data) {
        Object.entries(contact.overflow_data).forEach(([key, values]) => {
          if (key.toLowerCase().includes('phone') && Array.isArray(values)) {
            values.forEach(val => {
              if (val && typeof val === 'string' && !contactPhones.includes(val)) {
                contactPhones.push(val)
              }
            })
          }
        })
      }
      // Check custom_fields for phone fields
      if (contact?.custom_fields) {
        Object.entries(contact.custom_fields).forEach(([key, value]) => {
          if (key.toLowerCase().includes('phone') && typeof value === 'string' && !contactPhones.includes(value)) {
            contactPhones.push(value)
          }
        })
      }
    }

    // Determine default channel from last inbound message in history
    let defaultChannel: 'email' | 'sms' | 'web_chat' = 'email'
    const lastInbound = messageHistory?.items?.find(m =>
      m.direction?.toString().toUpperCase() === 'INBOUND'
    )
    if (lastInbound) {
      const inboundType = lastInbound.type?.toString().toLowerCase()
      if (inboundType === 'sms' || inboundType === 'mms') {
        defaultChannel = 'sms'
      } else if (inboundType === 'web_chat') {
        defaultChannel = 'web_chat'
      } else {
        defaultChannel = 'email'
      }
    } else {
      // Fall back to current thread type
      const threadType = selectedConversation.type?.toString().toLowerCase()
      if (threadType === 'sms' || threadType === 'mms') {
        defaultChannel = 'sms'
      } else if (threadType === 'web_chat') {
        defaultChannel = 'web_chat'
      } else {
        defaultChannel = 'email'
      }
    }

    return { contactEmails, contactPhones, defaultChannel }
  }, [selectedConversation, inboxData, messageHistory])

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Inbox</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Unified multi-channel communications</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="sm:size-default">
                  <PenSquare className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Compose Email</span>
                  <span className="sm:hidden">Compose</span>
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

            {/* Expanded Reply Dialog */}
            {selectedConversation && (
              <Dialog open={expandedReplyOpen} onOpenChange={setExpandedReplyOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Reply to {selectedConversation.contact_name || 'Contact'}</DialogTitle>
                  </DialogHeader>
                  <EmailComposer
                    onSend={async (data) => {
                      await handleSendMessage({
                        message: data.message,
                        subject: data.subject,
                        files: data.files,
                        channel: selectedConversation.type.toLowerCase()
                      })
                      setExpandedReplyOpen(false)
                    }}
                    disabled={sendMessageMutation.isPending}
                    defaultSubject={selectedConversation.subject ? `Re: ${selectedConversation.subject}` : ''}
                  />
                </DialogContent>
              </Dialog>
            )}

            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content with resizable panels */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Conversation list panel */}
        <Panel
          defaultSize={35}
          minSize={20}
          maxSize={50}
          className={`${selectedConversation && showMessageDetail ? 'hidden md:block' : 'block'}`}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full border-r">
            <div className="border-b px-4 py-2 space-y-2">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent_activity">Recent Activity</SelectItem>
                    <SelectItem value="oldest_activity">Oldest First</SelectItem>
                    <SelectItem value="recent_inbound">Recent Inbound</SelectItem>
                    <SelectItem value="recent_outbound">Recent Outbound</SelectItem>
                    <SelectItem value="newest">Newest Contact</SelectItem>
                    <SelectItem value="oldest">Oldest Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="all" className="flex-1">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">
                  Unread
                </TabsTrigger>
                <TabsTrigger value="read" className="flex-1">
                  Read
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex-1">
                  Archived
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="m-0 h-[calc(100%-60px)]">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversation?.id}
                  onSelect={(conversation) => {
                    setSelectedConversation(conversation)
                    setShowMessageDetail(true) // Show message detail on mobile
                    // Mark as read if it's an inbound message and not already read
                    if (conversation.direction === CommunicationDirection.INBOUND && conversation.status !== CommunicationStatus.READ) {
                      markAsReadMutation.mutate(conversation.id)
                    }
                  }}
                  onArchive={(id) => archiveMutation.mutate(id)}
                  onUnarchive={(id) => unarchiveMutation.mutate(id)}
                />
              )}
            </TabsContent>

            <TabsContent value="unread" className="m-0 h-[calc(100%-60px)]">
              <ConversationList
                conversations={conversations.filter((c) =>
                  // BUG FIX: Unread = any thread that is NOT read and NOT archived
                  // "Pending" status means unread (hasn't been marked as READ yet)
                  c.status !== 'READ' && c.status !== 'ARCHIVED'
                )}
                selectedId={selectedConversation?.id}
                onSelect={(conversation) => {
                  setSelectedConversation(conversation)
                  setShowMessageDetail(true) // Show message detail on mobile
                  // Mark as read when selected
                  if (conversation.status !== 'READ') {
                    markAsReadMutation.mutate(conversation.id)
                  }
                }}
                onArchive={(id) => archiveMutation.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="read" className="m-0 h-[calc(100%-60px)]">
              <ConversationList
                conversations={conversations.filter((c) =>
                  // BUG FIX: Read = threads with status READ (not archived)
                  c.status === 'READ'
                )}
                selectedId={selectedConversation?.id}
                onSelect={(conversation) => {
                  setSelectedConversation(conversation)
                  setShowMessageDetail(true) // Show message detail on mobile
                  // Already read - no need to mark again
                }}
                onArchive={(id) => archiveMutation.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="archived" className="m-0 h-[calc(100%-60px)]">
              <ConversationList
                conversations={conversations.filter((c) => c.status === 'ARCHIVED')}
                selectedId={selectedConversation?.id}
                onSelect={(conversation) => {
                  setSelectedConversation(conversation)
                  setShowMessageDetail(true) // Show message detail on mobile
                  // Don't mark archived messages as read
                }}
                onUnarchive={(id) => unarchiveMutation.mutate(id)}
              />
            </TabsContent>
          </Tabs>
        </Panel>

        {/* Resizable divider - only visible on desktop when a conversation is selected */}
        {selectedConversation && (
          <>
            <PanelResizeHandle className="w-2 bg-slate-300 hover:bg-blue-400 transition-colors cursor-col-resize active:bg-blue-500" />

            {/* Message thread panel */}
            <Panel defaultSize={65} minSize={40}>
              <div className={`${!selectedConversation || !showMessageDetail ? 'hidden md:flex' : 'flex'} h-full flex-col min-w-0`}>
          {selectedConversation ? (
            <div className="flex flex-col h-full">
              {/* Thread header */}
              <div className="border-b p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Back button for mobile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowMessageDetail(false)
                        setSelectedConversation(null)
                      }}
                      className="md:hidden"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <div>
                        <h2 className="font-semibold">{selectedConversation.contact_name || selectedConversation.contact_id}</h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.type.toUpperCase()}
                        {selectedConversation.status === 'ARCHIVED' && (
                          <Badge variant="secondary" className="ml-2">
                            Archived
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Forward functionality - opens compose dialog with message content pre-filled
                        setComposeDialogOpen(true)
                      }}
                      data-testid="inbox-forward-button"
                      className="text-xs sm:text-sm"
                    >
                      <Forward className="mr-1 sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Forward</span>
                      <span className="sm:hidden">Fwd</span>
                    </Button>
                    {selectedConversation.status === 'ARCHIVED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unarchiveMutation.mutate(selectedConversation.id)}
                        disabled={unarchiveMutation.isPending}
                        className="text-xs sm:text-sm"
                      >
                        <ArchiveRestore className="mr-1 sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Unarchive</span>
                        <span className="sm:hidden">Unarch</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => archiveMutation.mutate(selectedConversation.id)}
                        disabled={archiveMutation.isPending}
                        className="text-xs sm:text-sm"
                      >
                        <Archive className="mr-1 sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Archive</span>
                        <span className="sm:hidden">Arch</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/contacts/${selectedConversation.contact_id}`)}
                      className="text-xs sm:text-sm"
                    >
                      <UserIcon className="mr-1 sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">View Contact</span>
                      <span className="sm:hidden">Contact</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages - takes up most space with flex-1 and min-height */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <MessageThread
                  messages={messageHistory?.items || []}
                  contactName={selectedConversation.contact_name || selectedConversation.contact_id}
                />
              </div>

              {/* Composer - compact at bottom with flex-shrink-0 and max height */}
              <div className="flex-shrink-0 max-h-[200px] overflow-y-auto border-t">
                <MessageComposer
                  onSend={handleSendMessage}
                  disabled={sendMessageMutation.isPending}
                  threadType={selectedConversation.type}
                  contactChannels={{
                    hasWebChat: true,
                    emails: contactData.contactEmails,
                    phones: contactData.contactPhones
                  }}
                  onExpandCompose={() => setComposeModalOpen(true)}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
              </div>
            </Panel>
          </>
        )}

        {/* Show placeholder when no conversation selected on desktop */}
        {!selectedConversation && (
          <Panel defaultSize={65} minSize={40}>
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Select a conversation to start messaging</p>
            </div>
          </Panel>
        )}
      </PanelGroup>

      {/* Compose Modal for expanded message composition */}
      {selectedConversation && (() => {
        // Check if contact has initiated web chat (for showing web_chat option)
        const hasWebChatHistory = messageHistory?.items?.some(m =>
          m.type?.toString().toLowerCase() === 'web_chat'
        )

        return (
          <ComposeModal
            open={composeModalOpen}
            onOpenChange={setComposeModalOpen}
            contact={{
              id: selectedConversation.contact_id,
              name: selectedConversation.contact_name || 'Contact',
              emails: contactData.contactEmails,
              phones: contactData.contactPhones,
              hasWebChat: hasWebChatHistory
            }}
            defaultChannel={contactData.defaultChannel}
            defaultSubject={selectedConversation.subject ? `Re: ${selectedConversation.subject}` : ''}
            onSend={async (data) => {
              // If replying to a contact, we need to use the contact's ID
              if (selectedConversation) {
                await handleSendMessage({
                  message: data.body,
                  subject: data.subject,
                  files: data.attachments,
                  channel: data.channel
                })
              } else {
                await handleComposeModalSend(data)
              }
            }}
          />
        )
      })()}
    </div>
  )
}
