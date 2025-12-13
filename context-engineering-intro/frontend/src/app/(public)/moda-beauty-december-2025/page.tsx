'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Sparkles, Star, ArrowRight } from 'lucide-react'
import Image from 'next/image'

// Google Fonts Import for Luxury Typography
const fontImportStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Montserrat:wght@400;500;600&display=swap');
`

// Pure Winter Color Palette - NO RED TINTS
const colors = {
  winterWhite: '#FFFFFF',
  iceCyan: '#E6F7FF',
  frostBlue: '#B8E6FF',
  modaCyan: '#8ED1FC',
  sparkleCyan: '#7BDCB5',
  silverGray: '#C0C8D0',
  deepWinter: '#2C3E50',
  modaBlack: '#000000',
  modaButton: '#32373C',
}

// Falling Snowflake Component using SVG assets
const FallingSnowflake = ({ delay, index }: { delay: number; index: number }) => {
  const randomLeft = Math.random() * 100
  const randomDuration = 10 + Math.random() * 5
  const randomSize = 10 + Math.random() * 20
  const snowflakeNumber = (index % 6) + 1 // Rotate through snowflake-1.svg to snowflake-6.svg

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${randomLeft}%`,
        top: -50,
        width: randomSize,
        height: randomSize,
        opacity: 0.6 + Math.random() * 0.2,
      }}
      animate={{
        y: 'calc(100vh + 100px)',
        x: [0, 15, -15, 10, 0],
        rotate: [0, 360],
      }}
      transition={{
        y: { duration: randomDuration, ease: 'linear', repeat: Infinity, delay },
        x: { duration: 5, ease: 'easeInOut', repeat: Infinity, delay },
        rotate: { duration: randomDuration, ease: 'linear', repeat: Infinity, delay },
      }}
    >
      <Image
        src={`/moda-winter/snowflakes/snowflake-${snowflakeNumber}.svg`}
        alt=""
        width={randomSize}
        height={randomSize}
      />
    </motion.div>
  )
}

// Form Data Interface
interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  streetAddress: string
  city: string
  state: string
  zip: string
  offerInterest: string
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
  offerInterest: '',
}

