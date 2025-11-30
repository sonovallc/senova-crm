import { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ArrowRight, Users, Target, TrendingUp, Zap, Shield, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Lead Management That Converts 3X More | Senova',
  description: 'Turn more leads into customers with intelligent lead scoring, automated nurturing, and multi-channel follow-ups. See how businesses close 3X more deals.',
  openGraph: {
    title: 'Lead Management That Converts 3X More | Senova',
    description: 'Turn more leads into customers with intelligent lead scoring, automated nurturing, and multi-channel follow-ups.',
    images: ['/images/lead-management.jpg'],
  },
};

const features = [
  {
    title: 'Intelligent Lead Scoring',
    description: 'AI-powered scoring identifies your hottest prospects',
    icon: Target,
    capabilities: [
      'Behavioral scoring based on engagement',
      'Predictive analytics for conversion likelihood',
      'Automatic lead prioritization',
      'Custom scoring rules by source',
      'Real-time score updates',
      'Lead grade visualization (A-F)',
    ],
  },
  {
    title: 'Multi-Channel Capture',
    description: 'Never miss a lead from any source',
    icon: Users,
    capabilities: [
      'Website forms and chat widgets',
      'Social media lead capture',
      'Email and SMS integration',
      'Phone call tracking',
      'QR code and event capture',
      'API for custom sources',
    ],
  },
  {
    title: 'Automated Nurturing',
    description: 'Keep leads warm until they\'re ready to buy',
    icon: Zap,
    capabilities: [
      'Drip campaigns by lead score',
      'Personalized content delivery',
      'Multi-touch attribution tracking',
      'Smart follow-up reminders',
      'Lead re-engagement campaigns',
      'Nurture path analytics',
    ],
  },
  {
    title: 'Conversion Intelligence',
    description: 'Know exactly what drives conversions',
    icon: BarChart3,
    capabilities: [
      'Lead source ROI tracking',
      'Conversion funnel analysis',
      'Win/loss reason tracking',
      'Sales velocity metrics',
      'Lead quality by campaign',
      'Revenue attribution reporting',
    ],
  },
];

const comparisonData = [
  { feature: 'Lead scoring', generic: 'Manual or basic', senova: 'AI-powered predictive scoring' },
  { feature: 'Lead routing', generic: 'Simple round-robin', senova: 'Intelligent skill-based routing' },
  { feature: 'Nurture campaigns', generic: 'One-size-fits-all', senova: 'Personalized by behavior' },
  { feature: 'Lead insights', generic: 'Basic contact info', senova: 'Full engagement history' },
  { feature: 'Response time', generic: 'Hours or days', senova: 'Under 5 minutes automated' },
];

const metrics = [
  { value: '3.2X', label: 'More conversions', description: 'With intelligent lead scoring' },
  { value: '67%', label: 'Faster response', description: 'Automated lead routing' },
  { value: '45%', label: 'Higher close rate', description: 'From nurtured leads' },
  { value: '2.5X', label: 'Better ROI', description: 'On marketing spend' },
];

export default function LeadManagementPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Convert More Leads with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                Intelligent Automation
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Stop losing leads to slow follow-ups and poor prioritization. Our AI-powered lead management
              helps you respond faster, nurture smarter, and close more deals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="btn-primary">
                See Lead Management Demo
              </Link>
              <Link href="#features" className="btn-secondary">
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why 67% of Leads Never Convert
              </h2>
              <ul className="space-y-4">
                {[
                  'Slow response times (average 47 hours)',
                  'No lead prioritization or scoring',
                  'Generic follow-up messages',
                  'Lost leads from multiple sources',
                  'No visibility into lead engagement',
                ].map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                The Senova Advantage
              </h2>
              <ul className="space-y-4">
                {[
                  'Respond in under 5 minutes automatically',
                  'AI scores and prioritizes every lead',
                  'Personalized nurture paths by behavior',
                  'Unified inbox for all lead sources',
                  'Complete engagement timeline and insights',
                ].map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Lead Management Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to capture, nurture, and convert more leads
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <feature.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-16">
                  {feature.capabilities.map((cap, capIdx) => (
                    <li key={capIdx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Metrics */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Results That Matter</h2>
            <p className="text-xl text-amber-100">Average improvements from Senova customers</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl font-bold mb-2">{metric.value}</div>
                <div className="text-lg font-semibold mb-2">{metric.label}</div>
                <div className="text-sm text-orange-200">{metric.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Scoring Visual */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">See Your Leads Differently</h2>
              <p className="text-xl text-gray-600">Our AI analyzes dozens of signals to score and prioritize leads</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-green-600">A</span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Hot Lead</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Ready to Buy</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Visited pricing page 3 times</li>
                  <li>• Downloaded case study</li>
                  <li>• Opened last 5 emails</li>
                  <li>• Matches ideal customer profile</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <span className="text-sm font-semibold text-green-600">Action: Call within 5 minutes</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border-2 border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-amber-600">B</span>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">Warm Lead</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Evaluating Options</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Viewed product demo</li>
                  <li>• Subscribed to newsletter</li>
                  <li>• Engaged with 2 emails</li>
                  <li>• Mid-market company size</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-amber-200">
                  <span className="text-sm font-semibold text-amber-600">Action: Add to nurture sequence</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-gray-600">C</span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">Cold Lead</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Early Research</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Single page visit</li>
                  <li>• No email engagement</li>
                  <li>• Unknown company info</li>
                  <li>• No content downloads</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">Action: Long-term nurture</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">vs. Traditional Lead Management</h2>
            <p className="text-xl text-gray-600">See why sales teams choose Senova</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-500">Traditional CRM</th>
                    <th className="text-center py-4 px-6 font-semibold text-orange-600">Senova</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                      <td className="py-4 px-6 text-center text-gray-500">{row.generic}</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-semibold">{row.senova}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <blockquote className="text-2xl text-gray-700 italic mb-6">
              "Senova's lead scoring alone increased our conversion rate by 45%. We're now responding to hot leads
              in minutes instead of days, and our sales team loves the prioritized workflow."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div>
                <div className="font-semibold text-gray-900">Sarah Johnson</div>
                <div className="text-gray-600">VP of Sales, TechCorp Solutions • Austin, TX</div>
              </div>
            </div>
            <div className="mt-4 text-orange-600 font-semibold">45% increase in conversion rate</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Convert More Leads?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See how Senova can transform your lead management process
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/demo" className="btn-primary">
                Get Personalized Demo
              </Link>
              <Link href="/pricing" className="btn-secondary">
                See Pricing
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['14-day free trial', 'No credit card required', 'Import existing leads', 'Full support included'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}