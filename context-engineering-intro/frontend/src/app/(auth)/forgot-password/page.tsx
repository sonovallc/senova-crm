'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { formatErrorMessage } from '@/lib/error-handler'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)

    try {
      await api.post('/v1/auth/forgot-password', { email: data.email })
      setEmailSent(true)
      toast({
        title: 'Email Sent',
        description: 'If an account exists with this email, you will receive password reset instructions.',
      })
    } catch (error: any) {
      // Always show success message to prevent email enumeration
      setEmailSent(true)
      toast({
        title: 'Email Sent',
        description: 'If an account exists with this email, you will receive password reset instructions.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-senova-primary-light/20 via-white to-senova-info/10 px-4 py-12">
      {/* Back to Login Link */}
      <Link
        href="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-senova-gray-500 hover:text-senova-primary transition-all duration-200"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Login
      </Link>

      <Card className="w-full max-w-md border-0 shadow-xl animate-fade-in-up">
        <CardHeader className="space-y-1 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-lg bg-senova-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-senova-gray-900">Reset Password</CardTitle>
              <p className="text-xs text-senova-gray-500">Senova CRM</p>
            </div>
          </div>
          <CardDescription className="text-senova-gray-500">
            {emailSent
              ? 'Check your email for password reset instructions.'
              : 'Enter your email address and we\'ll send you a link to reset your password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-senova-success/20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-senova-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-senova-gray-600">
                If an account exists with this email, you will receive password reset instructions shortly.
              </p>
            </div>
          ) : (
            <form
              suppressHydrationWarning
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onSubmit)(e);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                  disabled={isLoading}
                  suppressHydrationWarning
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-senova-primary hover:bg-senova-primary/90 text-white" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 bg-senova-gray-100 rounded-b-lg">
          <div className="text-sm text-senova-gray-500">
            Remember your password?{' '}
            <Link href="/login" className="text-senova-primary hover:text-senova-primary/80 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
