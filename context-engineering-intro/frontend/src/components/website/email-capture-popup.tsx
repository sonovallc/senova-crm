'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStatus } from '@/contexts/chat-context'

export function EmailCapturePopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { status: chatStatus } = useChatStatus()

  useEffect(() => {
    // Show popup after 30 seconds or on exit intent (only when chat is closed)
    const timer = setTimeout(() => {
      if (!localStorage.getItem('eve-email-popup-shown') && chatStatus === 'closed') {
        setIsOpen(true)
        localStorage.setItem('eve-email-popup-shown', 'true')
      }
    }, 30000) // 30 seconds

    // Exit intent detection - only show if chat is closed
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !localStorage.getItem('eve-email-popup-shown') && chatStatus === 'closed') {
        setIsOpen(true)
        localStorage.setItem('eve-email-popup-shown', 'true')
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [chatStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitting(false)
    setIsSuccess(true)

    // Close popup after 2 seconds
    setTimeout(() => {
      setIsOpen(false)
    }, 2000)
  }

  const handleClose = () => {
    setIsOpen(false)
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-8 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close popup"
            >
              <X className="h-5 w-5" />
            </button>

            {!isSuccess ? (
              <>
                {/* Icon */}
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-gradient-to-br from-orange-100 to-amber-100 p-4">
                    <Sparkles className="h-8 w-8 text-orange-600" />
                  </div>
                </div>

                {/* Heading */}
                <h3 className="mb-2 text-center text-2xl font-bold text-slate-900">
                  Get 20% Off Your First Treatment!
                </h3>

                {/* Description */}
                <p className="mb-6 text-center text-slate-600">
                  Join our exclusive mailing list and receive <strong>20% off</strong> your first visit to Senova.
                  Plus, get insider tips and special offers delivered to your inbox.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-lg border-2 border-slate-200 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    size="lg"
                  >
                    {isSubmitting ? 'Claiming Offer...' : 'Claim My 20% Off'}
                  </Button>
                </form>

                {/* Privacy */}
                <p className="mt-4 text-center text-xs text-slate-500">
                  We respect your privacy. Unsubscribe anytime.
                  <br />
                  <a href="/privacy-policy" className="underline hover:text-slate-700">
                    Privacy Policy
                  </a>
                </p>
              </>
            ) : (
              /* Success State */
              <div className="py-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <svg
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-slate-900">You're All Set!</h3>
                <p className="text-slate-600">
                  Check your email for your 20% off code.
                  <br />
                  We can't wait to see you!
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
