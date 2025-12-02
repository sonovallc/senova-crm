import { Metadata } from 'next'
import '../../../../src/styles/design-system.css'
import {
  Building2,
  Target,
  BarChart3,
  Brain,
  Database,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Globe,
  Sparkles,
  Cloud,
  Lock,
  Cpu
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | Senova - Data Intelligence Platform for Growth',
  description:
    'Learn about Senova, a modern data intelligence company helping businesses grow with 600M+ profiles, 250B+ signals, and advanced CRM capabilities.',
  keywords: [
    'Senova team',
    'data intelligence platform',
    'audience intelligence',
    'business growth software',
    'CRM platform',
    'advertising technology',
  ],
  openGraph: {
    title: 'About Us | Senova',
    description:
      'Learn about Senova, a modern data intelligence company helping businesses grow with advanced analytics and CRM tools.',
    type: 'website',
    url: 'https://senovallc.com/about',
  },
  alternates: {
    canonical: 'https://senovallc.com/about',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section with Gradient Background */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 opacity-95"></div>
        <div className="absolute inset-0 bg-noise opacity-[0.02]"></div>

        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-20 h-96 w-96 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 opacity-20 blur-3xl animate-glow"></div>
        <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-gradient-to-br from-accent-400 to-primary-500 opacity-20 blur-3xl animate-glow-delayed"></div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              About Senova
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-primary-100">
              A modern data intelligence company transforming how businesses understand and engage with their audiences through advanced technology and actionable insights
            </p>
          </div>
        </div>
      </section>

      {/* Company Overview Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
              Data Intelligence for Modern Growth
            </h2>
            <p className="text-lg text-slate-600">
              We help businesses make smarter decisions with comprehensive data insights and powerful automation
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* What We Do */}
            <div className="premium-card group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg mb-4">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">What We Do</h3>
              <p className="text-slate-600">
                We provide comprehensive data intelligence and CRM solutions that help businesses identify, understand, and engage with their ideal customers at scale.
              </p>
            </div>

            {/* Our Scale */}
            <div className="premium-card group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg mb-4">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Our Scale</h3>
              <p className="text-slate-600">
                Access to 600M+ consumer profiles and 250B+ behavioral signals, providing unprecedented insights into customer behavior and market trends.
              </p>
            </div>

            {/* Industries We Serve */}
            <div className="premium-card group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg mb-4">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Industries We Serve</h3>
              <p className="text-slate-600">
                From healthcare and retail to professional services and hospitality, we power growth across diverse sectors with industry-specific solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
              Our Approach
            </h2>
            <p className="text-lg text-slate-600">
              What makes Senova different in the data intelligence landscape
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Transparency */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200">
                <Sparkles className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Transparency First</h3>
              <p className="text-sm text-slate-600">
                Clear, honest communication about our capabilities and limitations. No inflated metrics or misleading claims.
              </p>
            </div>

            {/* Data Quality */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-100 to-accent-200">
                <Shield className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Data Quality</h3>
              <p className="text-sm text-slate-600">
                Rigorous data verification and cleansing processes ensure accuracy and compliance with privacy regulations.
              </p>
            </div>

            {/* Real Results */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-accent-100">
                <TrendingUp className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Proven Results</h3>
              <p className="text-sm text-slate-600">
                Focus on measurable outcomes and ROI. We help you track, measure, and optimize every campaign.
              </p>
            </div>

            {/* Innovation */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-100 to-primary-100">
                <Zap className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Continuous Innovation</h3>
              <p className="text-sm text-slate-600">
                Regular platform updates with new features based on customer feedback and industry evolution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
              Technology That Powers Growth
            </h2>
            <p className="text-lg text-slate-600">
              Built on modern infrastructure designed for scale, speed, and security
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Data Intelligence Platform */}
            <div className="premium-card-hover group">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Data Intelligence Platform</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-primary-500">•</span>
                      600M+ consumer profiles with demographic and behavioral data
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary-500">•</span>
                      250B+ signals processed for daily insights
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary-500">•</span>
                      Advanced segmentation and audience building
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary-500">•</span>
                      Predictive analytics and trend forecasting
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* DSP & Advertising */}
            <div className="premium-card-hover group">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">DSP & Advertising Capabilities</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-accent-500">•</span>
                      Programmatic advertising across multiple channels
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-accent-500">•</span>
                      Programmatic bidding and optimization
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-accent-500">•</span>
                      Cross-device targeting and attribution
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-accent-500">•</span>
                      Campaign performance analytics
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CRM Features */}
            <div className="premium-card-hover group">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">CRM & Customer Management</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-primary-500">•</span>
                      Unified customer view across all touchpoints
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary-500">•</span>
                      Automated lead scoring and nurturing
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary-500">•</span>
                      Multi-channel communication tools
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary-500">•</span>
                      Pipeline management and forecasting
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="premium-card-hover group">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 text-white shadow-lg">
                  <Cloud className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Modern Infrastructure</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start">
                      <span className="mr-2 text-secondary-500">•</span>
                      Cloud-native architecture for infinite scale
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-secondary-500">•</span>
                      High-performance data processing pipelines
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-secondary-500">•</span>
                      API-first design for easy integration
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-slate-300">
              Your data is protected by industry-leading security measures and compliance standards
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
              <Lock className="h-8 w-8 text-primary-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">End-to-End Encryption</h3>
              <p className="text-sm text-slate-400">
                All data transmissions and storage encrypted using industry-standard protocols
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
              <Shield className="h-8 w-8 text-accent-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Enterprise Security</h3>
              <p className="text-sm text-slate-400">
                Built with enterprise-grade security ensuring high standards
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
              <Cpu className="h-8 w-8 text-primary-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">GDPR Compliant</h3>
              <p className="text-sm text-slate-400">
                Full compliance with GDPR and other privacy regulations worldwide
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
              <Database className="h-8 w-8 text-accent-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Regular Audits</h3>
              <p className="text-sm text-slate-400">
                Continuous security audits and penetration testing to maintain highest standards
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
              <Cloud className="h-8 w-8 text-primary-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Secure Infrastructure</h3>
              <p className="text-sm text-slate-400">
                Hosted on enterprise cloud infrastructure with redundancy and disaster recovery
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
              <Users className="h-8 w-8 text-accent-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Access Controls</h3>
              <p className="text-sm text-slate-400">
                Role-based access controls and multi-factor authentication for all users
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600"></div>
        <div className="absolute inset-0 bg-noise opacity-[0.02]"></div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join forward-thinking companies using Senova to unlock the power of data intelligence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-primary-600 shadow-xl hover:bg-primary-50 transition-all duration-300"
            >
              Book Consultation
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-6 py-3 text-base font-semibold text-white shadow-xl hover:bg-primary-400 transition-all duration-300"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}