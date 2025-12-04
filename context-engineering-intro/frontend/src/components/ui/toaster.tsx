'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Ensure description is always a string to prevent React child errors
        let safeDescription = description
        if (description && typeof description === 'object') {
          // Handle validation error objects from FastAPI
          const obj = description as any
          if (obj.msg) {
            safeDescription = obj.msg
          } else if (obj.message) {
            safeDescription = obj.message
          } else if (obj.detail) {
            safeDescription = obj.detail
          } else if (Array.isArray(obj)) {
            // Handle array of errors
            safeDescription = obj.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
          } else {
            // Fallback to JSON stringify
            safeDescription = JSON.stringify(description)
          }
        }

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {safeDescription && <ToastDescription>{safeDescription}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
