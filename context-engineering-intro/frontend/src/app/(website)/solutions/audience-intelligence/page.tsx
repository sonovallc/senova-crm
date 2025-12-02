import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, Brain, Database, Target, TrendingUp, Users, BarChart3, Shield, Zap } from 'lucide-react';
import '../../../../styles/design-system.css';

export const metadata: Metadata = {
  title: 'Audience Intelligence Platform - 600M+ Verified Profiles | Senova',
  description: 'Identify your ideal customers with AI-powered audience intelligence. Access 600M+ verified profiles, 250B+ behavioral signals. Get started today.',
  openGraph: {
    title: 'Audience Intelligence Platform - 600M+ Verified Profiles',
    description: 'Identify your ideal customers with AI-powered audience intelligence.',
    images: ['/images/audience-intelligence.jpg'],
  },
};

const features = [
  {
    title: 'Deep Customer Profiling',
    description: 'Complete 360-degree view of your audience',
    icon: Users,
    gradient: 'from-violet-500 to-purple-600',
    capabilities: [
      '600M+ verified consumer profiles',
      'Demographics, psychographics, behaviors',
      'Purchase intent and brand affinity',
      'Life events and trigger moments',
      'Household and income data',
      'Social media and online activity',
    ],
  },
  {
    title: 'Behavioral Signals',
    description: 'Track what your audience is doing right now',
    icon: Brain,
    gradient: 'from-blue-500 to-cyan-600',
    capabilities: [
      '250B+ weekly behavioral signals',
      'Website visits and content consumption',
      'Search intent and keywords',
      'Competitor website activity',
      'Purchase patterns and timing',
      'Device and channel preferences',
    ],
  },
  {
    title: 'Lookalike Audience Building',
    description: 'Find more customers like your best ones',
    icon: Target,
    gradient: 'from-emerald-500 to-green-600',
    capabilities: [
      'Upload your customer list',
      'AI analyzes common attributes',
      'Identifies similar profiles',
      'Scales to millions of prospects',
      'Continuous learning and optimization',
      'Export to any marketing platform',
    ],
  },
  {
    title: 'Predictive Analytics',
    description: 'Know what customers will do next',
    icon: TrendingUp,
    gradient: 'from-orange-500 to-red-600',
    capabilities: [
      'Purchase probability scoring',
      'Churn risk identification',
      'Lifetime value prediction',
      'Next best action recommendations',
      'Seasonal trend analysis',
      'Market opportunity sizing',
    ],
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Connect Your Data',
    description: 'Import CRM, website analytics, or customer lists'
  },
  {
    number: '02',
    title: 'AI Analysis',
    description: 'Our AI identifies patterns and opportunities'
  },
  {
    number: '03',
    title: 'Build Audiences',
    description: 'Create targeted segments for campaigns'
  },
  {
    number: '04',
    title: 'Activate Everywhere',
    description: 'Export to email, social, DSP platforms'
  }
];

const benefits = [
  {
    icon: Database,
    title: '600M+ Verified Profiles',
    description: 'Largest proprietary consumer database with daily verification'
  },
  {
    icon: Shield,
    title: '99.5% Data Accuracy',
    description: 'Industry-leading data quality with continuous validation'
  },
  {
    icon: Zap,
    title: 'Daily Updates',
    description: 'Data refreshed continuously, not monthly batches'
  },
  {
    icon: BarChart3,
    title: 'Transparent Analytics',
    description: 'See exactly how audiences are built and why'
  }
];

export default function AudienceIntelligencePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-900 to-purple-900 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <span className="text-violet-400 text-sm font-semibold">SOLUTION: AUDIENCE INTELLIGENCE</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Know Your Customers{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                Before They Know You
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
              AI-powered audience intelligence with 600M+ verified profiles and 250B+ behavioral signals
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5"
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
            <div className="mt-12 flex flex-wrap gap-6 justify-center text-sm text-purple-200">
              {['GDPR Compliant', 'CCPA Compliant', 'Enterprise Security', '99.5% Accuracy'].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-violet-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse delay-1000" />
      </section>

      {/* Features Section with Premium Cards */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Complete Audience Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Understand, identify, and reach your ideal customers with precision
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
              From data to insights to action in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {processSteps.map((step, idx) => (
              <div key={idx} className="relative">
                {idx < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 text-white text-2xl font-bold rounded-2xl mb-4 shadow-lg">
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
              Real data, real results, real ROI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-8 h-8 text-violet-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="relative py-20 bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Start Understanding Your Audience Today
            </h2>
            <p className="text-xl text-violet-100 mb-8">
              Full access to 600M+ profiles with flexible plans
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white text-violet-900 font-semibold rounded-lg hover:shadow-xl hover:shadow-white/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                See Pricing
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 justify-center text-sm text-violet-200">
              {['No credit card required', 'Full platform access', 'Cancel anytime', 'White-glove support'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Elements */}
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-violet-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/3 -left-48 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
      </section>
    </main>
  );
}