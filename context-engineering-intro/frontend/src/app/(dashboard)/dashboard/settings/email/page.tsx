'use client'

import { MailgunSettings } from '@/components/settings/mailgun-settings'

export default function EmailSettingsPage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Email Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your Mailgun email service integration
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          <MailgunSettings />
        </div>
      </div>
    </div>
  )
}
