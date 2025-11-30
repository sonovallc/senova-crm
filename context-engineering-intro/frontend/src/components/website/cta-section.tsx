import Link from 'next/link'
import { Shield, CheckCircle, Star, Award } from 'lucide-react'

interface CTAButton {
  text: string
  link: string
}

interface CTASectionProps {
  headline: string
  subheadline?: string
  primaryCta?: CTAButton
  secondaryCta?: CTAButton
  trustBadges?: string[]
  className?: string
}

export function CTASection({
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  trustBadges,
  className = ''
}: CTASectionProps) {
  return (
    <section className={`section-padding ${className}`}>
      <div className="container">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-16 md:px-16 md:py-24"
          style={{
            background: `linear-gradient(135deg, var(--color-primary), var(--color-info))`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center" />
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            {/* Headline */}
            <h2 className="heading-2 mb-6 text-white">
              {headline}
            </h2>

            {/* Subheadline */}
            {subheadline && (
              <p className="text-xl text-white/90 mb-8">
                {subheadline}
              </p>
            )}

            {/* CTAs */}
            {(primaryCta || secondaryCta) && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                {primaryCta && (
                  <Link
                    href={primaryCta.link}
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold transition-all duration-200 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)'
                    }}
                  >
                    {primaryCta.text}
                  </Link>
                )}
                {secondaryCta && (
                  <Link
                    href={secondaryCta.link}
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-senova-electric text-white transition-all duration-300 rounded-full hover:bg-senova-electric-600 hover:scale-105 shadow-xl"
                  >
                    {secondaryCta.text}
                  </Link>
                )}
              </div>
            )}

            {/* Trust Badges */}
            {trustBadges && trustBadges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 pt-8 border-t border-white/20">
                {trustBadges.map((badge, index) => {
                  const icons = [Shield, CheckCircle, Star, Award]
                  const Icon = icons[index % icons.length]

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-white/80"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{badge}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}