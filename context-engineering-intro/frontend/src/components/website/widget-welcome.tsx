'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function WidgetWelcome({
  onAuthenticated,
}: {
  onAuthenticated: (token: string, contactId: string, messages: any[]) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://crm.senovallc.com/api'
          : 'http://localhost:8000')
      const response = await fetch(`${API_URL}/api/v1/communications/widget/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || null }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || 'Authentication failed')
      }

      const data = await response.json()

      // Store token in cookie (30 days, secure)
      document.cookie = `widget_token=${data.token}; max-age=2592000; path=/; SameSite=Strict${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`

      // Notify parent component
      onAuthenticated(data.token, data.contact_id, data.existing_messages || [])
    } catch (err) {
      console.error('Widget auth error:', err)
      setError(err instanceof Error ? err.message : 'Failed to authenticate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Welcome! Let&apos;s get started</h3>
        <p className="text-sm text-slate-600 mt-1">
          Please provide your information to start chatting with us.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="widget-name" className="text-sm font-medium text-slate-700">
            Name *
          </Label>
          <Input
            id="widget-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="mt-1"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="widget-email" className="text-sm font-medium text-slate-700">
            Email *
          </Label>
          <Input
            id="widget-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="mt-1"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="widget-phone" className="text-sm font-medium text-slate-700">
            Phone (optional)
          </Label>
          <Input
            id="widget-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="555-1234"
            className="mt-1"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            'Start Chat'
          )}
        </Button>
      </form>

      <p className="text-xs text-slate-500 text-center">
        By chatting with us, you agree to our privacy policy.
      </p>
    </div>
  )
}
