'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { formatErrorMessage } from '@/lib/error-handler'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      const user = await login(data.email, data.password)

      toast({
        title: 'Success',
        description: `Welcome back, ${user.first_name}!`,
      })

      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: formatErrorMessage(error) || 'Invalid email or password',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-senova-primary-light/20 via-white to-senova-info/10 px-4 py-12">
      {/* Back to Website Link */}
      <Link
        href="/home"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-senova-gray-500 hover:text-senova-primary transition-all duration-200"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Website
      </Link>

      <Card className="w-full max-w-md border-0 shadow-xl animate-fade-in-up">
        <CardHeader className="space-y-1 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-lg bg-senova-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-senova-gray-900">Senova CRM</CardTitle>
              <p className="text-xs text-senova-gray-500">Business Management Platform</p>
            </div>
          </div>
          <CardDescription className="text-senova-gray-500">Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-senova-primary hover:text-senova-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
                suppressHydrationWarning
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full bg-senova-primary hover:bg-senova-primary/90 text-white" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 bg-senova-gray-100 rounded-b-lg">
          <div className="text-sm text-senova-gray-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-senova-primary hover:text-senova-primary/80 font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
