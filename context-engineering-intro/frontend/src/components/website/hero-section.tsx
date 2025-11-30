'use client'

import { Button } from '@/components/ui/button'
import { BookingButton } from './booking-button'
import { Calendar, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&h=1080&fit=crop',
    alt: 'Tranquil spa environment with water features and stones',
  },
  {
    image: 'https://images.unsplash.com/photo-1596178060671-7a80dc8c3a2f?w=1920&h=1080&fit=crop',
    alt: 'Peaceful meditation spa setting with bamboo and natural elements',
  },
  {
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1920&h=1080&fit=crop',
    alt: 'Serene day spa relaxation atmosphere with candles and zen decor',
  },
]

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Carousel */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentSlide}
            src={heroSlides[currentSlide].image}
            alt={heroSlides[currentSlide].alt}
            className="h-full w-full object-cover opacity-40"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-primary/30 to-slate-900/80" />
      </div>

      {/* Carousel Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur-sm transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur-sm transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Carousel Dots */}
      <div className="absolute bottom-32 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              currentSlide === index
                ? 'w-8 bg-white'
                : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      </div>

      {/* Content */}
      <div className="relative flex h-full items-center justify-center py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/90 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-900 font-medium shadow-lg">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span>Award-Winning Medical Aesthetics</span>
              </div>
            </motion.div>

            <motion.h1
              className="mb-4 sm:mb-6 text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-lg leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transform Your Beauty
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-teal-500 bg-clip-text text-transparent drop-shadow-xl">
                With Confidence
              </span>
            </motion.h1>

            <motion.p
              className="mb-6 sm:mb-10 text-sm sm:text-lg lg:text-xl leading-6 sm:leading-8 text-white drop-shadow-md px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Experience luxury medical aesthetics from master artists and advanced estheticians.
              Permanent makeup, skin treatments, body contouring, and more.
            </motion.p>

            <motion.div
              className="flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <BookingButton size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                Book Your Consultation
              </BookingButton>
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 px-6 sm:px-8 text-sm sm:text-lg border-2 border-senova-electric text-white hover:bg-senova-electric hover:text-white hover:border-senova-electric-600 shadow-xl transition-all duration-300 backdrop-blur-sm" asChild>
                <a href="#services">
                  <Sparkles className="h-5 w-5" />
                  Explore Services
                </a>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="mt-8 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-8 relative z-10 px-4 sm:px-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
            >
              <div>
                <div className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">10+</div>
                <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-300">Years Experience</div>
              </div>
              <div>
                <div className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">5000+</div>
                <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-300">Happy Clients</div>
              </div>
              <div>
                <div className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">15+</div>
                <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-300">Services Offered</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

    </section>
  )
}
