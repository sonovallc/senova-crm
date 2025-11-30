import { Metadata } from 'next'
import { SenovaHero } from '@/components/website/senova-hero'
import { FeaturesGrid } from '@/components/website/features-grid'
import { TestimonialSection } from '@/components/website/testimonial-section'
import { ComparisonTable } from '@/components/website/comparison-table'
import { CTASection } from '@/components/website/cta-section'
import { AlertTriangle, TrendingDown, Users, Shield, Zap, Target } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'

// SEO metadata with simplified messaging
export const metadata: Metadata = {
  title: 'Get More Customers Without Breaking the Bank | Senova CRM',
  description: 'Small business CRM and advertising platform that helps you find new customers online. Save money on advertising while reaching more people. Free trial.',
  keywords: 'small business CRM, customer management software, affordable advertising, get more customers, business growth platform, marketing automation',
  openGraph: {
    title: 'Get More Customers Without Breaking the Bank | Senova CRM',
    description: 'Small business CRM and advertising platform that helps you find new customers online. Save money on advertising while reaching more people. Free trial.',
    url: 'https://senovallc.com',
    siteName: 'Senova',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Senova Intelligence Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get More Customers Without Breaking the Bank | Senova',
    description: 'Small business CRM and advertising platform that helps you find new customers online. Free trial.',
    images: ['/og-image.jpg'],
    creator: '@senovallc',
  },
  alternates: {
    canonical: 'https://senovallc.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Simplified hero data
const heroData = {
  headline: "Finally, Affordable Advertising That Actually Works for Small Business",
  subheadline: "Stop overpaying for online advertising. Senova gives you the same customer management software and advertising tools that big companies use, but at prices that make sense for your business.",
  ctaPrimary: {
    text: "Start Free Trial",
    link: "/demo"
  },
  ctaSecondary: {
    text: "Watch Demo",
    link: "/demo"
  },
  stats: [
    { value: "50%", label: "Less Ad Costs" },
    { value: "5-10x", label: "Return on Spend" },
    { value: "24hr", label: "Setup Time" }
  ]
}

const problems = [
  {
    icon: AlertTriangle,
    title: "Agencies charge huge markups",
    description: "You're paying 30-50% extra just for someone to run your ads"
  },
  {
    icon: TrendingDown,
    title: "Big platforms have big minimums",
    description: "Most advertising tools require thousands per month to get started"
  },
  {
    icon: Users,
    title: "Limited to one or two platforms",
    description: "You can only reach people on Facebook or Google, missing everyone else"
  }
]

const features = [
  {
    icon: "pixel",
    title: "Direct Advertising Access",
    description: "Buy ads directly at wholesale prices, just like the big companies do. Skip the agency markups and save money on every campaign.",
    link: "/platform"
  },
  {
    icon: "targeting",
    title: "Find Your Perfect Customers",
    description: "Show your ads to people who actually want what you sell. We help you find customers based on what they buy, where they go, and what they need.",
    link: "/solutions/audience-intelligence"
  },
  {
    icon: "automation",
    title: "Advertise Everywhere at Once",
    description: "Your ads can appear on news sites, mobile apps, streaming services, and more. Reach customers wherever they spend time online.",
    link: "/solutions/campaign-activation"
  },
  {
    icon: "analytics",
    title: "See What Actually Works",
    description: "Know exactly which ads bring in customers and which ones don't. Stop wasting money on marketing that doesn't work.",
    link: "/solutions/analytics"
  }
]

const testimonials = [
  {
    quote: "We cut our advertising costs in half and actually got MORE customers. The platform is so easy to use.",
    author: "Maria Rodriguez",
    role: "Restaurant Owner",
    location: "Miami, FL",
    metric: "50% lower ad costs",
    rating: 5
  },
  {
    quote: "Finally, I can afford the same tools the big chains use. Game changer for my local business.",
    author: "Bob Johnson",
    role: "Home Services",
    location: "Austin, TX",
    metric: "3x more leads",
    rating: 5
  },
  {
    quote: "The customer insights alone are worth it. I know exactly who my best customers are and how to find more.",
    author: "Sarah Chen",
    role: "Retail Store Owner",
    location: "Seattle, WA",
    metric: "40% repeat customers",
    rating: 5
  }
]

const comparisonData = {
  headers: ["Feature", "Basic Tools", "Agencies", "Senova"],
  rows: [
    {
      feature: "Monthly Cost",
      basic: "$99-299",
      enterprise: "$2,000-5,000",
      senova: "$299-599"
    },
    {
      feature: "Ad Platform Access",
      basic: "1-2 platforms",
      enterprise: "Multiple platforms",
      senova: "All platforms"
    },
    {
      feature: "Pricing Transparency",
      basic: "✓ Clear pricing",
      enterprise: "Hidden markups",
      senova: "✓ Wholesale rates"
    },
    {
      feature: "Setup Time",
      basic: "2-4 weeks",
      enterprise: "2-3 weeks",
      senova: "24 hours"
    },
    {
      feature: "Minimum Spend",
      basic: "Platform minimums",
      enterprise: "$5,000+/month",
      senova: "Start with any budget"
    }
  ]
}

const industries = [
  {
    name: "Restaurants & Food",
    description: "Fill tables and boost takeout orders",
    link: "/industries/restaurants",
    icon: Zap
  },
  {
    name: "Home Services",
    description: "Book more jobs and service calls",
    link: "/industries/home-services",
    icon: Shield
  },
  {
    name: "Retail & E-commerce",
    description: "Drive foot traffic and online sales",
    link: "/industries/retail",
    icon: Target
  },
  {
    name: "Professional Services",
    description: "Attract high-value clients",
    link: "/industries/professional-services",
    icon: Users
  }
]

export default function HomePage() {
  return (
    <>
      {/* Enhanced Schema.org structured data */}
      <Script
        id="schema-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://senovallc.com/#organization",
                "name": "Senova",
                "url": "https://senovallc.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://senovallc.com/logo.png"
                },
                "sameAs": [
                  "https://linkedin.com/company/senovallc",
                  "https://twitter.com/senovallc"
                ]
              },
              {
                "@type": "WebSite",
                "@id": "https://senovallc.com/#website",
                "url": "https://senovallc.com",
                "name": "Senova",
                "publisher": {
                  "@id": "https://senovallc.com/#organization"
                },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://senovallc.com/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@type": "SoftwareApplication",
                "name": "Senova CRM",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "offers": {
                  "@type": "AggregateOffer",
                  "lowPrice": "299",
                  "highPrice": "599",
                  "priceCurrency": "USD",
                  "offerCount": "3",
                  "availability": "https://schema.org/InStock"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "reviewCount": "127",
                  "bestRating": "5"
                },
                "featureList": [
                  "Customer Management",
                  "Smart Advertising",
                  "Marketing Automation",
                  "Analytics Dashboard",
                  "Multi-Channel Campaigns"
                ]
              }
            ]
          })
        }}
      />

      {/* Hero Section with enhanced design */}
      <section className="relative overflow-hidden gradient-bg-mesh">
        <div className="absolute inset-0 pattern-bg opacity-10"></div>
        <SenovaHero {...heroData} />
      </section>

      {/* Problem Section with glassmorphism */}
      <section className="section-padding relative">
        <div className="absolute inset-0 gradient-bg-subtle"></div>
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-12 animate-fade-in">
            <h2 className="heading-2 gradient-text mb-4">
              Why Most Businesses Overpay for Advertising
            </h2>
            <p className="text-lead font-body">
              The big companies get wholesale rates while small businesses pay retail prices plus agency fees
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {problems.map((problem, index) => {
              const Icon = problem.icon
              return (
                <div
                  key={index}
                  className={`card-glass text-center animate-scale-in stagger-${index + 1}`}
                >
                  <div className="mb-4 mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center animate-glow">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="heading-4 mb-2 senova-dark">{problem.title}</h3>
                  <p className="text-gray-600 font-body">{problem.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Solution Features with enhanced cards */}
      <section className="section-padding bg-senova-off-white">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12 animate-fade-in">
            <h2 className="heading-2 gradient-text mb-4">
              Everything You Need to Get More Customers
            </h2>
            <p className="text-lead font-body">
              One simple platform that replaces a dozen different tools. Save money while reaching more people.
            </p>
          </div>
          <FeaturesGrid
            features={features}
            columns={4}
          />
        </div>
      </section>

      {/* Testimonials with enhanced styling */}
      <section className="section-padding relative">
        <div className="absolute inset-0 dots-pattern opacity-5"></div>
        <TestimonialSection
          headline="Real Businesses, Real Results"
          testimonials={testimonials}
        />
      </section>

      {/* Comparison Table */}
      <section className="section-padding bg-gradient-bg-subtle">
        <ComparisonTable
          headline="Why Businesses Switch to Senova"
          subheadline="Get better results for less money"
          {...comparisonData}
        />
      </section>

      {/* Industries Section with icons */}
      <section className="section-padding relative">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12 animate-fade-in">
            <h2 className="heading-2 gradient-text">Works for Every Type of Business</h2>
            <p className="text-lead font-body mt-4">
              Whether you run a restaurant, repair shop, retail store, or professional service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {industries.map((industry, index) => {
              const Icon = industry.icon
              return (
                <Link
                  key={index}
                  href={industry.link}
                  className={`group card-senova hover-lift animate-slide-up stagger-${index + 1}`}
                >
                  <div className="mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-senova-primary to-senova-info flex items-center justify-center group-hover:animate-glow transition-all">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="heading-4 mb-2 group-hover:gradient-text transition-all">
                    {industry.name}
                  </h3>
                  <p className="text-gray-600 text-sm font-body">{industry.description}</p>
                  <div className="mt-4 text-senova-electric font-semibold text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    Learn more →
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding bg-senova-off-white">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2 gradient-text mb-4">How It Works</h2>
            <p className="text-lead font-body">Three simple steps to get more customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="mb-4 mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-senova-primary to-senova-info flex items-center justify-center text-white font-bold text-xl">1</div>
              <h3 className="heading-4 mb-2">Know Your Customers</h3>
              <p className="text-gray-600 font-body">Our customer management software shows you who your best customers are and finds more people just like them</p>
            </div>
            <div className="text-center">
              <div className="mb-4 mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-senova-primary to-senova-info flex items-center justify-center text-white font-bold text-xl">2</div>
              <h3 className="heading-4 mb-2">Reach Them Everywhere</h3>
              <p className="text-gray-600 font-body">Your ads appear on websites, apps, streaming services - wherever your customers spend time online</p>
            </div>
            <div className="text-center">
              <div className="mb-4 mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-senova-primary to-senova-info flex items-center justify-center text-white font-bold text-xl">3</div>
              <h3 className="heading-4 mb-2">See What Works</h3>
              <p className="text-gray-600 font-body">Track exactly which ads bring in customers and stop wasting money on what doesn't work</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="section-padding bg-senova-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 gradient-bg-mesh"></div>
        </div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="heading-2 mb-8 gradient-text">Your Data is Safe With Us</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="glass-dark rounded-xl p-6 text-center animate-scale-in stagger-1">
                <Shield className="h-8 w-8 mx-auto mb-3 text-senova-accent" />
                <div className="font-semibold">Bank-Level Security</div>
                <div className="text-sm opacity-80 mt-1">256-bit encryption</div>
              </div>
              <div className="glass-dark rounded-xl p-6 text-center animate-scale-in stagger-2">
                <Shield className="h-8 w-8 mx-auto mb-3 text-senova-accent" />
                <div className="font-semibold">Privacy First</div>
                <div className="text-sm opacity-80 mt-1">Your data stays yours</div>
              </div>
              <div className="glass-dark rounded-xl p-6 text-center animate-scale-in stagger-3">
                <Shield className="h-8 w-8 mx-auto mb-3 text-senova-accent" />
                <div className="font-semibold">Always Available</div>
                <div className="text-sm opacity-80 mt-1">99.9% uptime</div>
              </div>
              <div className="glass-dark rounded-xl p-6 text-center animate-scale-in stagger-4">
                <Shield className="h-8 w-8 mx-auto mb-3 text-senova-accent" />
                <div className="font-semibold">Real Support</div>
                <div className="text-sm opacity-80 mt-1">Humans, not bots</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA with enhanced design */}
      <CTASection
        headline="Start Getting More Customers Today"
        subheadline="Join thousands of businesses using Senova to grow without the growing pains. Free trial, no credit card required."
        primaryCta={{
          text: "Start Free Trial",
          link: "/demo"
        }}
        secondaryCta={{
          text: "Schedule Demo",
          link: "/contact"
        }}
        trustBadges={[
          "No Setup Fees",
          "Cancel Anytime",
          "Real Support",
          "Free Training"
        ]}
      />

      {/* FAQ Section with Schema */}
      <section className="section-padding">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="heading-2 text-center mb-12 gradient-text">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <details className="group card-senova cursor-pointer hover:border-senova-electric/30 transition-all duration-300">
                <summary className="flex justify-between items-center font-semibold text-lg hover:text-senova-electric transition-colors">
                  How is Senova different from Facebook or Google ads?
                  <span className="transition group-open:rotate-180 text-senova-electric">↓</span>
                </summary>
                <p className="mt-4 text-gray-600 font-body">
                  Facebook and Google only show your ads on their own platforms. Senova shows your ads everywhere - news sites, mobile apps, streaming services, and more. Plus, you pay wholesale prices instead of retail.
                </p>
              </details>
              <details className="group card-senova cursor-pointer hover:border-senova-electric/30 transition-all duration-300">
                <summary className="flex justify-between items-center font-semibold text-lg hover:text-senova-electric transition-colors">
                  Do I need technical skills to use Senova?
                  <span className="transition group-open:rotate-180 text-senova-electric">↓</span>
                </summary>
                <p className="mt-4 text-gray-600 font-body">
                  No! We built Senova for business owners, not tech experts. If you can use email and social media, you can use Senova. Plus, we offer free training and real human support.
                </p>
              </details>
              <details className="group card-senova cursor-pointer hover:border-senova-electric/30 transition-all duration-300">
                <summary className="flex justify-between items-center font-semibold text-lg hover:text-senova-electric transition-colors">
                  How quickly can I see results?
                  <span className="transition group-open:rotate-180 text-senova-electric">↓</span>
                </summary>
                <p className="mt-4 text-gray-600 font-body">
                  Many businesses see their first new customers within days of starting. Your ads can be running within 24 hours of signing up. Results vary based on your business and market.
                </p>
              </details>
              <details className="group card-senova cursor-pointer hover:border-senova-electric/30 transition-all duration-300">
                <summary className="flex justify-between items-center font-semibold text-lg hover:text-senova-electric transition-colors">
                  What if I already have an agency?
                  <span className="transition group-open:rotate-180 text-senova-electric">↓</span>
                </summary>
                <p className="mt-4 text-gray-600 font-body">
                  Many of our customers switch from agencies and save 30-50% on their advertising costs while getting better results. We can help you transition smoothly without any downtime.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Schema */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How is Senova different from Facebook or Google ads?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Facebook and Google only show your ads on their own platforms. Senova shows your ads everywhere - news sites, mobile apps, streaming services, and more. Plus, you pay wholesale prices instead of retail."
                }
              },
              {
                "@type": "Question",
                "name": "Do I need technical skills to use Senova?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No! We built Senova for business owners, not tech experts. If you can use email and social media, you can use Senova. Plus, we offer free training and real human support."
                }
              },
              {
                "@type": "Question",
                "name": "How quickly can I see results?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Many businesses see their first new customers within days of starting. Your ads can be running within 24 hours of signing up. Results vary based on your business and market."
                }
              },
              {
                "@type": "Question",
                "name": "What if I already have an agency?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Many of our customers switch from agencies and save 30-50% on their advertising costs while getting better results. We can help you transition smoothly without any downtime."
                }
              }
            ]
          })
        }}
      />
    </>
  )
}