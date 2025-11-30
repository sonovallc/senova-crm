'use client'

import { useState } from 'react'
import { Calendar, ArrowRight } from 'lucide-react'
import { BookingModal } from './booking-modal'

interface BookingButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  service?: string
  className?: string
  children?: React.ReactNode
}

export function BookingButton({
  variant = 'primary',
  size = 'md',
  service,
  className = '',
  children,
}: BookingButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openBooking = () => {
    setIsModalOpen(true)
  }

  const closeBooking = () => {
    setIsModalOpen(false)
  }

  // Variant styles
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-xl',
    secondary:
      'bg-white text-orange-700 border-2 border-orange-500 hover:bg-orange-50 shadow-md',
    outline:
      'border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm',
  }

  // Size styles
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const baseClasses =
    'inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-300 hover:scale-105'

  return (
    <>
      <button
        onClick={openBooking}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        aria-label="Book an appointment"
      >
        <Calendar className="h-5 w-5" />
        {children || 'Book Appointment'}
        <ArrowRight className="h-4 w-4" />
      </button>

      <BookingModal isOpen={isModalOpen} onClose={closeBooking} selectedService={service} />
    </>
  )
}
