'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, Sparkles } from 'lucide-react'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedService?: string
}

export function BookingModal({ isOpen, onClose, selectedService }: BookingModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  // IMPORTANT: Replace with actual Acuity Scheduling URL
  // Get this from: Acuity Dashboard → Scheduling Page → Link → Direct Links & Embedding
  const acuityUrl = process.env.NEXT_PUBLIC_ACUITY_SCHEDULING_URL || 'https://evebeautyma.acuityscheduling.com'

  // Build URL with query parameters
  const buildBookingUrl = () => {
    const params = new URLSearchParams()

    // Pre-select appointment type if service is specified
    if (selectedService) {
      // Map service names to Acuity appointment type IDs
      // These need to be configured in Acuity dashboard first
      const serviceMap: Record<string, string> = {
        microblading: 'microblading',
        'lip-blushing': 'lip-blushing',
        hydrafacial: 'hydrafacial',
        'permanent-eyeliner': 'permanent-eyeliner',
        'body-contouring': 'body-contouring',
        'lash-lift': 'lash-lift',
      }

      const appointmentType = serviceMap[selectedService.toLowerCase()]
      if (appointmentType) {
        params.append('appointmentType', appointmentType)
      }
    }

    const queryString = params.toString()
    return queryString ? `${acuityUrl}?${queryString}` : acuityUrl
  }

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'

      // Load Acuity embed script
      const script = document.createElement('script')
      script.src = 'https://embed.acuityscheduling.com/js/embed.js'
      script.type = 'text/javascript'
      script.async = true
      document.body.appendChild(script)

      return () => {
        document.body.style.overflow = 'unset'
        // Note: We don't remove the script as it might be needed for other bookings
      }
    }
  }, [isOpen])

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 p-2">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Book Your Appointment</h2>
                  <p className="text-sm text-slate-600">Choose your service and preferred time</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-500 transition-all hover:bg-white hover:text-slate-700"
                aria-label="Close booking modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 inline-block animate-spin rounded-full border-4 border-slate-200 border-t-orange-500 p-4">
                    <Clock className="h-8 w-8 text-transparent" />
                  </div>
                  <p className="text-slate-600">Loading booking calendar...</p>
                </div>
              </div>
            )}

            {/* Acuity Scheduling Iframe */}
            <div className={isLoading ? 'hidden' : 'block'}>
              <iframe
                src={buildBookingUrl()}
                width="100%"
                height="700"
                frameBorder="0"
                onLoad={handleIframeLoad}
                title="Book an appointment with Senova"
                className="border-0"
              />
            </div>

            {/* Footer with Benefits */}
            <div className="border-t-2 border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  <span>Free Consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>Flexible Scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Instant Confirmation</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
