import Link from 'next/link'
import { Check } from 'lucide-react'

interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  isPopular?: boolean
  ctaText?: string
  ctaLink?: string
}

interface PricingTableProps {
  headline?: string
  subheadline?: string
  tiers: PricingTier[]
  className?: string
}

export function PricingTable({
  headline,
  subheadline,
  tiers,
  className = ''
}: PricingTableProps) {
  return (
    <section className={`section-padding ${className}`}>
      <div className="container">
        {(headline || subheadline) && (
          <div className="mx-auto max-w-3xl text-center mb-12">
            {headline && (
              <h2 className="heading-2 mb-4">
                {headline}
              </h2>
            )}
            {subheadline && (
              <p className="text-lead">
                {subheadline}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 animate-in stagger-${index + 1} ${
                tier.isPopular
                  ? 'border-2 shadow-xl scale-105'
                  : 'border shadow-lg'
              }`}
              style={{
                borderColor: tier.isPopular ? 'var(--color-primary)' : '#e5e7eb',
                backgroundColor: tier.isPopular ? 'rgba(15, 23, 42, 0.02)' : 'white'
              }}
            >
              {tier.isPopular && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Most Popular
                </span>
              )}

              <div className="text-center mb-8">
                <h3 className="heading-3 mb-2">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold">{tier.price}</span>
                  {tier.price !== 'Custom' && <span className="text-gray-600">/month</span>}
                </div>
                <p className="text-gray-600">{tier.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5 mr-3" style={{ color: 'var(--color-success)' }} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaLink || '/demo'}
                className={tier.isPopular ? 'btn-primary w-full' : 'btn-secondary w-full'}
              >
                {tier.ctaText || 'Get Started'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}