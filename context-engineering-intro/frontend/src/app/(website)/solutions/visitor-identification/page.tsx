import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, Eye, Users, Fingerprint, Activity, MapPin, Clock, Shield, TrendingUp } from 'lucide-react';
import '../../../../styles/design-system.css';

export const metadata: Metadata = {
  title: 'Visitor Identification - See Who Visits Your Website | Senova',
  description: 'Identify anonymous website visitors with daily updates. Turn 78% of unknown traffic into actionable leads with our SuperPixel technology.',
  openGraph: {
    title: 'Visitor Identification - See Who Visits Your Website',
    description: 'Turn anonymous website visitors into known prospects with daily visitor identification.',
    images: ['/images/visitor-identification.jpg'],
  },
};

const features = [
  {
    title: 'Daily Visitor Tracking',
    description: 'See who visited your website each day',
    icon: Eye,
    gradient: 'from-cyan-500 to-blue-600',
    capabilities: [
      'Daily visitor dashboard',
      'Page-by-page journey tracking',
      'Time spent on each page',
      'Scroll depth and engagement',
      'Form abandonment detection',
      'Exit intent identification',
    ],
  },
  {
    title: 'Identity Resolution',
    description: 'Turn anonymous visitors into known contacts',
    icon: Fingerprint,
    gradient: 'from-violet-500 to-indigo-600',
    capabilities: [
      'Match visitors to 600M+ profiles',
      'Name, email, and phone append',
      'Company and job title identification',
      'Social media profiles',
      'Demographic and psychographic data',
      'Purchase intent signals',
    ],
  },
  {
    title: 'Behavioral Intelligence',
    description: 'Understand what visitors want',
    icon: Activity,
    gradient: 'from-emerald-500 to-teal-600',
    capabilities: [
      'Content interest mapping',
      'Product view analysis',
      'Search query tracking',
      'Competitor comparison behavior',
      'Download and resource access',
      'Video engagement metrics',
    ],
  },
  {
    title: 'Location & Device Data',
    description: 'Know where and how they browse',
    icon: MapPin,
    gradient: 'from-orange-500 to-red-600',
    capabilities: [
      'City and state location',
      'Device type and browser',
      'Operating system details',
      'Screen resolution tracking',
      'Connection speed analysis',
      'Time zone and language',
    ],
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Install SuperPixel',
    description: 'Add one line of code to your website'
  },
  {
    number: '02',
    title: 'Track Visitors',
    description: 'Start seeing who visits daily'
  },
  {
    number: '03',
    title: 'Enrich Profiles',
    description: 'Get contact info and behavioral data'
  },
  {
    number: '04',
    title: 'Take Action',
    description: 'Reach out while interest is hot'
  }
];

const benefits = [
  {
    icon: Users,
    title: 'Identify 78% of Visitors',
    description: 'Industry average is 2-3% with forms alone'
  },
  {
    icon: Clock,
    title: 'Daily Alerts',
    description: 'Get notified about high-value visitors daily'
  },
  {
    icon: Shield,
    title: 'Privacy Compliant',
    description: 'GDPR, CCPA, and TCPA compliant tracking'
  },
  {
    icon: TrendingUp,
    title: 'Increase Conversions',
    description: 'Follow up with warm leads immediately'
  }
];

export default function VisitorIdentificationPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <span className="text-cyan-400 text-sm font-semibold">SOLUTION: VISITOR IDENTIFICATION</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              See Who Visits{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Your Website
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-cyan-100 mb-8 max-w-3xl mx-auto">
              Stop losing valuable website traffic. Identify anonymous visitors and turn them into customers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                See Live Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                Get Started
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap gap-6 justify-center text-sm text-cyan-200">
              {['No credit card required', '5-minute setup', 'GDPR compliant', 'Cancel anytime'].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10 animate-pulse delay-1000" />
      </section>

      {/* Features Section with Premium Cards */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Complete Visitor Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Know who visits, what they want, and how to reach them
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                <div className="relative">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`p-3 bg-gradient-to-br ${feature.gradient} rounded-xl shadow-lg`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {feature.capabilities.map((cap, capIdx) => (
                      <li key={capIdx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start identifying visitors in minutes, not months
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {processSteps.map((step, idx) => (
              <div key={idx} className="relative">
                {idx < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 text-white text-2xl font-bold rounded-2xl mb-4 shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Senova
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The most advanced visitor identification platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-8 h-8 text-cyan-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="relative py-20 bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Stop Losing 98% of Your Website Traffic
            </h2>
            <p className="text-xl text-cyan-100 mb-8">
              Start identifying visitors today with our SuperPixel technology
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white text-cyan-900 font-semibold rounded-lg hover:shadow-xl hover:shadow-white/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                View Pricing
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 justify-center text-sm text-cyan-200">
              {['5-minute setup', 'No IT required', 'Works with any website', 'Free support'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Elements */}
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/3 -left-48 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
      </section>
    </main>
  );
}