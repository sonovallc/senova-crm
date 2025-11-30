'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, MailX, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function UnsubscribePage() {
  const params = useParams()
  const token = params.token as string
  const [isLoading, setIsLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/campaigns/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          throw new Error('Failed to unsubscribe')
        }

        const data = await response.json()
        setSuccess(data.success)
        setEmail(data.email)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      unsubscribe()
    }
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isLoading ? (
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            ) : success ? (
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            ) : (
              <MailX className="w-12 h-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isLoading
              ? 'Processing...'
              : success
              ? 'Successfully Unsubscribed'
              : 'Unsubscribe Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isLoading && <p className="text-muted-foreground">Please wait...</p>}

          {success && (
            <>
              <p className="text-muted-foreground">
                {email ? (
                  <>
                    The email address <strong>{email}</strong> has been unsubscribed from future
                    email campaigns.
                  </>
                ) : (
                  'You have been successfully unsubscribed from future email campaigns.'
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                You will no longer receive marketing emails from us. However, you may still
                receive transactional emails related to your account.
              </p>
            </>
          )}

          {error && (
            <>
              <p className="text-red-600">{error}</p>
              <p className="text-sm text-muted-foreground">
                The unsubscribe link may be invalid or expired. Please contact support if you
                continue to receive unwanted emails.
              </p>
            </>
          )}

          {!isLoading && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                If you unsubscribed by mistake, please contact us to resubscribe.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
