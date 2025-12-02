import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import {
  Zap,
  Target,
  BarChart3,
  Globe,
  Shield,
  Users,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Building2,
  UserCheck,
  TrendingUp
} from 'lucide-react'

// SEO metadata
export const metadata: Metadata = {
  title: 'Senova - AI-Powered Customer Data Platform | 600M+ Profiles',
  description: 'Transform your marketing with 600M+ consumer profiles and 250B+ data signals. Enterprise-grade customer intelligence platform for data-driven businesses.',
  keywords: 'customer data platform, CDP, audience intelligence, data management platform, marketing analytics, customer insights',
  openGraph: {
    title: 'Senova - AI-Powered Customer Data Platform',
    description: 'Transform your marketing with 600M+ consumer profiles and 250B+ data signals.',
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
    title: 'Senova - AI-Powered Customer Data Platform',
    description: 'Transform your marketing with 600M+ consumer profiles and 250B+ data signals.',
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

export default function HomePage() {
  return (
    <>
      {/* Schema.org structured data */}
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
                "name": "Senova Platform",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "offers": {
                  "@type": "AggregateOffer",
                  "lowPrice": "299",
                  "highPrice": "599",
                  "priceCurrency": "USD",
                  "offerCount": "3"
                }
              }
            ]
          })
        }}
      />

      {/* Hero Section with Premium Design */}
      <section className="relative min-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 overflow-hidden">
        {/* Animated Glow Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Main Headline with Gradient */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Transform Data Into Revenue
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Access 600M+ consumer profiles and 250B+ data signals to power your marketing campaigns with unprecedented precision
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-full hover:from-blue-700 hover:to-violet-700 transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
              >
                View Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-full hover:bg-white/10 transform hover:-translate-y-1 transition-all duration-300"
              >
                Book Consultation
              </Link>
            </div>

            {/* Real Capabilities */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  600M+
                </div>
                <div className="text-sm text-gray-400 mt-2">Consumer Profiles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  250B+
                </div>
                <div className="text-sm text-gray-400 mt-2">Data Signals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Daily
                </div>
                <div className="text-sm text-gray-400 mt-2">Data Updates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Cards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Enterprise-Grade Features
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to understand, reach, and engage your customers at scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Target,
                title: 'Audience Intelligence',
                description: 'Build precise audience segments using demographic, behavioral, and transactional data from our comprehensive database.',
                color: 'from-blue-500 to-blue-600'
              },
              {
                icon: Zap,
                title: 'Campaign Activation',
                description: 'Deploy campaigns instantly across multiple channels with our integrated activation platform.',
                color: 'from-violet-500 to-violet-600'
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Track performance with comprehensive dashboards and attribution modeling to optimize your campaigns.',
                color: 'from-indigo-500 to-indigo-600'
              },
              {
                icon: Globe,
                title: 'Omnichannel Reach',
                description: 'Reach customers across display, mobile, CTV, audio, and digital out-of-home channels.',
                color: 'from-blue-500 to-indigo-600'
              },
              {
                icon: Shield,
                title: 'Privacy-First Design',
                description: 'Built with privacy and security as core principles, following industry best practices for data protection.',
                color: 'from-green-500 to-emerald-600'
              },
              {
                icon: Users,
                title: 'Identity Resolution',
                description: 'Unify customer data across devices and touchpoints for a complete customer view.',
                color: 'from-purple-500 to-purple-600'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Four simple steps to transform your marketing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: '1',
                title: 'Connect Your Data',
                description: 'Integrate your first-party data with our platform through secure APIs or file uploads'
              },
              {
                step: '2',
                title: 'Enrich & Enhance',
                description: 'Match and enrich your data with our 600M+ consumer profiles and behavioral signals'
              },
              {
                step: '3',
                title: 'Build Audiences',
                description: 'Create precise audience segments using our AI-powered audience builder'
              },
              {
                step: '4',
                title: 'Activate & Measure',
                description: 'Deploy campaigns across channels and track performance with daily updates'
              }
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                {/* Step Number */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl">
                  {item.step}
                </div>
                {/* Flow Line */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-blue-200 to-violet-200"></div>
                )}
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Industry Solutions
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Specialized solutions for healthcare and business services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Medical Spas',
                description: 'Patient acquisition and retention solutions',
                link: '/industries/medical-spas',
                gradient: 'from-pink-500 to-rose-600'
              },
              {
                name: 'Dermatology',
                description: 'Targeted patient outreach and engagement',
                link: '/industries/dermatology',
                gradient: 'from-blue-500 to-cyan-600'
              },
              {
                name: 'Plastic Surgery',
                description: 'Premium patient targeting and nurturing',
                link: '/industries/plastic-surgery',
                gradient: 'from-purple-500 to-violet-600'
              },
              {
                name: 'Aesthetic Clinics',
                description: 'Growth strategies for aesthetic practices',
                link: '/industries/aesthetic-clinics',
                gradient: 'from-amber-500 to-orange-600'
              }
            ].map((industry, index) => (
              <Link
                key={index}
                href={industry.link}
                className="group relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${industry.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${industry.gradient} flex items-center justify-center mb-4`}>
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-violet-600 group-hover:bg-clip-text transition-all duration-300">
                    {industry.name}
                  </h3>
                  <p className="text-sm text-gray-600">{industry.description}</p>
                  <div className="mt-4 flex items-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className={`bg-gradient-to-r ${industry.gradient} bg-clip-text text-transparent`}>
                      Learn more
                    </span>
                    <ArrowRight className="ml-1 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-violet-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join leading brands using Senova to drive growth with data-driven marketing
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-blue-600 rounded-full hover:bg-gray-100 transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-full hover:bg-white/10 transform hover:-translate-y-1 transition-all duration-300"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}