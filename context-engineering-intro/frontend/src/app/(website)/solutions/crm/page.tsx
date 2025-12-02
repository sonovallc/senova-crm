import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, Users, Calendar, BarChart3, Zap, Shield, Globe, Briefcase, TrendingUp } from 'lucide-react';
import '../../../../styles/design-system.css';

export const metadata: Metadata = {
  title: 'Business CRM That Drives 3X More Sales | Senova',
  description: 'Purpose-built CRM for growing businesses: Track customers, automate follow-ups, manage multi-locations. Replace 5 tools with 1. See demo now.',
  openGraph: {
    title: 'Business CRM That Drives 3X More Sales | Senova',
    description: 'Purpose-built CRM for growing businesses: Track customers, automate follow-ups, manage multi-locations.',
    images: ['/images/crm-dashboard.jpg'],
  },
};

const features = [
  {
    title: '360° Customer Profiles',
    description: 'Everything about your customer in one place',
    icon: Users,
    gradient: 'from-blue-500 to-indigo-600',
    capabilities: [
      'Complete purchase and service history',
      'Project galleries and portfolios',
      'Contracts and documentation',
      'Communication preferences',
      'Lifetime value and visit frequency',
      'Family and referral connections',
    ],
  },
  {
    title: 'Smart Service Tracking',
    description: 'Never miss a follow-up or renewal opportunity',
    icon: Calendar,
    gradient: 'from-emerald-500 to-teal-600',
    capabilities: [
      'Track services and products used',
      'Record project details and specifications',
      'Set automatic renewal reminders',
      'Monitor service intervals',
      'Package and membership usage',
      'Product inventory integration',
    ],
  },
  {
    title: 'Automated Campaigns',
    description: 'Right message, right time, automatically',
    icon: Zap,
    gradient: 'from-violet-500 to-purple-600',
    capabilities: [
      'Birthday and anniversary campaigns',
      'Service due reminders',
      'Post-service follow-ups',
      'Win-back campaigns for lapsed customers',
      'VIP and loyalty programs',
      'Seasonal promotion automation',
    ],
  },
  {
    title: 'Multi-Location Management',
    description: 'Manage all locations from one dashboard',
    icon: Globe,
    gradient: 'from-orange-500 to-red-600',
    capabilities: [
      'Centralized customer database',
      'Location-specific campaigns',
      'Cross-location reporting',
      'Staff schedule management',
      'Inventory tracking by location',
      'Franchise support tools',
    ],
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Import Your Data',
    description: 'Seamlessly migrate from any existing CRM or spreadsheet'
  },
  {
    number: '02',
    title: 'Customize Workflows',
    description: 'Set up automated campaigns and follow-up sequences'
  },
  {
    number: '03',
    title: 'Track Everything',
    description: 'Monitor customer interactions and service history'
  },
  {
    number: '04',
    title: 'Grow Revenue',
    description: 'Watch conversions increase with automated engagement'
  }
];

const benefits = [
  {
    icon: TrendingUp,
    title: 'Increase Customer Retention',
    description: 'Automated follow-ups and reminders keep customers coming back'
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'Enterprise-grade security with HIPAA compliance available'
  },
  {
    icon: Briefcase,
    title: 'Industry-Specific Features',
    description: 'Built for medical aesthetics, healthcare, and professional services'
  },
  {
    icon: BarChart3,
    title: 'Daily Analytics Updates',
    description: 'Track ROI, customer lifetime value, and campaign performance'
  }
];

export default function CRMSolutionPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <span className="text-emerald-400 text-sm font-semibold">SOLUTION: CRM</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              The Only CRM Built for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                Growing Businesses
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Manage customers, services, and campaigns in one secure platform that actually understands your business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                See CRM Demo
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
            <div className="mt-12 flex flex-wrap gap-6 justify-center text-sm text-slate-400">
              {['Enterprise Security', 'HIPAA Available', 'High Reliability', '24/7 Support'].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-violet-500 rounded-full blur-3xl opacity-10 animate-pulse delay-1000" />
      </section>

      {/* Features Section with Premium Cards */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Complete Customer Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to track, engage, and grow your customer base
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
              Get started in minutes, see results in days
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {processSteps.map((step, idx) => (
              <div key={idx} className="relative">
                {idx < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 text-white text-2xl font-bold rounded-2xl mb-4 shadow-lg">
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
              Why Choose Senova CRM
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on real capabilities, not empty promises
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="relative py-20 bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready for a CRM That Gets Your Business?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join businesses already growing with Senova
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-900 font-semibold rounded-lg hover:shadow-xl hover:shadow-white/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                Get Personalized Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                See Pricing Plans
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 justify-center text-sm text-blue-200">
              {['Professional consultation', 'No setup fees', 'Import existing data', 'White-glove onboarding'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Elements */}
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/3 -left-48 w-96 h-96 bg-violet-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
      </section>
    </main>
  );
}