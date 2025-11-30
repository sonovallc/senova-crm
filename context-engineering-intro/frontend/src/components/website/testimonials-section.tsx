'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Michael Thompson',
    location: 'Boston, MA',
    rating: 5,
    text: "Senova CRM transformed how we manage customer relationships. Our team is more organized, and we've increased customer retention by 35% in just 6 months.",
    business: 'Thompson Consulting',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  },
  {
    id: 2,
    name: 'Lisa Chen',
    location: 'Cambridge, MA',
    rating: 5,
    text: "The automation features save us hours every week. Email campaigns, follow-ups, and customer segmentation all run seamlessly. Best CRM investment we've made!",
    business: 'Digital Marketing Pro',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  },
  {
    id: 3,
    name: 'David Rodriguez',
    location: 'Somerville, MA',
    rating: 5,
    text: "Finally, a CRM that's actually easy to use! Our entire team adopted it within days. The customer insights have helped us double our conversion rates.",
    business: 'Rodriguez Home Services',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  },
  {
    id: 4,
    name: 'Sarah Williams',
    location: 'Newton, MA',
    rating: 5,
    text: 'Senova helped us scale from 100 to 1,000+ customers smoothly. The reporting features give us real-time insights that drive better business decisions.',
    business: 'Williams & Associates',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
  },
]

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5 sm:gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 sm:h-5 sm:w-5 ${
            i < rating
              ? 'fill-yellow-500 text-yellow-500'
              : 'fill-slate-200 text-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="relative py-12 sm:py-20 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3 sm:mb-4">
            Trusted by Businesses Everywhere
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 max-w-3xl mx-auto px-4">
            See how thousands of businesses use Senova CRM to grow their customer relationships and scale their operations.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 px-4 sm:px-0">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-primary/20">
                {/* Quote Icon */}
                <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>

                {/* Content */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Rating */}
                  <StarRating rating={testimonial.rating} />

                  {/* Testimonial Text */}
                  <p className="text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed">
                    "{testimonial.text}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 sm:gap-4 pt-2 sm:pt-4 border-t border-slate-100">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-primary/10"
                    />
                    <div>
                      <p className="font-semibold text-sm sm:text-base text-slate-900">
                        {testimonial.name}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {testimonial.business} • {testimonial.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-8 sm:mt-16 px-4"
        >
          <p className="text-sm sm:text-lg text-slate-600 mb-4 sm:mb-6">
            Join thousands of businesses growing with Senova CRM
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Start Free Trial
            </a>
            <a
              href="/demo"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary font-semibold rounded-xl border-2 border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
            >
              Book a Demo
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}