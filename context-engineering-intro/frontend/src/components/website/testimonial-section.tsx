import { Star, Quote } from 'lucide-react'
import Image from 'next/image'
import { images } from '@/lib/images'

interface Testimonial {
  quote: string
  author: string
  role: string
  location?: string
  metric?: string
  rating?: number
  image?: string
}

interface TestimonialSectionProps {
  headline?: string
  testimonials: Testimonial[]
  className?: string
}

export function TestimonialSection({
  headline,
  testimonials,
  className = ''
}: TestimonialSectionProps) {
  return (
    <section className={`section-padding bg-gradient-to-b from-gray-50 to-white ${className}`}>
      <div className="container">
        {headline && (
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2">{headline}</h2>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-xl shadow-lg p-6 animate-in stagger-${index + 1}`}
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 h-8 w-8 text-gray-200" />

              {/* Author Image */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.image || images.testimonials[index % images.testimonials.length]}
                    alt={`${testimonial.author} headshot`}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Rating */}
                {testimonial.rating && (
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (testimonial.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Quote */}
              <blockquote className="mb-6 text-gray-700 italic relative z-10">
                "{testimonial.quote}"
              </blockquote>

              {/* Metric Badge */}
              {testimonial.metric && (
                <div
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-4"
                  style={{
                    backgroundColor: 'rgba(212, 165, 116, 0.2)',
                    color: 'var(--color-primary)'
                  }}
                >
                  {testimonial.metric}
                </div>
              )}

              {/* Author */}
              <div className="border-t pt-4">
                <div className="font-semibold text-gray-900">{testimonial.author}</div>
                <div className="text-sm text-gray-600">
                  {testimonial.role}
                  {testimonial.location && ` • ${testimonial.location}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}