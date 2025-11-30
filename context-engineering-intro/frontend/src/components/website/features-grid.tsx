import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import {
  Target,
  Users,
  Zap,
  TrendingUp,
  BarChart3,
  Mail,
  MessageSquare,
  Shield
} from 'lucide-react'

// Icon mapping for string keys
const iconMap: Record<string, LucideIcon> = {
  pixel: Target,
  targeting: Users,
  automation: Zap,
  analytics: BarChart3,
  crm: Users,
  email: Mail,
  chat: MessageSquare,
  security: Shield,
  growth: TrendingUp,
}

interface Feature {
  icon?: string
  title: string
  description: string
  link?: string
}

interface FeaturesGridProps {
  headline?: string
  subheadline?: string
  features: Feature[]
  columns?: 2 | 3 | 4
  className?: string
}

export function FeaturesGrid({
  headline,
  subheadline,
  features,
  columns = 3,
  className = ''
}: FeaturesGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
  }

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

        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-8`}>
          {features.map((feature, index) => {
            const Icon = feature.icon ? iconMap[feature.icon] || Target : Target

            const cardContent = (
              <>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#ffc107]">
                  <Icon className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
                </div>
                <h3 className="heading-4 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
                {feature.link && (
                  <span className="mt-4 inline-flex items-center text-sm font-semibold text-senova-electric hover:text-senova-electric-600 transition-colors">
                    Learn more
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </>
            )

            return feature.link ? (
              <Link
                key={index}
                href={feature.link}
                className={`group card-hover rounded-xl border border-gray-200 bg-white p-6 animate-in stagger-${Math.min(index + 1, 6)}`}
              >
                {cardContent}
              </Link>
            ) : (
              <div
                key={index}
                className={`card-hover rounded-xl border border-gray-200 bg-white p-6 animate-in stagger-${Math.min(index + 1, 6)}`}
              >
                {cardContent}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}