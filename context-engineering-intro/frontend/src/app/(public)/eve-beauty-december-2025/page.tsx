'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Star, ArrowRight, Loader2, Gift, Sparkles, Heart } from 'lucide-react'

// Google Fonts Import for Festive Typography
const fontImportStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Crimson+Pro:wght@300;400;500;600&display=swap');
`

// Professional spa and Christmas images - VERIFIED ADULTS ONLY (no children)
const christmasImages = {
  hero: 'https://images.unsplash.com/photo-1761718209793-cb6d348831e0?w=1920&q=80', // Premium spa facial treatment
  wreath: 'https://images.unsplash.com/photo-1639334317586-ced6c3ce407a?w=600&q=80', // Christmas wreath
  mainTreatment: 'https://images.unsplash.com/photo-1731514771613-991a02407132?w=1200&q=80', // Luxury spa treatment
  gallery1: 'https://images.unsplash.com/photo-1710196598595-7dcfd465bd77?w=800&q=80', // Spa gallery image 1
  gallery2: 'https://images.unsplash.com/photo-1761718210055-e83ca7e2c9ad?w=800&q=80', // Spa gallery image 2
  gallery3: 'https://images.unsplash.com/photo-1747324831504-5ee9aa8eec59?w=800&q=80', // Spa gallery image 3
  gallery4: 'https://images.unsplash.com/photo-1725034246182-0bb08e80d7e3?w=800&q=80', // Spa gallery image 4
  accent: 'https://images.unsplash.com/photo-1605140403267-8095c7fda6e5?w=600&q=80', // Christmas decorations
}

// Christmas Color Palette inspired by Mr. Christmas
const colors = {
  forestGreen: '#1a4d2e',      // Deep forest green
  cream: '#faf5e4',             // Off-white/cream
  crimsonRed: '#c41e3a',        // Bold crimson red
  gold: '#d4af37',              // Gold accents
  darkGreen: '#0d2818',         // Darker green for depth
  burgundy: '#8b0000',          // Deep burgundy
  white: '#ffffff',             // Pure white
  parchment: '#f5f0e6',         // Parchment for form
}

// Snowflake Component with gentle floating animation
const Snowflake = ({ delay }: { delay: number }) => {
  const randomLeft = Math.random() * 100
  const randomDuration = 15 + Math.random() * 10
  const randomSize = 8 + Math.random() * 16

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${randomLeft}%`,
        top: -50,
        fontSize: randomSize,
        color: colors.white,
        opacity: 0.7,
        filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.5))',
      }}
      animate={{
        y: 'calc(100vh + 100px)',
        x: [0, 20, -20, 10, 0],
        rotate: [0, 360],
      }}
      transition={{
        y: { duration: randomDuration, ease: 'linear', repeat: Infinity, delay },
        x: { duration: 5, ease: 'easeInOut', repeat: Infinity, delay },
        rotate: { duration: randomDuration, ease: 'linear', repeat: Infinity, delay },
      }}
    >
      ❄
    </motion.div>
  )
}

// Sparkle Component for magical effect
const SparkleEffect = ({ x, y }: { x: string; y: string }) => {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1.5, 0],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: Math.random() * 3,
      }}
    >
      <Sparkles className="w-4 h-4" style={{ color: colors.gold }} />
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
}

