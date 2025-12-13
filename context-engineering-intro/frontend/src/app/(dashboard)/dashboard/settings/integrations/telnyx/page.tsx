'use client'

import { TelnyxSettings } from '@/components/settings/telnyx-settings'

export default function TelnyxIntegrationPage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Telnyx SMS/MMS Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your Telnyx SMS/MMS integration for sending and receiving text messages
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          <TelnyxSettings />
        </div>
      </div>
    </div>
  )
}
