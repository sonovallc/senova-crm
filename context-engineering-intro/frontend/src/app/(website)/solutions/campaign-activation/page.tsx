import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, Rocket, Mail, MessageSquare, Globe, TrendingUp, Target, DollarSign, Zap } from 'lucide-react';
import '../../../../styles/design-system.css';

export const metadata: Metadata = {
  title: 'Campaign Activation - Wholesale DSP Access | Senova',
  description: 'Launch campaigns at $2-6 CPM vs industry $20-30. Direct DSP access, no markups, all channels. Start advertising at wholesale rates today.',
  openGraph: {
    title: 'Campaign Activation - Wholesale DSP Access',
    description: 'Skip the middleman. Access wholesale programmatic advertising rates directly.',
    images: ['/images/campaign-activation.jpg'],
  },
};

const features = [
  {
    title: 'Multi-Channel Campaigns',
    description: 'Reach customers everywhere they are',
    icon: Globe,
    gradient: 'from-green-500 to-emerald-600',
    capabilities: [
      'Display advertising across 2M+ websites',
      'Social media: Facebook, Instagram, LinkedIn',
      'Connected TV and streaming platforms',
      'Email marketing to verified addresses',
      'SMS/text messaging campaigns',
      'Mobile app advertising',
    ],
  },
  {
    title: 'Wholesale DSP Access',
    description: 'Agency rates without the agency',
    icon: DollarSign,
    gradient: 'from-yellow-500 to-orange-600',
    capabilities: [
      'CPM rates of $2-6 vs $20-30 industry average',
      'No markups or hidden fees',
      'Direct access to The Trade Desk',
      'Amazon DSP integration',
      'Google DV360 connection',
      'Facebook Business Manager',
    ],
  },
  {
    title: 'Smart Automation',
    description: 'Set it and forget it campaigns',
    icon: Zap,
    gradient: 'from-purple-500 to-pink-600',
    capabilities: [
      'Automated bid optimization',
      'Dynamic creative optimization',
      'Weather-triggered campaigns',
      'Time-of-day scheduling',
      'Frequency capping',
      'Cross-device targeting',
    ],
  },
  {
    title: 'Real-Time Analytics',
    description: 'Know what works instantly',
    icon: TrendingUp,
    gradient: 'from-blue-500 to-indigo-600',
    capabilities: [
      'Live campaign dashboards',
      'Conversion tracking',
      'Attribution reporting',
      'A/B testing built-in',
      'ROI calculation',
      'Competitive benchmarking',
    ],
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Define Audience',
    description: 'Choose from pre-built or custom audiences'
  },
  {
    number: '02',
    title: 'Select Channels',
    description: 'Pick where your ads will appear'
  },
  {
    number: '03',
    title: 'Set Budget',
    description: 'Control costs with daily limits'
  },
  {
    number: '04',
    title: 'Launch & Optimize',
    description: 'AI optimizes for best results'
  }
];

const benefits = [
  {
    icon: Rocket,
    title: 'Launch in 24 Hours',
    description: 'From idea to live campaign in one day'
  },
  {
    icon: Target,
    title: 'Precision Targeting',
    description: 'Reach exactly who you want, when you want'
  },
  {
    icon: Mail,
    title: 'All Channels Included',
    description: 'Email, SMS, display, social, TV - all in one'
  },
  {
    icon: MessageSquare,
    title: 'No Contracts',
    description: 'Month-to-month, pause or cancel anytime'
  }
];

export default function CampaignActivationPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <span className="text-emerald-400 text-sm font-semibold">SOLUTION: CAMPAIGN ACTIVATION</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Advertise at{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                Wholesale Rates
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-emerald-100 mb-8 max-w-3xl mx-auto">
              Skip the agency markups. Get direct DSP access at $2-6 CPM instead of $20-30.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                See Campaign Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                View Pricing
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap gap-6 justify-center text-sm text-emerald-200">
              {['No contracts', '$100 minimum', 'Cancel anytime', 'White-label available'].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-green-500 rounded-full blur-3xl opacity-10 animate-pulse delay-1000" />
      </section>

      {/* Features Section with Premium Cards */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Complete Campaign Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to launch, manage, and optimize campaigns
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
              Launch your first campaign in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {processSteps.map((step, idx) => (
              <div key={idx} className="relative">
                {idx < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 text-white text-2xl font-bold rounded-2xl mb-4 shadow-lg">
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
              Direct access, transparent pricing, real results
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-8 h-8 text-emerald-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="relative py-20 bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Stop Overpaying for Advertising
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Get wholesale rates that agencies pay, not retail markups
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white text-emerald-900 font-semibold rounded-lg hover:shadow-xl hover:shadow-white/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Saving Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                See Rate Comparison
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 justify-center text-sm text-emerald-200">
              {['$100 minimum spend', 'No setup fees', 'Pause anytime', 'Full transparency'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Elements */}
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/3 -left-48 w-96 h-96 bg-green-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
      </section>
    </main>
  );
}