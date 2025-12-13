'use client'

import { TwilioSettings } from '@/components/settings/twilio-settings'

export default function TwilioIntegrationPage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Twilio Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your Twilio SMS and voice integration
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          <TwilioSettings />
        </div>
      </div>
    </div>
  )
}