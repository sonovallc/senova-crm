'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AIToolsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the actual ai page
    router.replace('/dashboard/ai')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Redirecting to AI Tools...</span>
      </div>
    </div>
  )
}
