'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { communicationsApi } from '@/lib/queries/communications'
import { Communication, InboxThread, Paginated, User, CommunicationDirection, CommunicationStatus } from '@/types'
import { ConversationList } from '@/components/inbox/conversation-list'
import { MessageThread } from '@/components/inbox/message-thread'
import { MessageComposer } from '@/components/inbox/message-composer'
import { EmailComposer } from '@/components/inbox/email-composer'
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
import { Loader2, User as UserIcon, ArrowUpDown, Plus, PenSquare, Archive, ArchiveRestore, Forward } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

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
    url: currentUser ? `${WS_URL}/api/v1/communications/ws/crm/${sessionStorage.getItem('access_token')}` : null,
    onMessage: handleWebSocketMessage,
  })

  const handleSendMessage = async (data: { message: string; subject?: string; files?: File[]; channel?: string }) => {
    if (!selectedConversation) return

    // Upload files if present
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
        // Continue sending message without files
      }
    }

    // Use thread type if no channel specified
    const messageType = data.channel || selectedConversation.type

    sendMessageMutation.mutate({
      contact_id: selectedConversation.contact_id,
      body: data.message,
      subject: data.subject, // Include subject for emails
      type: messageType, // Use email for email threads, sms for SMS threads, etc.
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
  }) => {
    try {
      // Send email via API with CC/BCC support
      await communicationsApi.sendEmail({
        to: data.to,
        cc: data.cc.length > 0 ? data.cc : undefined,
        bcc: data.bcc.length > 0 ? data.bcc : undefined,
        subject: data.subject,
        body_html: data.message,
        attachments: data.files,
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

        // Mark as read if it's an inbound message and not already read
        if (thread.latest_message.direction === CommunicationDirection.INBOUND && thread.latest_message.status !== CommunicationStatus.READ) {
          markAsReadMutation.mutate(thread.latest_message.id)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactParam, inboxData])

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inbox</h1>
            <p className="text-sm text-muted-foreground">Unified multi-channel communications</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className="w-96 border-r">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
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
                  // Don't mark archived messages as read
                }}
                onUnarchive={(id) => unarchiveMutation.mutate(id)}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Message thread */}
        <div className="flex flex-1 flex-col">
          {selectedConversation ? (
            <>
              {/* Thread header */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Forward functionality - opens compose dialog with message content pre-filled
                        setComposeDialogOpen(true)
                      }}
                      data-testid="inbox-forward-button"
                    >
                      <Forward className="mr-2 h-4 w-4" />
                      Forward
                    </Button>
                    {selectedConversation.status === 'ARCHIVED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unarchiveMutation.mutate(selectedConversation.id)}
                        disabled={unarchiveMutation.isPending}
                      >
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                        Unarchive
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => archiveMutation.mutate(selectedConversation.id)}
                        disabled={archiveMutation.isPending}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/contacts/${selectedConversation.contact_id}`)}
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      View Contact
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <MessageThread
                messages={messageHistory?.items || []}
                contactName={selectedConversation.contact_name || selectedConversation.contact_id}
              />

              {/* Composer */}
              <MessageComposer
                onSend={handleSendMessage}
                disabled={sendMessageMutation.isPending}
                threadType={selectedConversation.type}
                contactChannels={{
                  hasWebChat: true,
                  // TODO: Fetch actual contact details to populate email and phone
                  // This will enable the channel selector when contact has multiple methods
                }}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
