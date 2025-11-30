import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, Cloud, Database, Globe, Lock, Mail, MessageSquare, Phone, Shield, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Integrations | Senova CRM',
  description: 'Connect Senova with your entire tech stack. Native integrations with EMR, practice management, and marketing tools.',
}

const integrations = [
  {
    category: 'Practice Management',
    items: [
      { name: 'Nextech', icon: Database, status: 'Available' },
      { name: 'Modernizing Medicine', icon: Database, status: 'Available' },
      { name: 'Athenahealth', icon: Database, status: 'Coming Soon' },
      { name: 'DrChrono', icon: Database, status: 'Coming Soon' },
    ]
  },
  {
    category: 'Communication',
    items: [
      { name: 'Twilio', icon: MessageSquare, status: 'Available' },
      { name: 'Mailgun', icon: Mail, status: 'Available' },
      { name: 'SendGrid', icon: Mail, status: 'Available' },
      { name: 'RingCentral', icon: Phone, status: 'Coming Soon' },
    ]
  },
  {
    category: 'Marketing Tools',
    items: [
      { name: 'Google Ads', icon: Globe, status: 'Available' },
      { name: 'Facebook Ads', icon: Globe, status: 'Available' },
      { name: 'Google Analytics', icon: Globe, status: 'Available' },
      { name: 'Zapier', icon: Zap, status: 'Available' },
    ]
  },
  {
    category: 'Security & Compliance',
    items: [
      { name: 'Auth0', icon: Lock, status: 'Available' },
      { name: 'Okta', icon: Shield, status: 'Available' },
      { name: 'AWS HIPAA', icon: Cloud, status: 'Available' },
      { name: 'Google Cloud HIPAA', icon: Cloud, status: 'Available' },
    ]
  }
]

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-senova-gray-100/20">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-48 w-96 h-96 bg-senova-primary rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 -right-48 w-96 h-96 bg-senova-accent rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl mb-6 bg-gradient-to-r from-senova-primary to-senova-primary-light bg-clip-text text-transparent">
              Seamless Integrations
            </h1>
            <p className="text-xl text-senova-gray-600 mb-8 font-body">
              Connect Senova with your entire practice ecosystem. Native integrations with the tools you already use.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-senova-accent to-senova-success text-senova-dark hover:text-white font-bold"
              asChild
            >
              <Link href="/demo">
                See Integrations Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {integrations.map((category, categoryIndex) => (
            <div key={category.category} className="mb-12">
              <h2 className="font-display font-bold text-2xl mb-6 text-senova-dark">
                {category.category}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.items.map((item, index) => (
                  <div
                    key={item.name}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in group"
                    style={{ animationDelay: `${(categoryIndex * 4 + index) * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-senova-accent/20 to-senova-primary/20 group-hover:from-senova-accent/30 group-hover:to-senova-primary/30 transition-colors duration-300">
                        <item.icon className="h-5 w-5 text-senova-primary" />
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        item.status === 'Available'
                          ? 'bg-senova-success/10 text-senova-success'
                          : 'bg-senova-gray-100 text-senova-gray-500'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-lg text-senova-dark">
                      {item.name}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-gradient-to-br from-senova-dark to-senova-gray-900 rounded-3xl p-12 text-white">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display font-bold text-3xl mb-4">
                  Powerful API for Custom Integrations
                </h2>
                <p className="text-lg mb-6 opacity-90 font-body">
                  Build custom integrations with our RESTful API. Full documentation, SDKs, and dedicated support for your development team.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-senova-accent" />
                    <span className="font-body">RESTful API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-senova-accent" />
                    <span className="font-body">Webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-senova-accent" />
                    <span className="font-body">OAuth 2.0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-senova-accent" />
                    <span className="font-body">HIPAA Compliant</span>
                  </div>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <Button
                  size="lg"
                  className="bg-white text-senova-primary hover:bg-senova-gray-100 font-semibold"
                  asChild
                >
                  <Link href="/docs">
                    View API Documentation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display font-bold text-3xl mb-4">
              Don't See Your Integration?
            </h2>
            <p className="text-lg text-senova-gray-600 mb-8 font-body max-w-2xl mx-auto">
              We're constantly adding new integrations. Let us know what you need and we'll make it happen.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="border-senova-primary text-senova-primary hover:bg-senova-primary hover:text-white font-semibold"
              asChild
            >
              <Link href="/contact">
                Request Integration
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}