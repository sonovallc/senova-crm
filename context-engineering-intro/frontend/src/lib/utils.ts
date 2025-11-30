import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Contact } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getRelativeDayLabel(date: string | Date): string {
  const input = new Date(date)
  const today = new Date()
  const dayDiff = Math.floor(
    (normalizeDate(today).getTime() - normalizeDate(input).getTime()) / (24 * 60 * 60 * 1000)
  )

  if (dayDiff === 0) {
    return 'Today'
  }

  if (dayDiff === 1) {
    return 'Yesterday'
  }

  return input.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getDateKey(date: string | Date): string {
  const input = new Date(date)
  return `${input.getFullYear()}-${String(input.getMonth() + 1).padStart(2, '0')}-${String(
    input.getDate()
  ).padStart(2, '0')}`
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100) // Amount in cents
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  // Handle null/undefined
  if (!phone) {
    return ''
  }

  // Format: (123) 456-7890
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

type ContactEmailSource = Contact | Record<string, string | null | undefined>

export function getPrimaryEmail(contact: ContactEmailSource | null | undefined): string {
  if (!contact) return ''

  const source = contact as Record<string, string | null | undefined>
  const emailFields = [
    'email',
    'personal_email',
    'business_email',
    'personal_verified_email',
    'business_verified_email',
    'personal_emails',
    'business_emails',
  ]

  for (const field of emailFields) {
    const rawValue = source[field]
    if (typeof rawValue !== 'string') {
      continue
    }

    const firstValue = field.endsWith('emails')
      ? rawValue.split(',')[0]?.trim()
      : rawValue.trim()

    if (firstValue) {
      return firstValue
    }
  }

  return ''
}

// Password validation utilities
export interface PasswordRequirement {
  label: string
  met: boolean
}

export interface PasswordStrength {
  score: number // 0-4 (weak to very strong)
  label: string
  color: string
}

export function validatePassword(password: string): PasswordRequirement[] {
  return [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'Contains uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Contains lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      label: 'Contains number',
      met: /\d/.test(password),
    },
    {
      label: 'Contains special character',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
  ]
}

export function getPasswordStrength(password: string): PasswordStrength {
  const requirements = validatePassword(password)
  const metCount = requirements.filter((req) => req.met).length

  if (metCount === 0 || password.length === 0) {
    return { score: 0, label: 'Very Weak', color: 'bg-red-500' }
  } else if (metCount <= 2) {
    return { score: 1, label: 'Weak', color: 'bg-orange-500' }
  } else if (metCount === 3) {
    return { score: 2, label: 'Fair', color: 'bg-yellow-500' }
  } else if (metCount === 4) {
    return { score: 3, label: 'Good', color: 'bg-blue-500' }
  } else {
    return { score: 4, label: 'Strong', color: 'bg-green-500' }
  }
}

export function isPasswordValid(password: string): boolean {
  const requirements = validatePassword(password)
  return requirements.every((req) => req.met)
}
