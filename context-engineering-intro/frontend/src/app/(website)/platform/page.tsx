import { Metadata } from 'next'
import { SenovaHero } from '@/components/website/senova-hero'
import { FeaturesGrid } from '@/components/website/features-grid'
import { CTASection } from '@/components/website/cta-section'
import { CheckCircle, BarChart3, Users, Mail, Target, Database } from 'lucide-react'
import Script from 'next/script'
import Image from 'next/image'
import { images } from '@/lib/images'

export const metadata: Metadata = {
  title: 'All-In-One Marketing Platform for Small Business | Senova',
  description: 'Complete marketing automation for small business. Manage customers, run smart ads everywhere online, and track everything in one place. No tech degree needed.',
  keywords: 'all-in-one marketing platform, small business CRM, marketing automation, customer management software, business advertising platform',
  openGraph: {
    title: 'All-In-One Marketing Platform for Small Business | Senova',
    description: 'Complete marketing automation for small business. Manage customers, run smart ads everywhere online, and track everything in one place. No tech degree needed.',
    url: 'https://senovallc.com/platform',
    siteName: 'Senova CRM',
    images: [
      {
        url: '/og-platform.jpg',
        width: 1200,
        height: 630,
        alt: 'Senova Platform Overview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

const heroData = {
  headline: "Everything You Need to Find and Keep Customers - In One Simple Platform",
  subheadline: "Replace a dozen different tools with one affordable platform. Manage customers, run ads everywhere, and see what works - all without needing a marketing degree.",
  ctaPrimary: {
    text: "See How It Works",
    link: "/demo"
  },
  ctaSecondary: {
    text: "Compare Features",
    link: "#features"
  }
}

const capabilities = [
  {
    category: "Know Your Customers",
    icon: Target,
    features: [
      "See who visits your website",
      "Track what customers want",
      "Find more like your best ones",
      "Build customer profiles"
    ]
  },
  {
    category: "Manage Everything",
    icon: Database,
    features: [
      "All customer data in one place",
      "Track every interaction",
      "Automatic follow-ups",
      "Smart organization"
    ]
  },
  {
    category: "Reach Everywhere",
    icon: Mail,
    features: [
      "Email campaigns",
      "Social media ads",
      "Website advertising",
      "Text messaging"
    ]
  },
  {
    category: "See What Works",
    icon: BarChart3,
    features: [
      "Daily analytics updates",
      "ROI tracking",
      "Customer insights",
      "Performance reports"
    ]
  }
]

const coreFeatures = [
  {
    title: "Smart Customer Database",
    description: "Keep all your customer information organized and accessible.",
    benefits: [
      "Track purchase history automatically",
      "See all customer interactions in one place",
      "Group customers by behavior and preferences",
      "Never lose important customer details"
    ],
    stats: [
      { label: "Storage", value: "Unlimited" },
      { label: "Fields", value: "Custom" },
      { label: "Backup", value: "Automatic" }
    ]
  },
  {
    title: "Smart Customer Finder",
    description: "We help you find new customers who are just like your best ones.",
    benefits: [
      "Target by age, income, location",
      "Find people interested in what you sell",
      "Reach competitor's customers ethically",
      "Use ready-made customer lists"
    ],
    stats: [
      { label: "People", value: "Millions" },
      { label: "Lists", value: "50+" },
      { label: "Updates", value: "Daily" }
    ]
  },
  {
    title: "One-Click Advertising",
    description: "Run ads everywhere your customers go online - not just Facebook or Google.",
    benefits: [
      "Your ads on news sites, apps, streaming",
      "Templates that actually work",
      "Test different messages easily",
      "Set it and forget it campaigns"
    ],
    stats: [
      { label: "Platforms", value: "1000s" },
      { label: "Setup", value: "Quick" },
      { label: "Support", value: "Included" }
    ]
  },
  {
    title: "Simple Analytics Dashboard",
    description: "Finally understand if your marketing is working without a statistics degree.",
    benefits: [
      "See cost per new customer",
      "Track sales from each campaign",
      "Know customer lifetime value",
      "Find your best marketing channels"
    ],
    stats: [
      { label: "Reports", value: "Core" },
      { label: "Updates", value: "Every 24 hours" },
      { label: "History", value: "12 months" }
    ]
  }
]

export default function PlatformPage() {
  return (
    <>
      {/* Schema.org structured data */}
      <Script
        id="schema-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Senova Platform",
            "applicationCategory": "BusinessApplication",
            "description": "All-in-one marketing platform for growing businesses",
            "operatingSystem": "Web"
          })
        }}
      />

      {/* Hero Section with Background Image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={images.platform.workspace}
            alt="Modern workspace with analytics dashboard"
            fill
            className="object-cover opacity-10"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 to-white" />
        </div>
        <div className="relative z-10">
          <SenovaHero {...heroData} />
        </div>
      </section>

      {/* Overview Section */}
      <section id="features" className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2 mb-4">
              One Platform. Everything You Need.
            </h2>
            <p className="text-lead">
              Stop paying for 10 different tools. Get everything in one place for less money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl p-6 border border-gray-200 animate-in stagger-${index + 1}`}
                >
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#ffc107] flex items-center justify-center mr-3">
                      <Icon className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h3 className="font-semibold text-lg">{capability.category}</h3>
                  </div>
                  <ul className="space-y-2">
                    {capability.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <h2 className="heading-2 gradient-text-hot mb-4">
              See Everything in One Dashboard
            </h2>
            <p className="text-lead">
              No more logging into different tools. Everything you need is right here.
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={images.features.dashboard}
                alt="Senova dashboard showing analytics and metrics"
                width={1600}
                height={900}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Smart Advertising Section */}
      <section className="section-padding bg-gradient-to-br from-senova-primary/5 to-senova-info/5">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <h2 className="heading-2 gradient-text-hot mb-4">
              Advertise Like the Big Companies Do
            </h2>
            <p className="text-lead">
              Get the same powerful advertising tools at prices that make sense for your business:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="heading-4 mb-4 text-senova-primary">Pay Less for Ads</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Buy ads directly at wholesale prices</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>No minimum spend requirements</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>See exactly where your money goes</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="heading-4 mb-4 text-senova-primary">Find the Right People</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Show ads to people who want what you sell</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Target by location, age, interests</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Find people like your best customers</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="heading-4 mb-4 text-senova-primary">Ads That Work</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Professional templates that convert</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Test different messages automatically</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Our AI writes ads that actually sell</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Marketing Analytics Image */}
          <div className="mt-12 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="heading-3 mb-4">Track Every Dollar You Spend</h3>
                <p className="text-gray-600 mb-6">
                  Know exactly which ads bring in customers and which ones don't.
                  Our analytics dashboard shows you the real cost per customer,
                  not just clicks and impressions that don't matter.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Cost per new customer</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Revenue from each campaign</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Customer lifetime value</span>
                  </li>
                </ul>
              </div>
              <div className="relative h-80 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={images.features.analytics}
                  alt="Analytics dashboard showing marketing metrics"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Detail */}
      <section className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2 mb-4">
              Everything Works Together
            </h2>
            <p className="text-lead">
              When all your tools are in one place, magic happens.
            </p>
          </div>

          <div className="space-y-16 max-w-6xl mx-auto">
            {coreFeatures.map((feature, index) => (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className={`lg:col-span-5 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <h3 className="heading-3 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-3 mb-6">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-6">
                    {feature.stats.map((stat, statIndex) => (
                      <div key={statIndex}>
                        <div className="text-2xl font-bold text-senova-primary">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`lg:col-span-7 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="relative h-96 rounded-xl overflow-hidden shadow-xl">
                    <Image
                      src={
                        index === 0 ? images.features.crm :
                        index === 1 ? images.features.targeting :
                        index === 2 ? images.features.marketing :
                        images.features.insights
                      }
                      alt={`${feature.title} interface`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        headline="Ready to Stop Overpaying for Marketing?"
        subheadline="Start saving money and getting more customers with Senova."
        primaryCta={{
          text: "Get Started Today",
          link: "/demo"
        }}
        secondaryCta={{
          text: "Talk to an Expert",
          link: "/contact"
        }}
        trustBadges={[
          "Cancel Anytime",
          "Free Training Included"
        ]}
      />
    </>
  )
}