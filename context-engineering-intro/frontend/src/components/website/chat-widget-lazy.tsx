'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load the ChatWidget component to prevent blocking page load
const ChatWidget = dynamic(
  () => import('./chat-widget').then(mod => ({ default: mod.ChatWidget })),
  {
    ssr: false, // Disable server-side rendering for this component
    loading: () => null // Don't show loading indicator
  }
)

export function ChatWidgetLazy() {
  // Only render chat widget in production or if explicitly enabled
  const shouldRenderChat = process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true' || process.env.NODE_ENV === 'production'

  if (!shouldRenderChat) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <ChatWidget />
    </Suspense>
  )
}