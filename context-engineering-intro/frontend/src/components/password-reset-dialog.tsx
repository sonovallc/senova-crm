'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import {
  validatePassword,
  getPasswordStrength,
  isPasswordValid,
  type PasswordRequirement,
} from '@/lib/utils'

interface PasswordResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userEmail: string
  isSelf?: boolean
  onSuccess?: () => void
}

export function PasswordResetDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  isSelf = false,
  onSuccess,
}: PasswordResetDialogProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const requirements = validatePassword(password)
  const strength = getPasswordStrength(password)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords
    if (!isPasswordValid(password)) {
      setError('Password does not meet all requirements')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      const token = sessionStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/reset-password`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: userId,
            new_password: password,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to reset password')
      }

      // Reset form and close dialog
      setPassword('')
      setConfirmPassword('')
      onOpenChange(false)

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setPassword('')
    setConfirmPassword('')
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {isSelf ? 'Change Your Password' : 'Reset User Password'}
          </DialogTitle>
          <DialogDescription>
            {isSelf
              ? 'Enter a new password for your account'
              : `Set a new password for ${userEmail}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Password Strength:</span>
                  <span className="font-medium">{strength.label}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">
                Password Requirements:
              </p>
              <div className="space-y-1">
                {requirements.map((req: PasswordRequirement, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs"
                  >
                    {req.met ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span
                      className={req.met ? 'text-green-600' : 'text-slate-500'}
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-red-600">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !isPasswordValid(password) ||
                !passwordsMatch
              }
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
