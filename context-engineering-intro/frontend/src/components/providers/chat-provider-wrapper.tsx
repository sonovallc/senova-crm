'use client'

import { ReactNode } from 'react'
import { ChatProvider } from '@/contexts/chat-context'

export function ChatProviderWrapper({ children }: { children: ReactNode }) {
  return <ChatProvider>{children}</ChatProvider>
}
