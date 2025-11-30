'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import { SenovaHero } from '@/components/website/senova-hero'
import { CTASection } from '@/components/website/cta-section'
import { Check, X, Star, Target, DollarSign } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'

// Note: In a client component, we need to export metadata differently
// export const metadata: Metadata = {
//   title: 'Affordable CRM & Advertising Pricing for Small Business',
//   description: 'Transparent pricing for small business CRM and advertising. No hidden fees, no minimums, no contracts. Start free and only pay for what you use.',
//   keywords: 'small business CRM pricing, affordable advertising, marketing automation pricing, transparent pricing',
// }

const plans = [
  {
    name: "Starter",
    priceMonthly: "$299",
    priceAnnual: "$239",
    description: "Perfect for businesses just getting started",
    highlight: false,
    features: [
      "Up to 5,000 customers",
      "See who visits your website",
      "Email marketing campaigns",
      "Basic customer insights",
      "Simple advertising tools",
      "Analytics dashboard",
      "2 team members",
      "Email support",
      "Setup in 24 hours"
    ],
    limitations: [
      "Limited to 1 location",
      "10 campaigns per month",
      "Basic features only"
    ],
    ctaText: "Start Free Trial",
    ctaLink: "/demo?plan=starter"
  },
  {
    name: "Professional",
    priceMonthly: "$599",
    priceAnnual: "$479",
    description: "For growing businesses ready to scale",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Up to 25,000 customers",
      "Direct advertising at wholesale prices",
      "Find customers like your best ones",
      "Complete advertising control",
      "Advertise on any platform",
      "Skip the middleman markups",
      "Email + Text marketing",
      "Smart customer finder",
      "Custom audiences",
      "Track your real ROI",
      "Unlimited team members",
      "Priority phone + email support",
      "Free setup and training",
      "All features included",
      "Unlimited campaigns",
      "A/B testing tools",
      "Custom reports"
    ],
    bonus: "Best value for growing businesses",
    ctaText: "Start Free Trial",
    ctaLink: "/demo?plan=professional"
  },
  {
    name: "Enterprise",
    priceMonthly: "Custom",
    priceAnnual: "Custom",
    description: "For multi-location businesses",
    highlight: false,
    features: [
      "Unlimited customers",
      "Everything in Professional",
      "Multiple locations",
      "Custom connections",
      "API access",
      "Dedicated account manager",
      "Quarterly business reviews",
      "Custom training",
      "Priority support",
      "Custom data storage",
      "Advanced security",
      "First access to new features"
    ],
    ctaText: "Contact Sales",
    ctaLink: "/contact?plan=enterprise"
  }
]

