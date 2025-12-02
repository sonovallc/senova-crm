import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, BarChart3, TrendingUp, Activity, PieChart, Eye, Users, DollarSign, Target } from 'lucide-react';
import '../../../../styles/design-system.css';

export const metadata: Metadata = {
  title: 'Analytics & Attribution - Track Every Dollar | Senova',
  description: 'Daily analytics updates and attribution. Track ROI, customer lifetime value, and campaign performance. Know exactly what drives revenue.',
  openGraph: {
    title: 'Analytics & Attribution - Track Every Dollar',
    description: 'Complete visibility into marketing performance with daily analytics updates.',
    images: ['/images/analytics.jpg'],
  },
};

const features = [
  {
    title: 'Revenue Attribution',
    description: 'Know exactly what drives sales',
    icon: DollarSign,
    gradient: 'from-yellow-500 to-amber-600',
    capabilities: [
      'Multi-touch attribution modeling',
      'First-touch and last-touch analysis',
      'Custom attribution windows',
      'Cross-device tracking',
      'Offline conversion matching',
      'Revenue by source, medium, campaign',
    ],
  },
  {
    title: 'Daily Updated Dashboards',
    description: 'Fresh data updated every 24 hours',
    icon: Activity,
    gradient: 'from-red-500 to-pink-600',
    capabilities: [
      'Daily campaign performance updates',
      'Daily conversion tracking',
      'Custom dashboard builder',
      'Automated alerts and notifications',
      'Mobile app for on-the-go monitoring',
      'White-label reporting options',
    ],
  },
  {
    title: 'Customer Analytics',
    description: 'Understand your customer journey',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-600',
    capabilities: [
      'Customer lifetime value (CLV)',
      'Cohort analysis and retention',
      'RFM segmentation',
      'Churn prediction',
      'Customer journey mapping',
      'Behavioral segmentation',
    ],
  },
  {
    title: 'Performance Metrics',
    description: 'Track what matters most',
    icon: TrendingUp,
    gradient: 'from-indigo-500 to-purple-600',
    capabilities: [
      'Cost per acquisition (CPA)',
      'Return on ad spend (ROAS)',
      'Conversion rate optimization',
      'A/B test analysis',
      'Funnel visualization',
      'Custom KPI tracking',
    ],
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Connect Data Sources',
    description: 'Link all marketing and sales platforms'
  },
  {
    number: '02',
    title: 'Automatic Tracking',
    description: 'Data updates automatically every 24 hours'
  },
  {
    number: '03',
    title: 'AI Analysis',
    description: 'Machine learning finds insights'
  },
  {
    number: '04',
    title: 'Take Action',
    description: 'Optimize based on what works'
  }
];

const benefits = [
  {
    icon: Eye,
    title: 'Complete Visibility',
    description: 'See every touchpoint in the customer journey'
  },
  {
    icon: PieChart,
    title: 'Custom Reports',
    description: 'Build exactly the reports you need'
  },
  {
    icon: Target,
    title: 'Predictive Analytics',
    description: 'AI predicts future performance'
  },
  {
    icon: BarChart3,
    title: 'Benchmark Data',
    description: 'Compare to industry standards'
  }
];

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <span className="text-indigo-400 text-sm font-semibold">SOLUTION: ANALYTICS & ATTRIBUTION</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Track Every Dollar{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                That Matters
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Daily analytics updates that show exactly what drives revenue, who your best customers are, and where to invest next.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                See Analytics Demo
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
            <div className="mt-12 flex flex-wrap gap-6 justify-center text-sm text-indigo-200">
              {['Daily data updates', 'No sampling', 'GDPR compliant', 'API access'].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse delay-1000" />
      </section>

      {/* Features Section with Premium Cards */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Complete Marketing Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to measure, analyze, and optimize performance
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
              From data to insights with daily updates
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {processSteps.map((step, idx) => (
              <div key={idx} className="relative">
                {idx < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl font-bold rounded-2xl mb-4 shadow-lg">
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
              Why Choose Senova Analytics
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The most advanced analytics platform for growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-8 h-8 text-indigo-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="relative py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Stop Flying Blind. Start Growing Smart.
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Get the analytics platform that actually shows ROI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white text-indigo-900 font-semibold rounded-lg hover:shadow-xl hover:shadow-white/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                See Analytics Dashboard Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                View Pricing
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 justify-center text-sm text-indigo-200">
              {['Professional consultation', 'Flexible pricing', 'Full API access', 'Expert support'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Elements */}
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/3 -left-48 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
      </section>
    </main>
  );
}