'use client'

import '@/styles/email-body.css'
import { Communication, CommunicationDirection, CommunicationType } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  CheckCheck,
  Clock,
  Mail,
  Paperclip,
  AlertCircle,
  MessageSquare,
  Phone,
  Smartphone
} from 'lucide-react'

interface MessageThreadProps {
  messages: Communication[]
  contactName: string
}

export function MessageThread({ messages, contactName }: MessageThreadProps) {
  // Helper function to get channel badge for all types
  // Using case-insensitive comparison since backend returns lowercase
  const getChannelBadge = (type: CommunicationType) => {
    const typeUpper = type?.toString().toUpperCase()
    switch (typeUpper) {
      case CommunicationType.EMAIL:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Mail className="h-3 w-3 mr-1" />
            EMAIL
          </Badge>
        )
      case CommunicationType.SMS:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Smartphone className="h-3 w-3 mr-1" />
            SMS
          </Badge>
        )
      case CommunicationType.MMS:
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Smartphone className="h-3 w-3 mr-1" />
            MMS
          </Badge>
        )
      case CommunicationType.WEB_CHAT:
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <MessageSquare className="h-3 w-3 mr-1" />
            CHAT
          </Badge>
        )
      case CommunicationType.PHONE:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Phone className="h-3 w-3 mr-1" />
            CALL
          </Badge>
        )
      default:
        return null
    }
  }

  // Helper to get sender name for outbound messages
  const getSenderName = (message: Communication) => {
    if (message.user) {
      const fullName = `${message.user.first_name || ''} ${message.user.last_name || ''}`.trim()
      return fullName || message.user.email
    }
    return 'You'
  }

  // Helper to get avatar initials
  const getAvatarInitials = (message: Communication, isOutbound: boolean) => {
    if (isOutbound) {
      if (message.user?.first_name || message.user?.last_name) {
        return getInitials(`${message.user.first_name || ''} ${message.user.last_name || ''}`.trim())
      }
      return getInitials('You')
    }
    return getInitials(contactName)
  }

  return (
    <ScrollArea className="h-full p-4" data-testid="inbox-message-detail">
      <div className="space-y-4">
        {messages.map((message) => {
          // Case-insensitive comparison for direction (API may return lowercase "outbound" or uppercase "OUTBOUND")
          const isOutbound = message.direction?.toString().toUpperCase() === CommunicationDirection.OUTBOUND

          return (
            <div
              key={message.id}
              className={cn('flex gap-3', isOutbound ? 'flex-row-reverse' : 'flex-row')}
            >
              <div className="flex flex-col items-center gap-1">
                <Avatar className={cn(
                  "h-10 w-10",
                  isOutbound ? "ring-2 ring-blue-600" : "ring-2 ring-slate-300"
                )}>
                  <AvatarFallback className={cn(
                    "font-semibold",
                    isOutbound ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                  )}>
                    {getAvatarInitials(message, isOutbound)}
                  </AvatarFallback>
                </Avatar>
                {/* Enhanced sender name and role below avatar */}
                <div className="flex flex-col items-center gap-1">
                  <span className={cn(
                    "text-xs font-semibold",
                    isOutbound ? "text-blue-700" : "text-slate-700"
                  )}>
                    {isOutbound ? getSenderName(message) : `${contactName} (Contact)`}
                  </span>
                  {isOutbound && message.user?.role && (
                    <Badge variant="default" className="text-xs px-2 py-0 h-5 bg-blue-600">
                      {message.user.role.charAt(0).toUpperCase() + message.user.role.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className={cn('flex max-w-[70%] flex-col gap-1', isOutbound ? 'items-end' : 'items-start')}>
                {/* Channel badge for all types */}
                {getChannelBadge(message.type)}

                <div
                  className={cn(
                    'rounded-lg px-4 py-2 shadow-sm',
                    isOutbound
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-slate-100 text-slate-900 mr-auto border border-slate-200'
                  )}
                >
                  {/* Email-specific rendering - case-insensitive comparison since backend returns lowercase */}
                  {message.type?.toString().toUpperCase() === CommunicationType.EMAIL ? (
                    <div className="email-message">
                      {/* Subject line */}
                      {message.subject && (
                        <div className="mb-2 pb-2 border-b border-border">
                          <p className="text-sm font-semibold">Subject: {message.subject}</p>
                        </div>
                      )}

                      {/* From/To headers for context */}
                      {message.metadata && typeof message.metadata === 'object' && (
                        <div className="mb-2 text-xs opacity-70">
                          {('from_address' in message.metadata && message.metadata.from_address) ? (
                            <div>From: {String(message.metadata.from_address)}</div>
                          ) : null}
                          {('to_address' in message.metadata && message.metadata.to_address) ? (
                            <div>To: {String(message.metadata.to_address)}</div>
                          ) : null}
                        </div>
                      )}

                      {/* HTML body (sanitized server-side with bleach) */}
                      <div
                        className="email-body-content prose prose-sm max-w-none max-h-96 overflow-y-auto"
                        style={{
                          // Inline styles to ensure HTML rendering works
                          lineHeight: '1.6',
                          fontSize: '14px',
                          wordBreak: 'break-word'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: message.body
                        }}
                      />

                      {/* Attachments */}
                      {message.media_urls && message.media_urls.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm font-semibold mb-2">Attachments:</p>
                          <div className="space-y-1">
                            {message.media_urls.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                Attachment {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SMS/Chat messages - existing rendering */
                    <>
                      {/* Display images for MMS */}
                      {message.media_urls && message.media_urls.length > 0 && (
                        <div className="mb-2 flex flex-col gap-2">
                          {message.media_urls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="max-h-48 w-full rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {/* Attachment indicator */}
                  {message.media_urls && message.media_urls.length > 0 && message.type?.toString().toUpperCase() !== CommunicationType.EMAIL && (
                    <div className="flex items-center gap-1 mr-2">
                      <Paperclip className="h-3 w-3" />
                      {message.media_urls.length}
                    </div>
                  )}
                  <span>{formatDateTime(message.created_at)}</span>
                  {isOutbound && (
                    <>
                      {message.status === 'DELIVERED' && <CheckCheck className="h-3 w-3 text-green-600" />}
                      {message.status === 'SENT' && <CheckCheck className="h-3 w-3" />}
                      {message.status === 'PENDING' && <Clock className="h-3 w-3" />}
                      {message.status === 'FAILED' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs">Failed</span>
                          {message.error_message && (
                            <span className="text-xs ml-1">- {message.error_message}</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {messages.length === 0 && (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <p className="text-sm">No messages</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