const competitors = [
  {
    name: "Senova Professional",
    price: "$599/mo",
    visitorId: "Yes - Advanced",
    audiences: "Unlimited",
    compliance: "Included",
    setup: "Free",
    contract: "Month-to-month",
    highlighted: true
  },
  {
    name: "Big Agency #1",
    price: "$2,000/mo",
    visitorId: "Limited",
    audiences: "Limited",
    compliance: "+$500/mo",
    setup: "$5,000",
    contract: "12 months"
  },
  {
    name: "Enterprise CRM",
    price: "$1,500/mo",
    visitorId: "Not available",
    audiences: "5 max",
    compliance: "+$300/mo",
    setup: "$2,500",
    contract: "24 months"
  },
  {
    name: "Basic CRM + Tools",
    price: "$800/mo",
    visitorId: "Not available",
    audiences: "Manual only",
    compliance: "Not included",
    setup: "$1,000",
    contract: "12 months"
  }
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

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
            "name": "Senova CRM",
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "299",
              "highPrice": "599",
              "priceCurrency": "USD",
              "offerCount": "3"
            }
          })
        }}
      />

      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-b from-white to-gray-50">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="heading-hero animate-in mb-6">
              <span className="gradient-text">Honest Pricing That Grows With Your Business</span>
            </h1>
            <p className="text-lead animate-in stagger-1 mb-10">
              No hidden fees, no minimums, no contracts. Start small and grow big. Save 30-50% compared to agencies.
            </p>
            <div className="animate-in stagger-2 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="btn-primary">
                Start 14-Day Free Trial
              </Link>
              <Link href="/roi-calculator" className="btn-secondary">
                Calculate Your Savings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Value Proposition */}
      <section className="section-padding bg-gradient-to-br from-senova-primary/5 to-senova-info/5">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="heading-2 gradient-text mb-4">Why Pay More for Less?</h2>
              <p className="text-lead text-gray-700">
                See how much you could save
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="heading-3 mb-4 text-red-600">What You Pay Now</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <X className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                    <span>Agencies add 30-50% markup to your ads</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                    <span>$2,000-5,000/month in management fees</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                    <span>Locked contracts you can't escape</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                    <span>They keep your data when you leave</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-green-500">
                <h3 className="heading-3 mb-4 text-green-600">What You Pay With Senova</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Buy ads directly at wholesale prices</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>One simple monthly fee, no surprises</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Cancel anytime, no questions asked</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Your data is always yours to keep</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Start With Any Budget</p>
                <p className="text-gray-700">
                  While other platforms require thousands per month to get started, Senova works with any budget.
                  Start small, test what works, then scale up when you're ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2 mb-4">Choose Your Growth Plan</h2>
            <p className="text-lead mb-8">
              All plans include customer management, marketing tools, and real support
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual <span className="text-senova-electric font-semibold ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight
                    ? 'border-2 shadow-xl scale-105 z-10'
                    : 'border shadow-lg'
                }`}
                style={{
                  borderColor: plan.highlight ? 'var(--color-primary)' : '#e5e7eb',
                  backgroundColor: plan.highlight ? 'rgba(74, 0, 212, 0.02)' : 'white'
                }}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span
                      className="inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold text-white bg-senova-electric shadow-lg"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="heading-3 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold">
                      {billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual}
                    </span>
                    {plan.priceMonthly !== 'Custom' && (
                      <span className="text-gray-600">/month</span>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                  {plan.bonus && (
                    <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                      {plan.bonus}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-sm">
                      <Check className="h-5 w-5 flex-shrink-0 mt-0.5 mr-3" style={{ color: 'var(--color-success)' }} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations?.map((limitation, limitIndex) => (
                    <li key={limitIndex} className="flex items-start text-sm">
                      <X className="h-5 w-5 flex-shrink-0 mt-0.5 mr-3 text-gray-400" />
                      <span className="text-gray-500">{limitation}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaLink}
                  className={plan.highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}
                >
                  {plan.ctaText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2 mb-4">See How We Compare</h2>
            <p className="text-lead">
              Compare Senova to agencies and other CRM platforms
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-hidden rounded-xl border border-gray-200 shadow-lg bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    {competitors.map((competitor, index) => (
                      <th
                        key={index}
                        className={`px-6 py-4 text-center text-sm font-semibold ${
                          competitor.highlighted
                            ? 'bg-gradient-to-b from-[rgba(180,249,178,0.3)] to-[rgba(180,249,178,0.1)] text-gray-900'
                            : 'text-gray-700'
                        }`}
                      >
                        {competitor.name}
                        {competitor.highlighted && (
                          <span
                            className="block mt-1 text-xs rounded-full px-2 py-0.5 mx-auto w-fit"
                            style={{
                              backgroundColor: 'var(--color-primary)',
                              color: 'white'
                            }}
                          >
                            Better Value
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Monthly Price</td>
                    {competitors.map((competitor, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center text-sm ${
                          competitor.highlighted
                            ? 'font-bold bg-gradient-to-b from-[rgba(180,249,178,0.1)] to-transparent'
                            : ''
                        }`}
                      >
                        {competitor.price}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Website Visitor Tracking</td>
                    {competitors.map((competitor, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center text-sm ${
                          competitor.highlighted
                            ? 'font-bold bg-gradient-to-b from-[rgba(180,249,178,0.1)] to-transparent'
                            : ''
                        }`}
                      >
                        {competitor.visitorId}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Smart Audiences</td>
                    {competitors.map((competitor, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center text-sm ${
                          competitor.highlighted
                            ? 'font-bold bg-gradient-to-b from-[rgba(180,249,178,0.1)] to-transparent'
                            : ''
                        }`}
                      >
                        {competitor.audiences}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Compliance & Security</td>
                    {competitors.map((competitor, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center text-sm ${
                          competitor.highlighted
                            ? 'font-bold bg-gradient-to-b from-[rgba(180,249,178,0.1)] to-transparent'
                            : ''
                        }`}
                      >
                        {competitor.compliance}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Setup Fee</td>
                    {competitors.map((competitor, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center text-sm ${
                          competitor.highlighted
                            ? 'font-bold bg-gradient-to-b from-[rgba(180,249,178,0.1)] to-transparent'
                            : ''
                        }`}
                      >
                        {competitor.setup}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Contract Required</td>
                    {competitors.map((competitor, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center text-sm ${
                          competitor.highlighted
                            ? 'font-bold bg-gradient-to-b from-[rgba(180,249,178,0.1)] to-transparent'
                            : ''
                        }`}
                      >
                        {competitor.contract}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="section-padding bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <h2 className="heading-2 text-center mb-4">What's Included in Every Plan</h2>
            <p className="text-lead text-center mb-12">
              Big business tools at small business prices - no hidden costs
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Smart Advertising Tools</h3>
                <p className="text-gray-600 mb-3">
                  Find and reach the right customers without the confusion
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Target the right people</li>
                  <li>• Control where ads show</li>
                  <li>• Advertise anywhere online</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Transparent Pricing</h3>
                <p className="text-gray-600 mb-3">
                  No hidden fees, no surprises, no long contracts
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• See where every dollar goes</li>
                  <li>• Cancel or change anytime</li>
                  <li>• Scale up or down as needed</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Everything You Need</h3>
                <p className="text-gray-600 mb-3">
                  Full platform access with no limits or restrictions
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Real-time reports and insights</li>
                  <li>• Works with any business type</li>
                  <li>• Security and compliance included</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="heading-2 text-center mb-12">Frequently Asked Questions</h2>

            <div className="space-y-8">
              {[
                {
                  question: "What's included in the free trial?",
                  answer: "You get full access to all Professional plan features for 14 days. No credit card required. We'll help you get set up and show you how everything works."
                },
                {
                  question: "Can I change plans anytime?",
                  answer: "Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect on your next billing date."
                },
                {
                  question: "Do I really save money vs agencies?",
                  answer: "Yes! Most businesses save 30-50% compared to agency fees. You pay wholesale prices for advertising and skip the markups."
                },
                {
                  question: "What happens to my data if I cancel?",
                  answer: "Your data is always yours. If you cancel, we'll give you a full export of all your customer records and keep them secure for 90 days."
                },
                {
                  question: "Do you offer discounts for multiple locations?",
                  answer: "Yes! Our Enterprise plan offers volume discounts for businesses with multiple locations. Contact our sales team for custom pricing."
                }
              ].map((faq, index) => (
                <div key={index} className="border-b pb-8 last:border-b-0">
                  <h3 className="heading-4 mb-4">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        headline="Start Getting More Customers Today"
        subheadline="Join thousands of businesses already saving money and growing with Senova"
        primaryCta={{
          text: "Start Free Trial",
          link: "/demo"
        }}
        secondaryCta={{
          text: "Talk to Sales",
          link: "/contact"
        }}
        trustBadges={[
          "No credit card required",
          "14-day free trial",
          "Cancel anytime"
        ]}
      />
    </>
  )
}