export default function ModaBeautyDecember2025Page() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [consentChecked, setConsentChecked] = useState(false)
  const [showConsentError, setShowConsentError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^[\d\s\-\(\)\+]+$/.test(formData.phone) || formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required'
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      newErrors.zip = 'Please enter a valid ZIP code'
    }
    if (!formData.offerInterest) newErrors.offerInterest = 'Please select an offer'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!consentChecked) {
      setShowConsentError(true)
      return
    }

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const MODA_BEAUTY_OBJECT_ID = '02d445c1-b018-4b04-8c6d-7e0352dabb34'

      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        street_address: formData.streetAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip.trim(),
        country: 'USA',
        tags: ['Moda Beauty Holiday Promotional Form Submission'],
        object_id: MODA_BEAUTY_OBJECT_ID,
        custom_fields: {
          offer_interest: formData.offerInterest
        },
        sms_consent: true,
        email_consent: true,
      }

      // Environment detection (production vs local)
      const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'crm.senovallc.com'
        ? 'https://crm.senovallc.com/api/v1/contacts/'
        : 'http://localhost:8000/api/v1/contacts/'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API error:', response.status, errorData)
        throw new Error(`Failed to submit form: ${response.status}`)
      }

      const data = await response.json()
      console.log('Contact created successfully:', data.id)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Form submission error:', error)
      alert('There was an error submitting the form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fontImportStyle }} />

      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        {/* Meta Tags */}
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>

        {/* Background Image with Gradient Overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(180deg, ${colors.iceCyan}E6 0%, ${colors.frostBlue}F2 50%, ${colors.modaCyan} 100%), url('/moda-winter/hero-forest-path.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />

        {/* Falling Snowflakes - 15-20 on desktop, 10 on mobile */}
        {mounted && (
          <>
            {Array.from({ length: window.innerWidth <= 768 ? 10 : 18 }, (_, i) => (
              <FallingSnowflake key={`snow-${i}`} delay={i * 0.8} index={i} />
            ))}
          </>
        )}

        {/* Main Content */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8 }}
              >
                {/* Hero Section */}
                <section className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative">
                  <div className="max-w-6xl mx-auto text-center">
                    {/* MODA Logo */}
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1 }}
                      className="mb-8"
                    >
                      <Image
                        src="https://modamedspa.com/storage/2023/12/moda-aesthethics-full-logo-version-two.svg"
                        alt="MODA Aesthetics + Wellness"
                        width={300}
                        height={100}
                        className="mx-auto"
                        style={{
                          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                        }}
                      />
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.2 }}
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                        fontWeight: 900,
                        color: colors.deepWinter,
                        lineHeight: 1.1,
                        textShadow: `2px 2px 4px rgba(255, 255, 255, 0.5)`,
                        letterSpacing: '-0.02em',
                        marginBottom: '1.5rem',
                      }}
                    >
                      Transform Your Beauty This Winter Season
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      className="text-xl md:text-2xl mb-8"
                      style={{
                        color: colors.deepWinter,
                        fontWeight: 600,
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: 'italic',
                      }}
                    >
                      Exclusive Holiday Wellness Packages
                    </motion.p>

                    {/* CTA Button */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="mb-12"
                    >
                      <button
                        onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-10 py-4 font-bold text-lg relative overflow-hidden group"
                        style={{
                          background: colors.modaButton,
                          color: colors.winterWhite,
                          borderRadius: '50px',
                          border: `2px solid ${colors.modaCyan}`,
                          boxShadow: `0 10px 30px ${colors.modaCyan}40`,
                          letterSpacing: '0.05em',
                          fontFamily: "'Montserrat', sans-serif",
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = `0 15px 40px ${colors.modaCyan}60`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = `0 10px 30px ${colors.modaCyan}40`
                        }}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          <Sparkles className="w-5 h-5" />
                          Claim Your Winter Offer
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>
                    </motion.div>
                  </div>
                </section>

                {/* Promotional Offers Section */}
                <section className="py-12 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Offer Card 1 - Mesotherapy */}
                      <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="relative group"
                        style={{ cursor: 'pointer' }}
                        whileHover={{ y: -8 }}
                        onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        {/* Card with Frosted Glass Effect */}
                        <div
                          className="relative h-full min-h-[400px] overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${colors.iceCyan}DD, ${colors.frostBlue}DD)`,
                            backdropFilter: 'blur(10px)',
                            borderRadius: '20px',
                            border: `3px solid ${colors.modaCyan}`,
                            boxShadow: `0 20px 40px ${colors.modaCyan}30, 0 0 60px ${colors.modaCyan}20`,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {/* Northern Lights Overlay */}
                          <div
                            className="absolute inset-0 opacity-25"
                            style={{
                              backgroundImage: `url('/moda-winter/northern-lights.jpg')`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              zIndex: 0,
                            }}
                          />

                          {/* Sparkle Effect on Hover */}
                          <motion.div
                            className="absolute top-4 right-4"
                            animate={{
                              scale: [1, 1.2, 1],
                              rotate: [0, 180, 360],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            <Star className="w-8 h-8" style={{ color: colors.modaCyan }} />
                          </motion.div>

                          {/* Content */}
                          <div className="relative p-8 text-center z-10 flex flex-col justify-center h-full">
                            <h3
                              style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '3rem',
                                fontWeight: 900,
                                color: colors.deepWinter,
                                marginBottom: '1rem',
                                textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8)',
                              }}
                            >
                              $200 OFF
                            </h3>
                            <p
                              style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: '2rem',
                                fontWeight: 600,
                                color: colors.deepWinter,
                                marginBottom: '1.5rem',
                                fontStyle: 'italic',
                              }}
                            >
                              Skin Rejuvenation Treatment
                            </p>
                            <p
                              className="text-lg"
                              style={{
                                color: colors.deepWinter,
                                lineHeight: 1.7,
                                fontWeight: 500,
                              }}
                            >
                              Experience the transformative power of Mesotherapy. Radiant, youthful skin awaits.
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Offer Card 2 - GLP-1 Weightloss */}
                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="relative group"
                        style={{ cursor: 'pointer' }}
                        whileHover={{ y: -8 }}
                        onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        {/* Card with Frosted Glass Effect */}
                        <div
                          className="relative h-full min-h-[400px] overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${colors.sparkleCyan}DD, ${colors.modaCyan}DD)`,
                            backdropFilter: 'blur(10px)',
                            borderRadius: '20px',
                            border: `3px solid ${colors.sparkleCyan}`,
                            boxShadow: `0 20px 40px ${colors.sparkleCyan}30, 0 0 60px ${colors.sparkleCyan}20`,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {/* Forest Panorama Overlay */}
                          <div
                            className="absolute inset-0 opacity-25"
                            style={{
                              backgroundImage: `url('/moda-winter/forest-panorama.jpg')`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              zIndex: 0,
                            }}
                          />

                          {/* Shimmer Effect on Hover */}
                          <motion.div
                            className="absolute top-4 right-4"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                              duration: 2.5,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            <Sparkles className="w-8 h-8" style={{ color: colors.sparkleCyan }} />
                          </motion.div>

                          {/* Content */}
                          <div className="relative p-8 text-center z-10 flex flex-col justify-center h-full">
                            <h3
                              style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '3rem',
                                fontWeight: 900,
                                color: colors.deepWinter,
                                marginBottom: '1rem',
                                textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8)',
                              }}
                            >
                              $50 OFF First Month
                            </h3>
                            <p
                              style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: '2rem',
                                fontWeight: 600,
                                color: colors.deepWinter,
                                marginBottom: '1.5rem',
                                fontStyle: 'italic',
                              }}
                            >
                              Begin Your Wellness Journey
                            </p>
                            <p
                              className="text-lg"
                              style={{
                                color: colors.deepWinter,
                                lineHeight: 1.7,
                                fontWeight: 500,
                              }}
                            >
                              Discover sustainable weight loss with our GLP-1 program. Your transformation starts here.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </section>

                {/* Lead Capture Form Section */}
                <section className="py-12 pb-20 px-4 sm:px-6 lg:px-8" id="contact-form">
                  <div className="max-w-2xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.7 }}
                    >
                      {/* Form Header */}
                      <div className="text-center mb-8">
                        <h2
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                            fontWeight: 900,
                            color: colors.deepWinter,
                            marginBottom: '1rem',
                            textShadow: '2px 2px 4px rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          Claim Your Winter Wellness Offer
                        </h2>
                        <p
                          style={{
                            color: colors.deepWinter,
                            fontSize: '1.2rem',
                            lineHeight: 1.8,
                            fontWeight: 500,
                          }}
                        >
                          Fill out the form below and our team will reach out within 24 hours to schedule your consultation.
                        </p>
                      </div>

                      {/* Form Card */}
                      <div
                        className="relative"
                        style={{
                          background: `linear-gradient(135deg, ${colors.winterWhite}F5, ${colors.iceCyan}F5)`,
                          backdropFilter: 'blur(10px)',
                          border: `3px solid ${colors.modaCyan}`,
                          borderRadius: '20px',
                          boxShadow: `0 20px 40px ${colors.modaCyan}20`,
                          padding: '2.5rem',
                        }}
                      >
                        <form onSubmit={handleSubmit} className="space-y-5">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              label="First Name"
                              value={formData.firstName}
                              onChange={(v) => handleInputChange('firstName', v)}
                              error={errors.firstName}
                              placeholder="First name"
                            />
                            <FormField
                              label="Last Name"
                              value={formData.lastName}
                              onChange={(v) => handleInputChange('lastName', v)}
                              error={errors.lastName}
                              placeholder="Last name"
                            />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              label="Email"
                              type="email"
                              value={formData.email}
                              onChange={(v) => handleInputChange('email', v)}
                              error={errors.email}
                              placeholder="your@email.com"
                            />
                            <FormField
                              label="Phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(v) => handleInputChange('phone', v)}
                              error={errors.phone}
                              placeholder="(555) 555-5555"
                            />
                          </div>
                          <FormField
                            label="Street Address"
                            value={formData.streetAddress}
                            onChange={(v) => handleInputChange('streetAddress', v)}
                            error={errors.streetAddress}
                            placeholder="123 Main Street"
                          />
                          <div className="grid sm:grid-cols-3 gap-4">
                            <FormField
                              label="City"
                              value={formData.city}
                              onChange={(v) => handleInputChange('city', v)}
                              error={errors.city}
                              placeholder="City"
                            />
                            <FormField
                              label="State"
                              value={formData.state}
                              onChange={(v) => handleInputChange('state', v)}
                              error={errors.state}
                              placeholder="State"
                            />
                            <FormField
                              label="ZIP Code"
                              value={formData.zip}
                              onChange={(v) => handleInputChange('zip', v)}
                              error={errors.zip}
                              placeholder="12345"
                            />
                          </div>

                          {/* Offer Selection Dropdown */}
                          <div className="space-y-1">
                            <label
                              className="block text-sm font-semibold"
                              style={{
                                color: colors.deepWinter,
                                letterSpacing: '0.05em',
                                fontFamily: "'Montserrat', sans-serif",
                              }}
                            >
                              Which offer interests you?
                            </label>
                            <select
                              value={formData.offerInterest}
                              onChange={(e) => handleInputChange('offerInterest', e.target.value)}
                              className="w-full px-4 py-3 transition-all duration-200 focus:outline-none rounded-lg"
                              style={{
                                background: colors.winterWhite,
                                border: `2px solid ${errors.offerInterest ? '#ef4444' : colors.modaCyan}`,
                                color: colors.deepWinter,
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: '16px',
                              }}
                            >
                              <option value="">Select an offer...</option>
                              <option value="mesotherapy">Mesotherapy - $200 OFF</option>
                              <option value="glp1">GLP-1 Weightloss - $50 OFF First Month</option>
                              <option value="both">Both Offers</option>
                            </select>
                            {errors.offerInterest && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs mt-1"
                                style={{ color: '#ef4444' }}
                              >
                                {errors.offerInterest}
                              </motion.p>
                            )}
                          </div>

                          {/* A2P Consent */}
                          <div className="space-y-3 pt-2">
                            <label className="flex items-start gap-3 cursor-pointer group">
                              <div className="relative flex-shrink-0 mt-1">
                                <input
                                  type="checkbox"
                                  checked={consentChecked}
                                  onChange={(e) => {
                                    setConsentChecked(e.target.checked)
                                    if (e.target.checked) setShowConsentError(false)
                                  }}
                                  className="sr-only"
                                />
                                <div
                                  className="w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200"
                                  style={{
                                    borderColor: consentChecked ? colors.modaCyan : colors.deepWinter,
                                    background: consentChecked ? colors.modaCyan : 'transparent',
                                  }}
                                >
                                  {consentChecked && <Check className="w-3 h-3" style={{ color: colors.winterWhite }} />}
                                </div>
                              </div>
                              <span className="text-xs leading-relaxed" style={{ color: colors.deepWinter }}>
                                By checking this box, I consent to receive marketing and promotional communications, including SMS/text messages and emails, from MODA Aesthetics + Wellness and Noveris Data LLC (operating Senova CRM) at the phone number and email address provided. Message frequency varies. Message and data rates may apply. Reply STOP to opt-out of SMS at any time. Reply HELP for help. I understand that my consent is not a condition of purchase. View our{' '}
                                <a
                                  href="https://crm.senovallc.com/privacy-policy"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:no-underline"
                                  style={{ color: colors.modaCyan }}
                                >
                                  Privacy Policy
                                </a>
                                {' '}and{' '}
                                <a
                                  href="https://crm.senovallc.com/terms-of-service"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:no-underline"
                                  style={{ color: colors.modaCyan }}
                                >
                                  Terms of Service
                                </a>.
                              </span>
                            </label>

                            <AnimatePresence>
                              {showConsentError && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="p-3 rounded"
                                  style={{
                                    background: `#ef444410`,
                                    border: `1px solid #ef4444`
                                  }}
                                >
                                  <p className="text-sm" style={{ color: '#ef4444' }}>
                                    ❄️ To receive your exclusive winter offer, we need your permission to contact you. Please check the consent box above.
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Submit Button */}
                          <motion.button
                            type="submit"
                            disabled={isSubmitting || !consentChecked}
                            className="w-full py-4 px-8 font-bold text-lg relative overflow-hidden group"
                            style={{
                              background: consentChecked ? colors.modaButton : colors.silverGray,
                              color: colors.winterWhite,
                              borderRadius: '12px',
                              border: `3px solid ${colors.modaCyan}`,
                              boxShadow: consentChecked ? `0 10px 30px ${colors.modaCyan}40` : 'none',
                              letterSpacing: '0.05em',
                              fontFamily: "'Montserrat', sans-serif",
                              opacity: consentChecked ? 1 : 0.6,
                              cursor: consentChecked ? 'pointer' : 'not-allowed',
                            }}
                            whileHover={consentChecked ? { scale: 1.02 } : {}}
                            whileTap={consentChecked ? { scale: 0.98 } : {}}
                          >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  Sending Your Request...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-5 h-5" />
                                  Claim My Winter Wellness Offer
                                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                              )}
                            </span>

                            {/* Glow effect when enabled */}
                            {consentChecked && (
                              <motion.div
                                className="absolute inset-0"
                                style={{
                                  background: `linear-gradient(90deg, transparent, ${colors.modaCyan}40, transparent)`,
                                }}
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: 'linear',
                                }}
                              />
                            )}
                          </motion.button>
                        </form>
                      </div>
                    </motion.div>
                  </div>
                </section>
              </motion.div>
            ) : (
              /* Thank You State */
              <motion.div
                key="thankyou"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: 'spring', stiffness: 100, damping: 15 }}
                className="flex-1 min-h-screen flex items-center justify-center px-4 py-16"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.iceCyan}F5, ${colors.frostBlue}F5), url('/moda-winter/pine-branches.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="max-w-lg w-full text-center">
                  {/* Success Animation with Winter Theme */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 10 }}
                    className="relative mx-auto mb-8 w-32 h-32"
                  >
                    <div
                      className="w-32 h-32 rounded-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.modaCyan}, ${colors.sparkleCyan})`,
                        boxShadow: `0 0 60px ${colors.modaCyan}50`,
                      }}
                    >
                      <Check className="w-16 h-16" style={{ color: colors.winterWhite }} />
                    </div>

                    {/* Snowflake Burst */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        style={{ left: '50%', top: '50%' }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          x: Math.cos((i * 45 * Math.PI) / 180) * 80 - 8,
                          y: Math.sin((i * 45 * Math.PI) / 180) * 80 - 8,
                        }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1.5, ease: 'easeOut' }}
                      >
                        <Star
                          className="w-6 h-6"
                          style={{ color: colors.modaCyan }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-6"
                  >
                    <h2
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '3rem',
                        color: colors.deepWinter,
                        fontWeight: 900,
                      }}
                    >
                      Thank You!
                    </h2>
                    <p
                      className="text-lg"
                      style={{
                        color: colors.deepWinter,
                        lineHeight: 1.8,
                        fontWeight: 500,
                      }}
                    >
                      ❄️ Thank you for your interest! A Moda team member will reach out to you soon to discuss your winter wellness journey.
                    </p>

                    <div
                      className="flex items-center justify-center gap-3 pt-4"
                      style={{ color: colors.modaCyan }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>✨</span>
                      <span
                        className="text-sm tracking-widest uppercase"
                        style={{
                          letterSpacing: '0.15em',
                          color: colors.deepWinter,
                          fontWeight: 600,
                        }}
                      >
                        MODA Aesthetics + Wellness
                      </span>
                      <span style={{ fontSize: '1.5rem' }}>✨</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

// Form Field Component
function FormField({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label
        className="block text-sm font-semibold"
        style={{
          color: colors.deepWinter,
          letterSpacing: '0.05em',
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 transition-all duration-200 focus:outline-none rounded-lg"
        style={{
          background: colors.winterWhite,
          border: `2px solid ${error ? '#ef4444' : colors.modaCyan}`,
          color: colors.deepWinter,
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '16px',
        }}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs"
          style={{ color: '#ef4444' }}
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
