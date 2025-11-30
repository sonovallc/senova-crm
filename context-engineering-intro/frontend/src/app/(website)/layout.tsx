import { Header } from '@/components/website/header'
import { Footer } from '@/components/website/footer'
import { ChatWidgetLazy } from '@/components/website/chat-widget-lazy'
import { ChatProviderWrapper } from '@/components/providers/chat-provider-wrapper'

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProviderWrapper>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <ChatWidgetLazy />
    </ChatProviderWrapper>
  )
}
