'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type ChatStatus = 'closed' | 'open' | 'minimized'

interface ChatContextType {
  status: ChatStatus
  setStatus: (status: ChatStatus) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ChatStatus>('closed')

  return (
    <ChatContext.Provider value={{ status, setStatus }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatStatus() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatStatus must be used within a ChatProvider')
  }
  return context
}