export default function EveBeautyDecember2025Page() {
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
      // Eve Beauty MA object ID - hardcoded since /api/v1/objects requires authentication
      // and this is a public landing page
      const EVE_BEAUTY_MA_OBJECT_ID = '47f4dfdf-f129-429d-9a8a-4ddbaf7a26b4'

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
        tags: ['Eve Beauty MA Promotional Holiday Form Submission'],
        object_id: EVE_BEAUTY_MA_OBJECT_ID,
        sms_consent: true,
        email_consent: true,
      }

      // Submit to API - check if we're on production or local
      const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'crm.senovallc.com'
        ? 'https://crm.senovallc.com/api/v1/contacts/'
        : 'http://localhost:8000/api/v1/contacts/';

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
      // Show error state instead of fake success
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
          fontFamily: "'Crimson Pro', serif",
        }}
      >
        {/* Elegant Wrapping Paper Background Pattern - Subtle damask-inspired */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 0% 0%, ${colors.gold}08 0%, transparent 50%),
              radial-gradient(ellipse at 100% 0%, ${colors.crimsonRed}06 0%, transparent 50%),
              radial-gradient(ellipse at 50% 100%, ${colors.forestGreen}08 0%, transparent 50%)
            `,
          }}
        />

        {/* Elegant diagonal pinstripe pattern */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                135deg,
                transparent,
                transparent 40px,
                ${colors.gold}08 40px,
                ${colors.gold}08 41px,
                transparent 41px,
                transparent 80px
              )
            `,
          }}
        />

        {/* Subtle holly leaf pattern using CSS */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 10% 20%, ${colors.forestGreen}12 2px, transparent 2px),
              radial-gradient(circle at 90% 80%, ${colors.crimsonRed}15 3px, transparent 3px),
              radial-gradient(circle at 85% 15%, ${colors.gold}10 2px, transparent 2px),
              radial-gradient(circle at 15% 85%, ${colors.forestGreen}10 2px, transparent 2px)
            `,
            backgroundSize: '200px 200px',
          }}
        />

        {/* Cream base background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.parchment} 100%)`,
            zIndex: -1,
          }}
        />

        {/* Snowflakes */}
        {mounted && Array.from({ length: 20 }, (_, i) => (
          <Snowflake key={`snow-${i}`} delay={i * 0.5} />
        ))}

        {/* Sparkle Effects at specific positions */}
        {mounted && (
          <>
            <SparkleEffect x="10%" y="20%" />
            <SparkleEffect x="85%" y="15%" />
            <SparkleEffect x="15%" y="70%" />
            <SparkleEffect x="90%" y="60%" />
            <SparkleEffect x="50%" y="10%" />
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
                {/* Hero Section with Background */}
                <section
                  className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, ${colors.cream}E6 0%, ${colors.cream}F2 50%, ${colors.cream} 100%), url('${christmasImages.hero}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    backgroundAttachment: 'fixed',
                  }}
                >
                  <div className="max-w-6xl mx-auto text-center">
                    {/* Christmas Gift Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                        duration: 1
                      }}
                      className="flex justify-center mb-6"
                    >
                      <div className="relative">
                        <Gift className="w-16 h-16" style={{ color: colors.crimsonRed }} />
                        <motion.div
                          animate={{
                            y: [-2, 2, -2],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="absolute -top-2 -right-2"
                        >
                          <Star className="w-6 h-6" style={{ color: colors.gold }} />
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.2 }}
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 'clamp(3rem, 7vw, 6rem)',
                        fontWeight: 900,
                        color: colors.forestGreen,
                        lineHeight: 1.1,
                        textShadow: `3px 3px 6px rgba(0, 0, 0, 0.2)`,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      <span className="block mb-2">Unwrap Your</span>
                      <span
                        className="block"
                        style={{
                          background: `linear-gradient(135deg, ${colors.crimsonRed} 0%, ${colors.burgundy} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontSize: 'clamp(3.5rem, 8vw, 7rem)',
                        }}
                      >
                        Radiant Holiday Glow
                      </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.25 }}
                      className="text-xl mt-6 mb-4"
                      style={{
                        color: colors.crimsonRed,
                        fontWeight: 600,
                      }}
                    >
                      Limited Holiday HydraFacial Packages Available - Book Before December 15th
                    </motion.p>

                    {/* Subheadline with festive border */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      className="mt-8 mb-6 max-w-4xl mx-auto"
                    >
                      <div
                        className="p-8"
                        style={{
                          background: `${colors.white}98`,
                          border: `3px dashed ${colors.crimsonRed}`,
                          borderRadius: '12px',
                          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.15)',
                        }}
                      >
                        <p
                          className="text-xl leading-relaxed"
                          style={{
                            color: colors.forestGreen,
                            lineHeight: 1.9,
                            fontWeight: 500,
                            letterSpacing: '0.02em',
                          }}
                        >
                          <span style={{ fontSize: '1.5rem', color: colors.crimsonRed }}>🎄</span>
                          {' '}Transform your skin with Eve Beauty's signature{' '}
                          <strong style={{ color: colors.crimsonRed, fontSize: '1.15em' }}>HydraFacial</strong> treatment,
                          trusted by thousands of Wakefield clients since 2016. Experience the instant luminosity that makes
                          you the star of every holiday gathering, with our patented HydraFacial technology that delivers
                          immediate, camera-ready results.{' '}
                          <span style={{ fontSize: '1.5rem', color: colors.crimsonRed }}>🎄</span>
                        </p>
                      </div>
                    </motion.div>

                    {/* Hero CTA Button */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="mb-8"
                    >
                      <button
                        onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-10 py-4 font-bold text-lg relative overflow-hidden group"
                        style={{
                          background: `linear-gradient(135deg, ${colors.crimsonRed} 0%, ${colors.burgundy} 100%)`,
                          color: colors.white,
                          borderRadius: '50px',
                          border: `3px solid ${colors.gold}`,
                          boxShadow: '0 10px 30px rgba(196, 30, 58, 0.3)',
                          letterSpacing: '0.05em',
                          fontFamily: "'Playfair Display', serif",
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 15px 40px rgba(196, 30, 58, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 10px 30px rgba(196, 30, 58, 0.3)';
                        }}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          <Sparkles className="w-5 h-5" />
                          Discover Your Glow
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>
                    </motion.div>

                    {/* Trust Indicators Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.45 }}
                      className="mt-12 mb-8"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
                        {[
                          { icon: '✅', text: 'Certified HydraFacial Provider Since 2016' },
                          { icon: '⭐', text: 'Over 5,000+ Treatments Performed' },
                          { icon: '👩‍⚕️', text: 'Licensed Medical Estheticians' },
                          { icon: '🔬', text: 'FDA-Cleared Technology' },
                          { icon: '💎', text: '200+ 5-Star Reviews' },
                          { icon: '🏆', text: 'Best of Wakefield 2023' },
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                            className="text-center p-3"
                            style={{
                              background: `${colors.white}95`,
                              borderRadius: '8px',
                              border: `1px solid ${colors.gold}`,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <p
                              className="text-xs font-semibold"
                              style={{
                                color: colors.forestGreen,
                                lineHeight: 1.4,
                              }}
                            >
                              {item.text}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Location Badge with Holly decoration */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.2, delay: 0.6 }}
                      className="flex items-center justify-center gap-3"
                      style={{ color: colors.forestGreen }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>🎅</span>
                      <span
                        className="text-sm tracking-widest uppercase"
                        style={{ letterSpacing: '0.2em' }}
                      >
                        Eve Beauty • Wakefield, MA • Est. 2016
                      </span>
                      <span style={{ fontSize: '1.5rem' }}>🎅</span>
                    </motion.div>
                  </div>
                </section>

                {/* Hero Image Section - Picture Yourself with Radiant Holiday Glow */}
                <section className="py-8 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-5xl mx-auto">
                    {/* Section Heading */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.5 }}
                      className="text-center mb-8"
                    >
                      <h2
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: '3rem',
                          fontWeight: 700,
                          color: colors.forestGreen,
                          marginBottom: '0.5rem',
                        }}
                      >
                        Picture Your Transformation
                      </h2>
                      <p
                        style={{
                          color: colors.crimsonRed,
                          fontSize: '1.3rem',
                          fontWeight: 600,
                        }}
                      >
                        Walk into Every Holiday Event with Confidence That Radiates
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.6 }}
                      className="relative rounded-2xl overflow-hidden"
                      style={{
                        boxShadow: `0 25px 60px rgba(139, 0, 0, 0.3), 0 0 0 4px ${colors.gold}`,
                      }}
                    >
                      {/* Main Treatment Image */}
                      <div className="relative h-[400px] md:h-[500px]">
                        <img
                          src={christmasImages.mainTreatment}
                          alt="Luxury HydraFacial treatment at Eve Beauty spa"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: 'center center' }}
                        />
                        {/* Darker gradient overlay for better text contrast */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to right, ${colors.forestGreen}E8 0%, ${colors.forestGreen}95 40%, transparent 70%)`,
                          }}
                        />
                        {/* Text Overlay with solid background card for guaranteed readability */}
                        <div className="absolute inset-0 flex items-center justify-start p-6 md:p-12">
                          <div
                            className="max-w-md p-6 rounded-xl"
                            style={{
                              background: `${colors.forestGreen}F0`,
                              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                              border: `2px solid ${colors.gold}40`,
                            }}
                          >
                            <h3
                              style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                                fontWeight: 700,
                                color: colors.white,
                                lineHeight: 1.2,
                                marginBottom: '1rem',
                                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.4)',
                                letterSpacing: '0.02em',
                              }}
                            >
                              Your Radiant
                              <br />
                              <span style={{ color: colors.gold, fontSize: '1.1em' }}>Holiday Transformation</span>
                            </h3>
                            <p
                              style={{
                                color: colors.cream,
                                fontSize: '1.1rem',
                                lineHeight: 1.7,
                                fontWeight: 400,
                              }}
                            >
                              Imagine catching your reflection and seeing skin so luminous, so hydrated, so flawless that you skip the foundation entirely.
                              Feel the silk-smooth texture as you apply your holiday makeup effortlessly, knowing your HydraFacial glow is the perfect canvas.
                              This is your season to shine brighter than the holiday lights.
                            </p>
                          </div>
                        </div>
                        {/* Decorative Christmas wreath in corner */}
                        <div
                          className="absolute top-4 right-4 w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden opacity-95"
                          style={{
                            boxShadow: '0 6px 25px rgba(0, 0, 0, 0.4)',
                            border: `3px solid ${colors.gold}`,
                          }}
                        >
                          <img
                            src={christmasImages.wreath}
                            alt="Beautiful Christmas wreath"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </section>

                {/* Image Gallery - Real Results */}
                <section className="py-8 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-5xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.55 }}
                      className="text-center mb-8"
                    >
                      <h3
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: '2.5rem',
                          fontWeight: 700,
                          color: colors.forestGreen,
                          marginBottom: '0.5rem',
                        }}
                      >
                        Real Transformations, Radiant Results
                      </h3>
                      <p style={{ color: colors.crimsonRed, fontSize: '1.2rem', fontWeight: 600 }}>
                        Join thousands of Wakefield clients who discovered their glow with HydraFacial
                      </p>
                    </motion.div>

                    {/* Image Grid - Professional Spa Results */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { src: christmasImages.gallery1, alt: 'Woman enjoying luxury HydraFacial treatment' },
                        { src: christmasImages.gallery2, alt: 'Client experiencing spa facial with radiant results' },
                        { src: christmasImages.gallery3, alt: 'Professional esthetician providing HydraFacial' },
                        { src: christmasImages.gallery4, alt: 'Happy client with glowing skin after treatment' },
                      ].map((img, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                          className="relative rounded-xl overflow-hidden group"
                          style={{
                            aspectRatio: '1',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `linear-gradient(to top, ${colors.crimsonRed}80, transparent)`,
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* Caption */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1, delay: 1 }}
                      className="text-center mt-6 mb-8"
                      style={{
                        color: colors.forestGreen,
                        fontSize: '1rem',
                        fontStyle: 'italic',
                        fontWeight: 500,
                      }}
                    >
                      ✨ Discover what's possible when you invest in yourself — real transformations from women just like you ✨
                    </motion.p>

                    {/* Gallery CTA Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.2 }}
                      className="text-center"
                    >
                      <button
                        onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-10 py-4 font-semibold text-lg relative group"
                        style={{
                          background: `linear-gradient(135deg, ${colors.forestGreen} 0%, ${colors.darkGreen} 100%)`,
                          color: colors.white,
                          borderRadius: '50px',
                          border: `2px solid ${colors.gold}`,
                          boxShadow: '0 8px 25px rgba(26, 77, 46, 0.3)',
                          letterSpacing: '0.03em',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 12px 35px rgba(26, 77, 46, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(26, 77, 46, 0.3)';
                        }}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          <Heart className="w-5 h-5" />
                          Begin Your Transformation
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>
                    </motion.div>
                  </div>
                </section>

                {/* Gift Box Offers Section */}
                <section className="py-12 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-5xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.5 }}
                      className="text-center mb-12"
                    >
                      <h2
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: '3rem',
                          fontWeight: 700,
                          color: colors.forestGreen,
                          marginBottom: '0.5rem',
                        }}
                      >
                        Holiday Special Offers
                      </h2>
                      <p
                        style={{
                          color: colors.crimsonRed,
                          fontSize: '1.2rem',
                          fontWeight: 600,
                        }}
                      >
                        🎁 Limited Time Only - Unwrap Your Savings! 🎁
                      </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Gift Box 1 - The Eve Glow Experience */}
                      <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        whileHover={{
                          y: -10,
                          transition: { duration: 0.3 }
                        }}
                        className="relative"
                      >
                        {/* Gift Box Container with Luxury Velvet Texture */}
                        <div
                          className="relative h-full min-h-[500px] luxury-gift-box"
                          style={{
                            background: `linear-gradient(135deg, #4A0E1C 0%, #6B1F2E 40%, #8B2F3E 60%, #6B1F2E 100%)`,
                            borderRadius: '12px',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 15px 30px rgba(0, 0, 0, 0.2), 0 10px 20px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.1)',
                            overflow: 'hidden',
                            border: '2px solid transparent',
                            position: 'relative',
                          }}
                        >
                          {/* Velvet texture overlay */}
                          <div
                            className="absolute inset-0 pointer-events-none opacity-20"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='damask' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M50 10 C45 15, 40 20, 35 30 C30 40, 30 50, 35 60 C40 70, 45 75, 50 80 C55 75, 60 70, 65 60 C70 50, 70 40, 65 30 C60 20, 55 15, 50 10' fill='none' stroke='%23FFFFFF' stroke-width='0.5' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23damask)'/%3E%3C/svg%3E")`,
                            }}
                          />

                          {/* Gold metallic border glow */}
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              border: '3px solid transparent',
                              borderImage: 'linear-gradient(135deg, #B8860B 0%, #FFD700 25%, #FFA500 50%, #FFD700 75%, #B8860B 100%) 1',
                              borderRadius: '12px',
                            }}
                          />
                          {/* 3D Ribbon Horizontal */}
                          <div
                            className="absolute top-1/2 left-0 right-0 h-14 -translate-y-1/2"
                            style={{
                              background: `linear-gradient(135deg, #B8860B 0%, #FFD700 25%, #FFA500 50%, #FFD700 75%, #B8860B 100%)`,
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
                              zIndex: 5,
                            }}
                          />

                          {/* 3D Ribbon Vertical */}
                          <div
                            className="absolute left-1/2 top-0 bottom-0 w-14 -translate-x-1/2"
                            style={{
                              background: `linear-gradient(135deg, #B8860B 0%, #FFD700 25%, #FFA500 50%, #FFD700 75%, #B8860B 100%)`,
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
                              zIndex: 5,
                            }}
                          />

                          {/* 3D Bow on Top */}
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                            {/* Bow left loop */}
                            <div
                              className="absolute"
                              style={{
                                width: '60px',
                                height: '50px',
                                background: `linear-gradient(135deg, #B8860B 0%, #FFD700 25%, #FFA500 50%, #FFD700 75%, #B8860B 100%)`,
                                borderRadius: '50% 0 50% 50%',
                                transform: 'rotate(-25deg) translateX(-25px)',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
                              }}
                            />
                            {/* Bow right loop */}
                            <div
                              className="absolute"
                              style={{
                                width: '60px',
                                height: '50px',
                                background: `linear-gradient(135deg, #B8860B 0%, #FFD700 25%, #FFA500 50%, #FFD700 75%, #B8860B 100%)`,
                                borderRadius: '50% 0 50% 50%',
                                transform: 'rotate(25deg) translateX(25px) scaleX(-1)',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
                              }}
                            />
                            {/* Bow center knot */}
                            <div
                              className="absolute"
                              style={{
                                width: '35px',
                                height: '35px',
                                background: `radial-gradient(circle, #FFD700 30%, #FFA500 50%, #B8860B 70%)`,
                                borderRadius: '50%',
                                transform: 'translateX(-17px) translateY(8px)',
                                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Star className="w-5 h-5" style={{ color: colors.white }} />
                            </div>
                          </div>

                          {/* Gift Tag */}
                          <div
                            className="absolute top-4 right-4 transform rotate-12 z-15"
                            style={{
                              background: `linear-gradient(135deg, ${colors.gold}, #ffd700)`,
                              padding: '10px 20px',
                              borderRadius: '6px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                              border: `2px solid ${colors.burgundy}`,
                            }}
                          >
                            <p
                              className="text-sm font-bold uppercase"
                              style={{
                                color: colors.burgundy,
                                letterSpacing: '0.15em',
                                textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)',
                              }}
                            >
                              Most Popular
                            </p>
                          </div>

                          {/* Content */}
                          <div className="relative p-10 pt-20 text-center" style={{ zIndex: 20 }}>
                            <h3
                              style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '3rem',
                                fontWeight: 900,
                                color: colors.white,
                                marginBottom: '0.5rem',
                                textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2)',
                                letterSpacing: '1px',
                              }}
                            >
                              The Eve Glow Experience
                            </h3>

                            <p
                              style={{
                                fontFamily: "'Inter', 'Helvetica', sans-serif",
                                fontSize: '1.3rem',
                                fontWeight: 300,
                                color: 'rgba(255, 255, 255, 0.95)',
                                textShadow: '1px 1px 3px rgba(0, 0, 0, 0.4)',
                                letterSpacing: '0.5px',
                                marginBottom: '1.5rem',
                              }}
                            >
                              Monthly Membership
                            </p>

                            <p
                              className="mb-6 mx-auto max-w-sm"
                              style={{
                                color: colors.cream,
                                fontSize: '1.05rem',
                                lineHeight: 1.7,
                                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                              }}
                            >
                              Picture yourself, month after month, with that fresh-from-the-spa radiance that turns heads. Your skin, deeply nourished and visibly transformed.
                            </p>

                            <div className="mb-6">
                              <div className="flex items-baseline justify-center gap-2">
                                <span
                                  style={{
                                    fontSize: '4rem',
                                    fontWeight: 900,
                                    color: '#FFD700',
                                    textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 215, 0, 0.4)',
                                  }}
                                >
                                  $179
                                </span>
                                <span style={{ color: colors.cream, fontSize: '1.3rem', fontWeight: 600 }}>/month</span>
                              </div>
                              <p
                                className="text-sm mt-2"
                                style={{ color: colors.gold, fontWeight: 600 }}
                              >
                                <span className="line-through opacity-85">Value: $500+</span>
                              </p>
                            </div>

                            <ul className="space-y-3 text-left max-w-md mx-auto mb-6">
                              {[
                                'Monthly HydraFacial ($350 value) - deep cleanse, extract, hydrate',
                                '15% off all skincare products - SkinCeuticals, ZO, EltaMD',
                                'Priority holiday booking - skip the waitlist, book same-day',
                                'VIP member events - exclusive product launches & treatments',
                                'Birthday month gift - complimentary LED therapy add-on ($75 value)'
                              ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{
                                      background: `linear-gradient(135deg, #B8860B 0%, #FFD700 50%, #B8860B 100%)`,
                                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                    }}
                                  >
                                    <Check className="w-4 h-4" style={{ color: colors.burgundy }} />
                                  </div>
                                  <span style={{ color: colors.cream, fontSize: '1rem' }}>
                                    {item}
                                  </span>
                                </li>
                              ))}
                            </ul>

                            {/* Urgency text */}
                            <p
                              className="mb-6 text-center"
                              style={{
                                color: colors.gold,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)',
                              }}
                            >
                              🎁 Only 17 Holiday HydraFacial Packages Remaining 🎁
                            </p>

                            {/* CTA Button inside gift box */}
                            <button
                              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                              className="px-8 py-3 font-bold text-base relative group mx-auto"
                              style={{
                                background: `linear-gradient(135deg, #B8860B 0%, #FFD700 25%, #FFA500 50%, #FFD700 75%, #B8860B 100%)`,
                                color: colors.burgundy,
                                borderRadius: '50px',
                                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                border: 'none',
                                display: 'inline-block',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
                              }}
                            >
                              Begin Your Transformation
                            </button>
                          </div>
                        </div>
                      </motion.div>

                      {/* Gift Box 2 - The Perfect Gift */}
                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.7 }}
                        whileHover={{
                          y: -10,
                          transition: { duration: 0.3 }
                        }}
                        className="relative"
                      >
                        {/* Gift Box Container with Luxury Satin Texture */}
                        <div
                          className="relative h-full min-h-[500px] luxury-gift-box"
                          style={{
                            background: `linear-gradient(135deg, #083D32 0%, #0C5F4C 40%, #0E7A5F 60%, #0C5F4C 100%)`,
                            borderRadius: '12px',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 15px 30px rgba(0, 0, 0, 0.2), 0 10px 20px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.1)',
                            overflow: 'hidden',
                            border: '2px solid transparent',
                            position: 'relative',
                          }}
                        >
                          {/* Satin texture overlay */}
                          <div
                            className="absolute inset-0 pointer-events-none opacity-15"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='damask2' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M50 10 C45 15, 40 20, 35 30 C30 40, 30 50, 35 60 C40 70, 45 75, 50 80 C55 75, 60 70, 65 60 C70 50, 70 40, 65 30 C60 20, 55 15, 50 10' fill='none' stroke='%23FFFFFF' stroke-width='0.5' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23damask2)'/%3E%3C/svg%3E")`,
                            }}
                          />

                          {/* Silver metallic border glow */}
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              border: '3px solid transparent',
                              borderImage: 'linear-gradient(135deg, #C0C0C0 0%, #E5E5E5 25%, #FFFFFF 50%, #E5E5E5 75%, #C0C0C0 100%) 1',
                              borderRadius: '12px',
                            }}
                          />
                          {/* 3D Ribbon Horizontal */}
                          <div
                            className="absolute top-1/2 left-0 right-0 h-14 -translate-y-1/2 z-10"
                            style={{
                              background: `linear-gradient(135deg, #8B0000 0%, #DC143C 40%, #FF6B6B 50%, #DC143C 60%, #8B0000 100%)`,
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
                            }}
                          />

                          {/* 3D Ribbon Vertical */}
                          <div
                            className="absolute left-1/2 top-0 bottom-0 w-14 -translate-x-1/2 z-5"
                            style={{
                              background: `linear-gradient(135deg, #8B0000 0%, #DC143C 40%, #FF6B6B 50%, #DC143C 60%, #8B0000 100%)`,
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
                            }}
                          />

                          {/* 3D Bow on Top */}
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                            {/* Bow left loop */}
                            <div
                              className="absolute"
                              style={{
                                width: '60px',
                                height: '50px',
                                background: `linear-gradient(135deg, #8B0000 0%, #DC143C 40%, #FF6B6B 50%, #DC143C 60%, #8B0000 100%)`,
                                borderRadius: '50% 0 50% 50%',
                                transform: 'rotate(-25deg) translateX(-25px)',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
                              }}
                            />
                            {/* Bow right loop */}
                            <div
                              className="absolute"
                              style={{
                                width: '60px',
                                height: '50px',
                                background: `linear-gradient(135deg, #8B0000 0%, #DC143C 40%, #FF6B6B 50%, #DC143C 60%, #8B0000 100%)`,
                                borderRadius: '50% 0 50% 50%',
                                transform: 'rotate(25deg) translateX(25px) scaleX(-1)',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
                              }}
                            />
                            {/* Bow center knot */}
                            <div
                              className="absolute"
                              style={{
                                width: '35px',
                                height: '35px',
                                background: `radial-gradient(circle, #FF6B6B 30%, #DC143C 50%, #8B0000 70%)`,
                                borderRadius: '50%',
                                transform: 'translateX(-17px) translateY(8px)',
                                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Heart className="w-5 h-5" style={{ color: colors.white }} />
                            </div>
                          </div>

                          {/* Gift Tag */}
                          <div
                            className="absolute top-4 right-4 transform rotate-12 z-15"
                            style={{
                              background: `linear-gradient(135deg, #C0C0C0, #E5E5E5, #FFFFFF)`,
                              padding: '10px 20px',
                              borderRadius: '6px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                              border: `2px solid ${colors.forestGreen}`,
                            }}
                          >
                            <p
                              className="text-sm font-bold uppercase"
                              style={{
                                color: colors.forestGreen,
                                letterSpacing: '0.15em',
                                textShadow: '1px 1px 2px rgba(255, 255, 255, 0.5)',
                              }}
                            >
                              Thoughtful Gift
                            </p>
                          </div>

                          {/* Content */}
                          <div className="relative p-10 pt-20 text-center" style={{ zIndex: 20 }}>
                            <h3
                              style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '3rem',
                                fontWeight: 900,
                                color: colors.white,
                                marginBottom: '0.5rem',
                                textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(192, 192, 192, 0.2)',
                                letterSpacing: '1px',
                              }}
                            >
                              The Perfect Gift
                            </h3>

                            <p
                              style={{
                                fontFamily: "'Inter', 'Helvetica', sans-serif",
                                fontSize: '1.3rem',
                                fontWeight: 300,
                                color: 'rgba(255, 255, 255, 0.95)',
                                textShadow: '1px 1px 3px rgba(0, 0, 0, 0.4)',
                                letterSpacing: '0.5px',
                                marginBottom: '1.5rem',
                              }}
                            >
                              Holiday Gift Cards
                            </p>

                            <p
                              className="mb-6 mx-auto max-w-sm"
                              style={{
                                color: colors.cream,
                                fontSize: '1.05rem',
                                lineHeight: 1.7,
                                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                              }}
                            >
                              Give someone the gift they'll actually love. The kind of gift that says 'I want you to feel amazing.' Our gift cards never expire, because great skin is timeless.
                            </p>

                            <div className="mb-6">
                              <div className="flex items-baseline justify-center gap-3">
                                <span
                                  style={{
                                    fontSize: '4rem',
                                    fontWeight: 900,
                                    background: `linear-gradient(135deg, #C0C0C0 0%, #E5E5E5 25%, #FFFFFF 50%, #E5E5E5 75%, #C0C0C0 100%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5)',
                                  }}
                                >
                                  10% OFF
                                </span>
                              </div>
                              <p
                                style={{
                                  color: colors.cream,
                                  fontSize: '1.2rem',
                                  marginTop: '0.5rem',
                                  fontWeight: 500,
                                }}
                              >
                                All Gift Cards
                              </p>
                              <p
                                className="text-base mt-3"
                                style={{ color: colors.gold, fontWeight: 600 }}
                              >
                                🎄 Through December 31st 🎄
                              </p>
                            </div>

                            <div
                              className="mb-8"
                              style={{
                                padding: '1.5rem',
                                background: `${colors.white}15`,
                                borderRadius: '12px',
                                border: `3px dashed ${colors.gold}`,
                                boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.2)',
                              }}
                            >
                              <p
                                className="text-xl font-bold mb-2"
                                style={{
                                  color: colors.gold,
                                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                                }}
                              >
                                The Gift Everyone Secretly Wants
                              </p>
                              <p
                                className="text-base"
                                style={{
                                  color: colors.cream,
                                  fontStyle: 'italic',
                                }}
                              >
                                For someone who deserves to glow
                              </p>
                            </div>

                            {/* CTA Button inside gift box */}
                            <button
                              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                              className="px-8 py-3 font-bold text-base relative group mx-auto"
                              style={{
                                background: `linear-gradient(135deg, #FFFFFF 0%, #F0F0F0 100%)`,
                                color: colors.forestGreen,
                                borderRadius: '50px',
                                boxShadow: '0 4px 15px rgba(255, 255, 255, 0.3)',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                border: `2px solid ${colors.gold}`,
                                display: 'inline-block',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.5)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.3)';
                              }}
                            >
                              Give the Gift of Glow
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </section>

                {/* Form Section styled like a Letter to Santa */}
                <section className="py-12 pb-20 px-4 sm:px-6 lg:px-8" id="contact-form">
                  <div className="max-w-2xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, delay: 0.8 }}
                    >
                      {/* Form Header */}
                      <div className="text-center mb-8">
                        <h2
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '3rem',
                            fontWeight: 900,
                            color: colors.forestGreen,
                            marginBottom: '0.5rem',
                            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Claim Your Holiday HydraFacial Before They're Gone
                        </h2>
                        <p
                          style={{
                            color: colors.crimsonRed,
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem',
                          }}
                        >
                          Only 3 appointment slots available per day through December 24th
                        </p>
                        <p
                          style={{
                            color: colors.forestGreen,
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            fontWeight: 500,
                          }}
                        >
                          Share a few details and we'll personally reach out within 24 hours to design your perfect skincare journey. Your first treatment can be as soon as tomorrow.
                        </p>
                      </div>

                      {/* Form styled like a letter/card */}
                      <div
                        className="relative"
                        style={{
                          background: colors.parchment,
                          border: `3px solid ${colors.forestGreen}`,
                          borderRadius: '12px',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                          padding: '2rem',
                        }}
                      >
                        {/* Decorative corner elements */}
                        <div
                          className="absolute -top-3 -left-3 w-12 h-12"
                          style={{
                            background: colors.gold,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          <span style={{ fontSize: '1.5rem' }}>⭐</span>
                        </div>
                        <div
                          className="absolute -top-3 -right-3 w-12 h-12"
                          style={{
                            background: colors.gold,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          <span style={{ fontSize: '1.5rem' }}>⭐</span>
                        </div>

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
                                    borderColor: consentChecked ? colors.forestGreen : colors.crimsonRed,
                                    background: consentChecked ? colors.forestGreen : 'transparent',
                                  }}
                                >
                                  {consentChecked && <Check className="w-3 h-3" style={{ color: colors.white }} />}
                                </div>
                              </div>
                              <span className="text-xs leading-relaxed" style={{ color: colors.darkGreen }}>
                                By checking this box, I consent to receive marketing and promotional communications, including SMS/text messages and emails, from Eve Beauty, Inc. and Noveris Data LLC (operating Senova CRM) at the phone number and email address provided. Message frequency varies. Message and data rates may apply. Reply STOP to opt-out of SMS at any time. Reply HELP for help. I understand that my consent is not a condition of purchase. View our{' '}
                                <a
                                  href="https://crm.senovallc.com/privacy-policy"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:no-underline"
                                  style={{ color: colors.crimsonRed }}
                                >
                                  Privacy Policy
                                </a>
                                {' '}and{' '}
                                <a
                                  href="https://crm.senovallc.com/terms-of-service"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:no-underline"
                                  style={{ color: colors.crimsonRed }}
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
                                    background: `${colors.crimsonRed}10`,
                                    border: `1px solid ${colors.crimsonRed}`
                                  }}
                                >
                                  <p className="text-sm" style={{ color: colors.crimsonRed }}>
                                    🎁 To receive your exclusive holiday offer, we need your permission to contact you. Please check the consent box above.
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Submit Button styled like a festive gift tag */}
                          <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 px-8 font-bold text-lg relative overflow-hidden group disabled:opacity-70"
                            style={{
                              background: `linear-gradient(135deg, ${colors.crimsonRed} 0%, ${colors.burgundy} 100%)`,
                              color: colors.white,
                              borderRadius: '8px',
                              border: `3px solid ${colors.gold}`,
                              boxShadow: '0 10px 30px rgba(196, 30, 58, 0.3)',
                              letterSpacing: '0.05em',
                              fontFamily: "'Playfair Display', serif",
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  Sending Your Request...
                                </>
                              ) : (
                                <>
                                  <Gift className="w-5 h-5" />
                                  Reserve My Holiday Glow Now
                                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                              )}
                            </span>

                            {/* Animated shimmer effect */}
                            <motion.div
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(90deg, transparent, ${colors.gold}40, transparent)`,
                              }}
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                            />
                          </motion.button>
                        </form>
                      </div>

                      {/* Festive Footer Note */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="text-center mt-8"
                      >
                        <p
                          style={{
                            color: colors.forestGreen,
                            fontSize: '0.9rem',
                            fontStyle: 'italic',
                          }}
                        >
                          🎄 Only 5 appointment slots remaining before New Year's Eve 🎄
                        </p>
                      </motion.div>
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
              >
                <div className="max-w-lg w-full text-center">
                  {/* Success Animation with Christmas Theme */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 10 }}
                    className="relative mx-auto mb-8 w-32 h-32"
                  >
                    <div
                      className="w-32 h-32 rounded-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.crimsonRed}, ${colors.burgundy})`,
                        boxShadow: `0 0 60px ${colors.crimsonRed}50`,
                      }}
                    >
                      <Gift className="w-16 h-16" style={{ color: colors.white }} />
                    </div>

                    {/* Confetti/Stars around */}
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
                          style={{ color: colors.gold }}
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
                        color: colors.forestGreen,
                        fontWeight: 700,
                      }}
                    >
                      You're On The Nice List!
                    </h2>
                    <p
                      className="text-lg"
                      style={{
                        color: colors.darkGreen,
                        lineHeight: 1.8,
                      }}
                    >
                      🎅 Thank you for choosing Eve Beauty for your holiday glow-up!
                      Our team will contact you within 24 hours to schedule your transformation.
                    </p>

                    {/* Contact Card styled like a gift card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="p-6"
                      style={{
                        background: colors.white,
                        border: `3px solid ${colors.crimsonRed}`,
                        borderRadius: '12px',
                        boxShadow: `0 10px 30px rgba(0, 0, 0, 0.1)`,
                      }}
                    >
                      <h3
                        className="mb-4 text-xl font-bold"
                        style={{
                          color: colors.forestGreen,
                          fontFamily: "'Playfair Display', serif",
                        }}
                      >
                        Holiday Business Hours
                      </h3>
                      <div className="space-y-2" style={{ color: colors.darkGreen }}>
                        <div className="flex justify-between">
                          <span>Tuesday - Thursday</span>
                          <span className="font-semibold">9:00 AM - 7:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Friday</span>
                          <span className="font-semibold">9:00 AM - 6:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Saturday</span>
                          <span className="font-semibold">9:00 AM - 4:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sunday - Monday</span>
                          <span className="font-semibold">Closed</span>
                        </div>
                      </div>

                      <div
                        className="mt-4 pt-4"
                        style={{
                          borderTop: `2px dashed ${colors.gold}`,
                        }}
                      >
                        <p
                          className="text-sm"
                          style={{ color: colors.crimsonRed }}
                        >
                          🎁 Special holiday hours December 23-25: Closed for Christmas
                        </p>
                      </div>
                    </motion.div>

                    <div
                      className="flex items-center justify-center gap-3 pt-4"
                      style={{ color: colors.gold }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>🎄</span>
                      <span
                        className="text-sm tracking-widest uppercase"
                        style={{
                          letterSpacing: '0.15em',
                          color: colors.forestGreen,
                        }}
                      >
                        Wakefield's Premier MedSpa Since 2016
                      </span>
                      <span style={{ fontSize: '1.5rem' }}>🎄</span>
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

// Form Field Component with Festive Styling
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
          color: colors.forestGreen,
          letterSpacing: '0.05em',
          fontFamily: "'Crimson Pro', serif",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 transition-all duration-200 focus:outline-none rounded"
        style={{
          background: colors.white,
          border: `2px solid ${error ? colors.crimsonRed : colors.forestGreen}`,
          color: colors.darkGreen,
          fontFamily: "'Crimson Pro', serif",
        }}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs"
          style={{ color: colors.crimsonRed }}
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}