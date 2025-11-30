import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-senova-gray-300 bg-white px-3 py-2 text-sm text-senova-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-senova-gray-500 transition-all duration-200 focus:border-senova-sky-400 focus:outline-none focus:ring-2 focus:ring-senova-sky-400/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-senova-gray-100 disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
