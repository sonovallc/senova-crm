import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'

interface Stat {
  value: string
  label: string
}

interface CTAButton {
  text: string
  link: string
}

interface SenovaHeroProps {
  headline: string
  subheadline: string
  ctaPrimary?: CTAButton
  ctaSecondary?: CTAButton
  stats?: Stat[]
  className?: string
}

export function SenovaHero({
  headline,
  subheadline,
  ctaPrimary,
  ctaSecondary,
  stats,
  className = ''
}: SenovaHeroProps) {
  return (
    <section className={`section-padding bg-gradient-to-b from-white to-gray-50 ${className}`}>
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          {/* Headline */}
          <h1 className="heading-hero animate-in mb-6">
            <span className="gradient-text">{headline}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lead animate-in stagger-1 mb-10">
            {subheadline}
          </p>

          {/* CTA Buttons */}
          {(ctaPrimary || ctaSecondary) && (
            <div className="animate-in stagger-2 flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {ctaPrimary && (
                <Link href={ctaPrimary.link} className="btn-primary group">
                  {ctaPrimary.text}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
              {ctaSecondary && (
                <Link href={ctaSecondary.link} className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold bg-senova-electric text-white rounded-full transition-all duration-300 hover:bg-senova-electric-600 hover:scale-105 shadow-lg group">
                  {ctaSecondary.text}
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          )}

          {/* Stats */}
          {stats && stats.length > 0 && (
            <div className="animate-in stagger-3 grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              {stats.map((stat, index) => (
                <div key={index} className="animate-scale">
                  <div className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}