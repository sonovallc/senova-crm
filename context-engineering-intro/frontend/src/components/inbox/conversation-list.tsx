'use client'

import { Communication, CommunicationType, CommunicationDirection, CommunicationStatus } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { formatDateTime, getInitials, truncate } from '@/lib/utils'
import { Mail, MessageSquare, Phone, Smartphone, Paperclip, Archive, ArchiveRestore } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConversationListProps {
  conversations: Communication[]
  selectedId?: string
  onSelect: (conversation: Communication) => void
  onArchive?: (conversationId: string) => void
  onUnarchive?: (conversationId: string) => void
}

function getCommunicationIcon(type: CommunicationType) {
  switch (type) {
    case CommunicationType.SMS:
    case CommunicationType.MMS:
      return <Smartphone className="h-3 w-3" />
    case CommunicationType.EMAIL:
      return <Mail className="h-3 w-3" />
    case CommunicationType.WEB_CHAT:
      return <MessageSquare className="h-3 w-3" />
    case CommunicationType.PHONE:
      return <Phone className="h-3 w-3" />
  }
}

export function ConversationList({ conversations, selectedId, onSelect, onArchive, onUnarchive }: ConversationListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2" data-testid="inbox-message-list">
        {conversations.map((conversation) => {
          const isSelected = conversation.id === selectedId
          const contactName = (conversation as any).contact_name || conversation.contact_id
          const isUnread = conversation.direction === CommunicationDirection.INBOUND && conversation.status !== CommunicationStatus.READ && conversation.status !== CommunicationStatus.ARCHIVED
          const isArchived = conversation.status === CommunicationStatus.ARCHIVED

          return (
            <div
              key={conversation.id}
              className={cn(
                'group relative w-full rounded-lg transition-colors',
                isSelected ? 'bg-primary/10' : 'hover:bg-slate-100',
                isUnread && 'bg-blue-50 border border-blue-200'
              )}
              data-testid={`inbox-message-item-${conversation.id}`}
            >
              <button
                onClick={() => onSelect(conversation)}
                className="w-full p-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(contactName)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={cn("text-sm", isUnread ? "font-bold" : "font-medium")}>{contactName}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(conversation.created_at).split(',')[1]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-5 gap-1 px-1.5">
                      {getCommunicationIcon(conversation.type)}
                      <span className="text-xs">{conversation.type}</span>
                    </Badge>
                    {isUnread && (
                      <Badge variant="default" className="h-5 px-1.5 text-xs bg-blue-600">
                        New
                      </Badge>
                    )}
                    {conversation.status === 'PENDING' && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        Pending
                      </Badge>
                    )}
                    {conversation.media_urls && conversation.media_urls.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {conversation.media_urls.length} 📎
                      </Badge>
                    )}
                  </div>

                  {/* Email preview with subject */}
                  {conversation.type === CommunicationType.EMAIL && conversation.subject ? (
                    <div className="text-xs space-y-1">
                      <p className={cn("text-foreground line-clamp-1", isUnread ? "font-bold" : "font-semibold")}>{conversation.subject}</p>
                      <p className={cn("text-muted-foreground line-clamp-1", isUnread && "font-medium")}>
                        {truncate(conversation.body.replace(/<[^>]*>/g, ''), 60)}
                      </p>
                    </div>
                  ) : (
                    <p className={cn("text-xs text-muted-foreground line-clamp-2", isUnread && "font-medium")}>
                      {truncate(conversation.body.replace(/<[^>]*>/g, ''), 60)}
                    </p>
                  )}
                </div>
              </div>
            </button>

            {/* Archive/Unarchive button (shown on hover) */}
            {(onArchive || onUnarchive) && (
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isArchived && onUnarchive ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUnarchive(conversation.id)
                    }}
                    className="h-8 w-8 p-0"
                    title="Unarchive"
                  >
                    <ArchiveRestore className="h-4 w-4" />
                  </Button>
                ) : onArchive ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onArchive(conversation.id)
                    }}
                    className="h-8 w-8 p-0"
                    title="Archive"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            )}
          </div>
          )
        })}

        {conversations.length === 0 && (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <p className="text-sm">No conversations</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
