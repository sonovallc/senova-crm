'use client'

import { Communication, CommunicationDirection, CommunicationType } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CheckCheck, Clock, Mail, Paperclip } from 'lucide-react'

interface MessageThreadProps {
  messages: Communication[]
  contactName: string
}

export function MessageThread({ messages, contactName }: MessageThreadProps) {
  return (
    <ScrollArea className="flex-1 p-4" data-testid="inbox-message-detail">
      <div className="space-y-4">
        {messages.map((message) => {
          const isOutbound = message.direction === CommunicationDirection.OUTBOUND

          return (
            <div
              key={message.id}
              className={cn('flex gap-3', isOutbound ? 'flex-row-reverse' : 'flex-row')}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(isOutbound ? 'You' : contactName)}</AvatarFallback>
              </Avatar>

              <div className={cn('flex max-w-[70%] flex-col gap-1', isOutbound ? 'items-end' : 'items-start')}>
                {/* Type badge */}
                {message.type === CommunicationType.EMAIL && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Mail className="h-3 w-3 mr-1" />
                    EMAIL
                  </Badge>
                )}

                <div
                  className={cn(
                    'rounded-lg px-4 py-2',
                    isOutbound
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-slate-100 text-foreground'
                  )}
                >
                  {/* Email-specific rendering */}
                  {message.type === CommunicationType.EMAIL ? (
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
                        className="email-body prose prose-sm max-w-none max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: message.body }}
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
                  {message.media_urls && message.media_urls.length > 0 && message.type !== CommunicationType.EMAIL && (
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
