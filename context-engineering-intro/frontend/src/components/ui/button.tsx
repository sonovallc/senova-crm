import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-senova-primary text-white hover:bg-senova-primary/90 hover:transform hover:-translate-y-0.5 hover:shadow-md',
        destructive: 'bg-senova-warning text-white hover:bg-senova-warning/90 hover:transform hover:-translate-y-0.5 hover:shadow-md',
        outline: 'border border-senova-gray-300 bg-white hover:bg-senova-gray-100 hover:border-senova-primary hover:text-senova-primary',
        secondary: 'bg-senova-primary-light text-senova-primary hover:bg-senova-primary hover:text-white hover:transform hover:-translate-y-0.5 hover:shadow-md',
        ghost: 'hover:bg-senova-gray-100 hover:text-senova-primary',
        link: 'text-senova-primary underline-offset-4 hover:underline',
        senova: 'bg-senova-primary-light text-senova-primary hover:bg-senova-primary hover:text-white hover:transform hover:-translate-y-0.5 hover:shadow-md',
        sky: 'bg-senova-sky text-white hover:bg-senova-sky-600 hover:transform hover:-translate-y-0.5 hover:shadow-md',
        electric: 'bg-senova-electric text-white hover:bg-senova-electric-600 shadow-lg hover:transform hover:-translate-y-0.5',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
