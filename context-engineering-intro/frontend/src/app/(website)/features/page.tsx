import { Metadata } from 'next'
import { SenovaHero } from '@/components/website/senova-hero'
import { FeaturesGrid } from '@/components/website/features-grid'
import { CTASection } from '@/components/website/cta-section'
import { CheckCircle, Users, Brain, Mail, Target, BarChart3, Database, Calendar, Shield, Zap, Globe, Layers, X } from 'lucide-react'
import Script from 'next/script'
import Image from 'next/image'
import { images } from '@/lib/images'

export const metadata: Metadata = {
  title: 'Features | Complete Marketing Platform for Growing Businesses | Senova',
  description: 'Discover all the powerful features of Senova CRM. From customer management to marketing automation, analytics, and integrations - everything you need to grow your business.',
  keywords: 'CRM features, marketing automation features, customer management features, business analytics, email marketing, campaign management, data analytics',
  openGraph: {
    title: 'Features | Complete Marketing Platform for Growing Businesses | Senova',
    description: 'Discover all the powerful features of Senova CRM. From customer management to marketing automation, analytics, and integrations - everything you need to grow your business.',
    url: 'https://senovallc.com/features',
    siteName: 'Senova CRM',
    images: [
      {
        url: '/og-features.jpg',
        width: 1200,
        height: 630,
        alt: 'Senova CRM Features Overview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

const heroData = {
  headline: "Every Feature You Need to Grow Your Business",
  subheadline: "Stop juggling multiple tools. Get everything you need in one powerful platform that's easy to use and affordable for growing businesses.",
  ctaPrimary: {
    text: "Start Free Trial",
    link: "/demo"
  },
  ctaSecondary: {
    text: "Watch Demo",
    link: "#demo-video"
  }
}

const featureCategories = [
  {
    title: "Customer Management",
    description: "Build lasting relationships with intelligent customer data management",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    features: [
      {
        name: "360° Customer View",
        description: "See every interaction, purchase, and touchpoint in one unified profile"
      },
      {
        name: "Smart Segmentation",
        description: "Automatically group customers based on behavior, preferences, and value"
      },
      {
        name: "Contact Enrichment",
        description: "Auto-populate customer profiles with social and demographic data"
      },
      {
        name: "Relationship Tracking",
        description: "Track connections between customers, referrals, and influencers"
      },
      {
        name: "Custom Fields",
        description: "Create unlimited custom fields to track what matters to your business"
      },
      {
        name: "Activity Timeline",
        description: "Complete history of every email, call, meeting, and interaction"
      }
    ]
  },
  {
    title: "Marketing Automation",
    description: "Engage customers at scale with intelligent automation",
    icon: Zap,
    color: "from-orange-500 to-red-600",
    features: [
      {
        name: "Email Campaigns",
        description: "Design, send, and track beautiful email campaigns that convert"
      },
      {
        name: "Multi-Channel Campaigns",
        description: "Reach customers via email, SMS, social, and display ads from one place"
      },
      {
        name: "Behavioral Triggers",
        description: "Send the right message when customers take specific actions"
      },
      {
        name: "A/B Testing",
        description: "Test different messages, designs, and timing to optimize results"
      },
      {
        name: "Template Library",
        description: "100+ proven templates for every industry and occasion"
      },
      {
        name: "Dynamic Content",
        description: "Personalize every message with customer data and preferences"
      }
    ]
  },
  {
    title: "Audience Intelligence",
    description: "Find and understand your perfect customers with AI-powered insights",
    icon: Brain,
    color: "from-purple-500 to-pink-600",
    features: [
      {
        name: "Visitor Identification",
        description: "Know who's visiting your website even before they fill out a form"
      },
      {
        name: "Lookalike Audiences",
        description: "Find new customers similar to your best existing ones"
      },
      {
        name: "Predictive Scoring",
        description: "AI predicts which leads are most likely to convert"
      },
      {
        name: "Intent Signals",
        description: "See when customers are ready to buy based on behavior"
      },
      {
        name: "Demographic Insights",
        description: "Understand your audience's age, income, interests, and lifestyle"
      },
      {
        name: "Competitive Intelligence",
        description: "See which competitors your customers are considering"
      }
    ]
  },
  {
    title: "Analytics & Reporting",
    description: "Make data-driven decisions with real-time insights",
    icon: BarChart3,
    color: "from-green-500 to-teal-600",
    features: [
      {
        name: "Revenue Attribution",
        description: "See exactly which campaigns drive revenue, not just clicks"
      },
      {
        name: "Customer Lifetime Value",
        description: "Understand the true value of each customer segment"
      },
      {
        name: "Campaign ROI",
        description: "Track return on investment for every marketing dollar spent"
      },
      {
        name: "Custom Dashboards",
        description: "Build dashboards that show the metrics that matter to you"
      },
      {
        name: "Automated Reports",
        description: "Get weekly and monthly reports delivered to your inbox"
      },
      {
        name: "Funnel Analytics",
        description: "See where customers drop off and optimize conversion paths"
      }
    ]
  },
  {
    title: "Team Collaboration",
    description: "Work together seamlessly with built-in collaboration tools",
    icon: Layers,
    color: "from-cyan-500 to-blue-600",
    features: [
      {
        name: "Shared Inbox",
        description: "Manage all customer communications from one shared inbox"
      },
      {
        name: "Task Management",
        description: "Assign, track, and complete tasks without leaving the CRM"
      },
      {
        name: "Team Calendar",
        description: "Schedule meetings and see team availability at a glance"
      },
      {
        name: "Internal Notes",
        description: "Add context and collaborate on customer accounts"
      },
      {
        name: "Role-Based Access",
        description: "Control who can see and do what with granular permissions"
      },
      {
        name: "Activity Feeds",
        description: "Stay updated on team activities and customer interactions"
      }
    ]
  },
  {
    title: "Security & Compliance",
    description: "Enterprise-grade security to protect your business and customers",
    icon: Shield,
    color: "from-gray-600 to-gray-800",
    features: [
      {
        name: "HIPAA Compliant",
        description: "Full HIPAA compliance for healthcare organizations"
      },
      {
        name: "Data Encryption",
        description: "Bank-level encryption for all data at rest and in transit"
      },
      {
        name: "Audit Logs",
        description: "Complete audit trail of all user actions and data changes"
      },
      {
        name: "Two-Factor Authentication",
        description: "Extra layer of security for user accounts"
      },
      {
        name: "GDPR Tools",
        description: "Built-in tools for GDPR compliance and data privacy"
      },
      {
        name: "Automatic Backups",
        description: "Daily backups with one-click restore capabilities"
      }
    ]
  }
]

const integrations = [
  { name: "Stripe", category: "Payments" },
  { name: "QuickBooks", category: "Accounting" },
  { name: "Shopify", category: "E-commerce" },
  { name: "WordPress", category: "Website" },
  { name: "Google Ads", category: "Advertising" },
  { name: "Facebook", category: "Social" },
  { name: "Mailgun", category: "Email" },
  { name: "Twilio", category: "SMS" },
  { name: "Zapier", category: "Automation" },
  { name: "Slack", category: "Communication" },
  { name: "Google Analytics", category: "Analytics" },
  { name: "Calendly", category: "Scheduling" }
]

export default function FeaturesPage() {
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
            "applicationCategory": "BusinessApplication",
            "description": "Complete marketing platform with CRM, automation, and analytics",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "97",
              "priceCurrency": "USD"
            }
          })
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-senova-primary/5 via-senova-accent/5 to-senova-info/5" />
        </div>
        <div className="relative z-10">
          <SenovaHero {...heroData} />
        </div>
      </section>

      {/* Features Overview Grid */}
      <section className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2 mb-4">
              Everything You Need, Nothing You Don't
            </h2>
            <p className="text-lead">
              We've packed everything a growing business needs into one simple platform.
              No feature bloat, no complexity - just the tools that actually help you grow.
            </p>
          </div>

          {/* Quick Feature Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-16">
            {[
              "CRM & Contacts", "Email Marketing", "SMS Campaigns", "Social Media Ads",
              "Display Advertising", "Landing Pages", "Forms & Surveys", "Analytics Dashboard",
              "Customer Segmentation", "Marketing Automation", "Lead Scoring", "Pipeline Management",
              "Task Management", "Team Collaboration", "Calendar & Scheduling", "File Storage",
              "API Access", "Webhooks", "Custom Fields", "Import/Export",
              "Mobile App", "24/7 Support", "HIPAA Compliant", "Unlimited Users"
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-senova-primary hover:shadow-md transition-all duration-300"
              >
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Feature Categories */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2 mb-4">
              Powerful Features for Every Team
            </h2>
            <p className="text-lead">
              From marketing to sales to customer service, every team gets the tools they need to excel.
            </p>
          </div>

          <div className="space-y-16 max-w-7xl mx-auto">
            {featureCategories.map((category, categoryIndex) => {
              const Icon = category.icon
              return (
                <div key={categoryIndex} className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-start gap-4 mb-8">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="heading-3 mb-2">{category.title}</h3>
                      <p className="text-gray-600">{category.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="group">
                        <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-senova-primary transition-colors">
                          {feature.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2 mb-4">
              Connects With Everything You Already Use
            </h2>
            <p className="text-lead">
              Seamlessly integrate with your favorite tools and services. No disruption to your workflow.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {integrations.map((integration, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-senova-primary hover:shadow-lg transition-all duration-300 group"
              >
                <Globe className="h-8 w-8 text-gray-400 group-hover:text-senova-primary mb-2 transition-colors" />
                <span className="font-semibold text-gray-900">{integration.name}</span>
                <span className="text-xs text-gray-500">{integration.category}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              Plus 1000+ more integrations through Zapier and our API
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="section-padding bg-gradient-to-br from-senova-primary/5 to-senova-accent/5">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2 mb-4">
              Why Teams Choose Senova
            </h2>
            <p className="text-lead">
              See how we compare to using multiple tools or expensive enterprise solutions.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-6 font-semibold">Feature</th>
                    <th className="text-center p-6 font-semibold text-senova-primary">Senova</th>
                    <th className="text-center p-6 font-semibold text-gray-500">Multiple Tools</th>
                    <th className="text-center p-6 font-semibold text-gray-500">Enterprise CRM</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Starting Price", senova: "$97/month", multiple: "$500+/month", enterprise: "$3000+/month" },
                    { feature: "Setup Time", senova: "Same day", multiple: "2-4 weeks", enterprise: "3-6 months" },
                    { feature: "Learning Curve", senova: "Easy", multiple: "Complex", enterprise: "Very Complex" },
                    { feature: "All-in-One Platform", senova: true, multiple: false, enterprise: true },
                    { feature: "No User Limits", senova: true, multiple: false, enterprise: false },
                    { feature: "Free Support", senova: true, multiple: false, enterprise: false },
                    { feature: "Free Training", senova: true, multiple: false, enterprise: false },
                    { feature: "Cancel Anytime", senova: true, multiple: "Varies", enterprise: false },
                  ].map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-6 font-medium">{row.feature}</td>
                      <td className="p-6 text-center">
                        {typeof row.senova === 'boolean' ? (
                          row.senova ? (
                            <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-6 w-6 text-gray-400 mx-auto" />
                          )
                        ) : (
                          <span className="font-semibold text-senova-primary">{row.senova}</span>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {typeof row.multiple === 'boolean' ? (
                          row.multiple ? (
                            <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-6 w-6 text-gray-400 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-600">{row.multiple}</span>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {typeof row.enterprise === 'boolean' ? (
                          row.enterprise ? (
                            <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-6 w-6 text-gray-400 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-600">{row.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo-video" className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="heading-2 mb-4">
              See Senova in Action
            </h2>
            <p className="text-lead">
              Watch a 5-minute demo to see how easy it is to manage everything in one place.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Calendar className="h-16 w-16 mb-4 mx-auto opacity-50" />
                  <p className="text-xl mb-4">Demo Video Coming Soon</p>
                  <p className="text-gray-400">Schedule a live demo with our team instead</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        headline="Ready to Consolidate Your Tech Stack?"
        subheadline="Stop paying for multiple tools. Get everything you need in Senova for one low price."
        primaryCta={{
          text: "Start 30-Day Free Trial",
          link: "/demo"
        }}
        secondaryCta={{
          text: "Compare Pricing",
          link: "/pricing"
        }}
        trustBadges={[
          "No Credit Card Required",
          "Free Onboarding",
          "Cancel Anytime",
          "24/7 Support"
        ]}
      />
    </>
  )
}