'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  ChevronDown,
  Database,
  Zap,
  TrendingUp,
  Users,
  UserPlus,
  Target,
  Settings,
  Layout,
  Wrench,
  Mail,
  Palette,
  BarChart,
  ArrowRight,
  Sparkles
} from 'lucide-react'

// Import pricing data from schema
import {
  PRICING_TIERS,
  A_LA_CARTE_SERVICES
} from '@/data/pricing'

// FAQ data specific to pricing
const pricingFAQ = [
  {
    question: "What's included in the Raw Data Package?",
    answer: "The Raw Data Package includes custom audience segments based on your criteria, access to 600M+ verified profiles, 250B+ weekly behavioral signals, data delivery via CSV/API/CRM import, email/phone/address append, company firmographics enrichment, and quarterly data refresh. Perfect for agencies and businesses with existing marketing teams."
  },
  {
    question: "How does Data Activation differ from Raw Data?",
    answer: "Data Activation includes everything in Raw Data, plus we handle the entire campaign execution for you. This includes DSP campaign setup, landing page creation, pixel installation, visitor enrichment, AI agent lead outreach, full CRM access with email marketing, automation workflows, and monthly strategy calls. You get the data AND the execution."
  },
  {
    question: "What are wholesale media rates?",
    answer: "Through our DSP partnerships, we offer CPM rates of $2-6 compared to industry standard $20-30. This means your advertising budget goes 5-10x further. We charge a flat management fee starting at $500/month plus your actual media spend with no markup - complete transparency."
  },
  {
    question: "Can I switch plans later?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. If you upgrade mid-month, we'll prorate the difference. Many clients start with Raw Data to test our data quality, then upgrade to Data Activation once they see the results."
  },
  {
    question: "What's the minimum commitment?",
    answer: "Raw Data Packages are one-time purchases with no commitment. Data Activation requires a 3-month initial commitment, then goes month-to-month. DSP Management is monthly with no long-term contract. White Glove services typically require annual commitment due to the customization involved."
  },
  {
    question: "Do you offer custom enterprise pricing?",
    answer: "Yes! For organizations with unique needs or high-volume requirements, we offer custom enterprise packages. These can include volume discounts, custom SLAs, dedicated infrastructure, white-label options, and specialized support. Contact our sales team to discuss your specific requirements."
  }
]

// Icon mapping for services
const iconMap: { [key: string]: React.ElementType } = {
  Database,
  Target,
  Users,
  UserPlus,
  Settings,
  Layout,
  Wrench,
  Mail,
  Palette,
  BarChart,
  Zap,
  TrendingUp
}

export default function PricingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Get the main 3 tiers (excluding white-glove)
  const mainTiers = PRICING_TIERS.filter(tier => tier.id !== 'white-glove')
  const whiteGloveTier = PRICING_TIERS.find(tier => tier.id === 'white-glove')

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Gradient Background */}
      <section className="relative bg-gradient-to-br from-blue-900 via-slate-900 to-violet-900 overflow-hidden">
        {/* Animated glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-violet-500/20 to-transparent rounded-full animate-pulse" />

        <div className="relative z-10 px-4 py-24 mx-auto max-w-7xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Choose the plan that fits your growth goals
          </p>
        </div>
      </section>

      {/* Main Pricing Cards */}
      <section className="relative -mt-16 z-20 px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainTiers.map((tier) => {
              const IconComponent = tier.icon ? iconMap[tier.icon] : Database
              const isPopular = tier.popular

              return (
                <div
                  key={tier.id}
                  className={`relative bg-white rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    isPopular ? 'scale-105 border-2 border-blue-500' : 'border border-gray-200'
                  }`}
                >
                  {/* Popular badge */}
                  {tier.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-violet-100 rounded-2xl flex items-center justify-center mb-6">
                      <IconComponent className={`w-8 h-8 ${isPopular ? 'text-blue-600' : 'text-slate-700'}`} />
                    </div>

                    {/* Name and price */}
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-blue-600">{tier.price}</span>
                    </div>
                    <p className="text-sm text-blue-500 font-medium mb-4">{tier.startingAt}</p>

                    {/* Description */}
                    <p className="text-gray-600 mb-6">{tier.description}</p>

                    {/* Features list */}
                    <ul className="space-y-3 mb-8">
                      {tier.features.slice(0, 8).map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                      {tier.features.length > 8 && (
                        <li className="text-sm text-blue-600 font-medium ml-8">
                          +{tier.features.length - 8} more features
                        </li>
                      )}
                    </ul>

                    {/* CTA Button */}
                    <Link
                      href={tier.ctaLink || '/contact'}
                      className={`block w-full py-3 px-6 rounded-xl font-semibold text-center transition-all ${
                        isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 shadow-lg'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* White Glove Section */}
      {whiteGloveTier && (
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-20 relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-violet-500/5 to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
              Need Everything Done For You?
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
              Our White Glove service handles everything from strategy to execution
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { title: 'Full-Service Management', desc: 'Complete campaign management from strategy to optimization' },
                { title: 'Creative Production', desc: 'Professional ads, landing pages, and content creation' },
                { title: 'Dedicated Team', desc: 'Your own team of data scientists and marketing experts' },
                { title: 'Performance Guarantee', desc: 'Results-driven approach with guaranteed benchmarks' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-blue-100">{item.desc}</p>
                </div>
              ))}
            </div>

            <Link
              href="/contact?tier=white-glove"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-xl"
            >
              Get Custom Pricing
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}

      {/* A La Carte Services */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">A La Carte Services</h2>
            <p className="text-xl text-gray-600">Add specialized services to any plan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {A_LA_CARTE_SERVICES.map((service) => {
              const ServiceIcon = service.icon ? iconMap[service.icon] : Database

              return (
                <div
                  key={service.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ServiceIcon className="w-6 h-6 text-blue-600" />
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{service.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  <p className="text-lg font-bold text-blue-600">{service.startingAt}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {pricingFAQ.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-blue-600 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`px-6 bg-gray-50 overflow-hidden transition-all duration-300 ${
                    expandedFaq === index ? 'py-4 max-h-96' : 'max-h-0'
                  }`}
                >
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-violet-600 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join businesses using Senova to reach the right customers
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-xl"
            >
              <Sparkles className="w-5 h-5" />
              Get Started
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
            >
              View Pricing Details
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <p className="text-sm text-blue-100 mt-6">
            Flexible plans • Professional consultation • Tailored solutions
          </p>
        </div>
      </section>
    </div>
  )
}