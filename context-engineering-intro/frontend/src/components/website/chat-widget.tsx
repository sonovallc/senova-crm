'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, X, Send, Minimize2, Paperclip, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { WidgetWelcome } from './widget-welcome'
import { useChatStatus } from '@/contexts/chat-context'

// Generate UUID without external library to avoid Next.js build issues
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

type Message = {
  id: string
  content: string
  sender: 'user' | 'agent'
  timestamp: Date
  mediaUrls?: string[]
  localFileUrls?: string[] // Local preview URLs for uploaded files
}

type ChatStatus = 'closed' | 'open' | 'minimized'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/heic', 'image/webp']

// Helper to get cookie value
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

export function ChatWidget() {
  const { status, setStatus } = useChatStatus()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string>('')
  const [contactId, setContactId] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Check for existing authentication token on mount
  useEffect(() => {
    const existingToken = getCookie('widget_token')
    if (existingToken) {
      // Validate token by attempting to connect
      validateAndRestoreSession(existingToken)
    }
  }, [])

  // Debug: Log file input mount
  useEffect(() => {
    if (fileInputRef.current) {
      console.log('✅ File input mounted:', fileInputRef.current)
    }
  }, [])

  const validateAndRestoreSession = async (existingToken: string) => {
    try {
      // Skip WebSocket validation in development
      if (process.env.NODE_ENV === 'development') {
        // Just decode the token without validation
        try {
          const payload = JSON.parse(atob(existingToken.split('.')[1]))
          const contactIdFromToken = payload.sub

          setToken(existingToken)
          setContactId(contactIdFromToken)
          setIsAuthenticated(true)

          // Set initial welcome message for returning users
          setMessages([
            {
              id: '1',
              content: "Welcome back! How can I help you today?",
              sender: 'agent',
              timestamp: new Date(),
            },
          ])

          // Load existing messages (will replace welcome if successful)
          loadExistingMessages(contactIdFromToken)
        } catch (decodeError) {
          // Invalid token format, clear it
          document.cookie = 'widget_token=; max-age=0; path=/'
        }
        return
      }

      // Production: Try to connect WebSocket with existing token to validate
      const WS_URL = process.env.NEXT_PUBLIC_WS_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'wss://crm.senovallc.com/api'
          : 'ws://localhost:8000')
      const ws = new WebSocket(`${WS_URL}/api/v1/communications/ws/${existingToken}`)

      // Add timeout for connection
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close()
          document.cookie = 'widget_token=; max-age=0; path=/'
        }
      }, 3000) // 3 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout)
        // Token is valid - decode to get contact_id
        const payload = JSON.parse(atob(existingToken.split('.')[1]))
        const contactIdFromToken = payload.sub

        setToken(existingToken)
        setContactId(contactIdFromToken)
        setIsAuthenticated(true)

        // Set initial welcome message for returning users
        setMessages([
          {
            id: '1',
            content: "Welcome back! How can I help you today?",
            sender: 'agent',
            timestamp: new Date(),
          },
        ])

        // Close this test connection
        ws.close()

        // Load existing messages (will replace welcome if successful)
        loadExistingMessages(contactIdFromToken)
      }

      ws.onerror = () => {
        clearTimeout(connectionTimeout)
        // Token invalid - clear cookie
        document.cookie = 'widget_token=; max-age=0; path=/'
        ws.close()
      }
    } catch (error) {
      console.error('Session validation failed:', error)
      document.cookie = 'widget_token=; max-age=0; path=/'
    }
  }

  const loadExistingMessages = async (contactIdToLoad: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://crm.senovallc.com/api'
          : 'http://localhost:8000')
      const response = await fetch(`${API_URL}/api/v1/communications/widget/messages/${contactIdToLoad}`)

      if (response.ok) {
        const data = await response.json()
        // Only update messages if we actually got message data
        if (data.items && data.items.length > 0) {
          const loadedMessages: Message[] = data.items.map((msg: any) => ({
            id: msg.id,
            content: msg.body,
            sender: msg.direction === 'INBOUND' ? 'user' : 'agent',
            timestamp: new Date(msg.created_at),
            mediaUrls: msg.media_urls || [],
          }))
          setMessages(loadedMessages)
        }
        // If no messages, keep the welcome message that was already set
      }
      // If response not ok (401, etc), silently fail and keep welcome message
    } catch (error) {
      console.error('Failed to load messages:', error)
      // Keep the welcome message that was already set in validateAndRestoreSession
    }
  }

  const handleAuthenticated = (newToken: string, newContactId: string, existingMessages: any[]) => {
    setToken(newToken)
    setContactId(newContactId)
    setIsAuthenticated(true)

    // Load existing messages or show welcome
    if (existingMessages.length > 0) {
      const loadedMessages: Message[] = existingMessages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.timestamp),
        mediaUrls: msg.mediaUrls || [],
      }))
      setMessages(loadedMessages)
    } else {
      setMessages([
        {
          id: '1',
          content: "Hi! I'm here to help. What service are you interested in?",
          sender: 'agent',
          timestamp: new Date(),
        },
      ])
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // WebSocket connection for receiving admin replies
  useEffect(() => {
    if (!token || !isAuthenticated) return // Need token to connect

    let ws: WebSocket | null = null
    let connectionAttempts = 0
    const maxAttempts = 3

    const connectWebSocket = () => {
      try {
        const WS_URL = process.env.NEXT_PUBLIC_WS_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'wss://crm.senovallc.com/api'
          : 'ws://localhost:8000')
        ws = new WebSocket(`${WS_URL}/api/v1/communications/ws/${token}`)

        // Add timeout for connection
        const connectionTimeout = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket connection timeout, closing...')
            ws.close()
          }
        }, 5000) // 5 second timeout

        ws.onopen = () => {
          clearTimeout(connectionTimeout)
          console.log('WebSocket connected with token authentication')
          connectionAttempts = 0 // Reset attempts on successful connection
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            // Handle new message from admin
            if (data.type === 'new_message') {
              const agentMessage: Message = {
                id: data.communication_id,
                content: data.body,
                sender: 'agent',
                timestamp: new Date(data.timestamp),
                mediaUrls: data.media_urls || [],
              }

              setMessages((prev) => [...prev, agentMessage])
              setIsTyping(false)
            }
          } catch (error) {
            console.error('WebSocket message parse error:', error)
          }
        }

        ws.onerror = (error) => {
          clearTimeout(connectionTimeout)
          console.error('WebSocket error:', error)
          // Don't retry if we've exceeded max attempts
          if (connectionAttempts < maxAttempts) {
            connectionAttempts++
            console.log(`WebSocket connection attempt ${connectionAttempts} of ${maxAttempts}`)
            setTimeout(connectWebSocket, 2000 * connectionAttempts) // Exponential backoff
          }
        }

        ws.onclose = () => {
          clearTimeout(connectionTimeout)
          console.log('WebSocket closed')
        }
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error)
      }
    }

    // Only attempt WebSocket connection in production or if explicitly enabled
    if (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true' || process.env.NODE_ENV === 'production') {
      connectWebSocket()
    }

    // Cleanup on unmount or token change
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [token, isAuthenticated])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPG, PNG, SVG, HEIC, and WebP images are allowed.`)
        return
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 5MB.`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    setSelectedFiles((prev) => [...prev, ...validFiles])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    // Upload files to Cloudinary via backend API
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    try {
      const response = await api.post('/api/v1/communications/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Return the array of secure URLs from Cloudinary
      return response.data.urls
    } catch (error) {
      console.error('File upload failed:', error)
      throw new Error('Failed to upload files. Please try again.')
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() && selectedFiles.length === 0) return
    if (!isAuthenticated || !contactId) return

    setUploadingFiles(true)
    let mediaUrls: string[] = []
    let localFileUrls: string[] = []

    try {
      // Create local preview URLs for immediate display
      if (selectedFiles.length > 0) {
        localFileUrls = selectedFiles.map(file => URL.createObjectURL(file))
      }

      // Add user message to UI immediately with local previews
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue,
        sender: 'user',
        timestamp: new Date(),
        localFileUrls: localFileUrls.length > 0 ? localFileUrls : undefined,
      }

      setMessages((prev) => [...prev, userMessage])
      setInputValue('')
      const filesToUpload = [...selectedFiles]
      setSelectedFiles([])
      setUploadingFiles(false)
      setIsTyping(true)

      // Upload files in background if any
      if (filesToUpload.length > 0) {
        mediaUrls = await uploadFiles(filesToUpload)
      }

      // Send message to backend
      await api.post('/api/v1/communications/webchat', {
        type: 'web_chat',
        contact_id: contactId,
        body: inputValue || '(Image attachment)',
        media_urls: mediaUrls,
      })

      // Simulate agent response
      setTimeout(() => {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Thanks for your message! A team member will respond shortly. You can also call us at (781) 451-1594 for immediate assistance.",
          sender: 'agent',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, agentMessage])
        setIsTyping(false)
      }, 1500)
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsTyping(false)
      setUploadingFiles(false)
      alert('Failed to send message. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {status === 'closed' && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              size="lg"
              className="h-16 w-16 rounded-full shadow-2xl transition-all hover:scale-110 bg-gradient-to-r from-[#d4af37] to-[#e63759] text-white hover:opacity-90"
              onClick={() => setStatus('open')}
            >
              <MessageCircle className="h-7 w-7" />
            </Button>
            {/* Notification Badge */}
            <motion.div
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              1
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {status !== 'closed' && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="flex h-[600px] flex-col overflow-hidden border-2 border-primary shadow-2xl bg-white">
              {/* Header */}
              <CardHeader className="flex-shrink-0 bg-gradient-to-r from-[#d4af37] to-[#e63759] text-white border-b-2 border-[#d4af37]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white">
                      <AvatarFallback className="bg-white text-primary">EB</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg text-white">Senova</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                        <span className="text-xs text-white/90">Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => setStatus('minimized')}
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => setStatus('closed')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages or Welcome Screen */}
              <CardContent
                className={cn(
                  'flex-1 overflow-y-auto bg-slate-50',
                  status === 'minimized' && 'hidden',
                  !isAuthenticated ? 'p-0' : 'p-4 space-y-4'
                )}
              >
                {!isAuthenticated ? (
                  <WidgetWelcome onAuthenticated={handleAuthenticated} />
                ) : (
                  <>
                          {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          className={cn(
                            'flex',
                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                          )}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div
                            className={cn(
                              'max-w-[80%] rounded-2xl px-4 py-2',
                              message.sender === 'user'
                                ? 'bg-gradient-to-r from-[#d4af37] to-[#e63759] text-white'
                                : 'bg-white text-slate-900 shadow-sm'
                            )}
                          >
                            {/* Display images if present - prefer local previews */}
                            {(message.localFileUrls || message.mediaUrls) && (
                              <div className="mb-2 flex flex-col gap-2">
                                {(message.localFileUrls || message.mediaUrls)?.map((url, index) => (
                                  <img
                                    key={index}
                                    src={url}
                                    alt={`Attachment ${index + 1}`}
                                    className="max-h-48 w-full rounded-lg object-cover"
                                    onError={(e) => {
                                      // Only hide if it's a remote URL, not a local preview
                                      if (!url.startsWith('blob:')) {
                                        e.currentTarget.style.display = 'none'
                                      }
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            {message.content && <p className="text-sm">{message.content}</p>}

                            <p
                              className={cn(
                                'mt-1 text-xs',
                                message.sender === 'user' ? 'text-white/70' : 'text-slate-500'
                              )}
                            >
                              {message.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))}

                      {isTyping && (
                        <motion.div
                          className="flex justify-start"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                              <motion.div
                                className="h-2 w-2 rounded-full bg-slate-400"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                              />
                              <motion.div
                                className="h-2 w-2 rounded-full bg-slate-400"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                              />
                              <motion.div
                                className="h-2 w-2 rounded-full bg-slate-400"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </>
                  )}

              </CardContent>

              {/* Input - Only show if authenticated */}
              {status === 'open' && isAuthenticated && (
                <div className="flex-shrink-0 border-t bg-white p-4">
                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                        >
                          <ImageIcon className="h-4 w-4 text-primary" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {/* File Upload Button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/heic,image/webp"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute opacity-0 w-0 h-0 pointer-events-none"
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
                      disabled={uploadingFiles}
                      title="Attach images (JPG, PNG, SVG, HEIC, WebP - Max 5MB)"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>

                    {/* Text Input */}
                    <Input
                      placeholder="Type your message..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={uploadingFiles}
                      className="flex-1"
                    />

                    {/* Send Button */}
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={(!inputValue.trim() && selectedFiles.length === 0) || uploadingFiles}
                    >
                      {uploadingFiles ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {uploadingFiles && (
                    <p className="mt-2 text-xs text-primary">Uploading images...</p>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized State */}
      <AnimatePresence>
        {status === 'minimized' && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Card
              className="cursor-pointer border-0 shadow-lg transition-all hover:shadow-xl"
              onClick={() => setStatus('open')}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-white">EB</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900">Senova</p>
                  <p className="text-xs text-slate-600">Click to expand</p>
                </div>
                {messages.length > 1 && (
                  <Badge className="ml-auto">{messages.length - 1}</Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
