import { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ArrowRight, Users, Calendar, BarChart3, Zap, Shield, Globe } from 'lucide-react';

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
    capabilities: [
      'Complete purchase and service history',
      'Project galleries and portfolios',
      'Contracts and documentation',
      'Communication preferences',
      'Lifetime value and visit frequency',
      'Family/referral connections',
    ],
  },
  {
    title: 'Smart Service Tracking',
    description: 'Never miss a follow-up or renewal opportunity',
    icon: Calendar,
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

const comparisonData = [
  { feature: 'Service tracking', generic: 'Basic notes only', senova: 'Full service history tracking' },
  { feature: 'Data compliance', generic: 'Not included', senova: 'Built-in security & compliance' },
  { feature: 'Industry workflows', generic: 'Must customize', senova: 'Pre-built for your industry' },
  { feature: 'Media management', generic: 'Not available', senova: 'Integrated galleries' },
  { feature: 'Membership tracking', generic: 'Manual only', senova: 'Automated with usage' },
];

const metrics = [
  { value: '30%', label: 'Reduction in no-shows', description: 'Smart reminders and customer engagement' },
  { value: '45%', label: 'Increase in retention', description: 'Automated recall and follow-ups' },
  { value: '3.2X', label: 'More sales booked', description: 'From automated campaigns' },
  { value: '2 hours', label: 'Saved per day', description: 'On administrative tasks' },
];

export default function CRMSolutionPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              The Only CRM Built Specifically for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                Growing Businesses
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Manage customers, services, and campaigns in one secure platform that actually understands your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="btn-primary">
                See CRM Demo
              </Link>
              <Link href="#features" className="btn-secondary">
                Compare Features
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
                Generic CRMs Don't Understand Your Business
              </h2>
              <ul className="space-y-4">
                {[
                  "Can't track services and products properly",
                  'No project history or portfolio galleries',
                  'Missing contracts and compliance tools',
                  'No integration with industry-specific tools',
                  "Can't handle membership programs or packages",
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
                Purpose-Built for Your Business
              </h2>
              <ul className="space-y-4">
                {[
                  'Track every service, product, and transaction',
                  'Automated recall for renewals and maintenance',
                  'Built-in contracts and media management',
                  'Integrates with Aesthetics Pro, Nextech, and more',
                  'Membership and package tracking included',
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Customer Management</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your business efficiently
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
            <h2 className="text-4xl font-bold mb-4">ROI You Can Measure</h2>
            <p className="text-xl text-amber-100">Real results from real practices</p>
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

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">vs. Generic CRMs</h2>
            <p className="text-xl text-gray-600">See why practices choose Senova</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-500">Generic CRM</th>
                    <th className="text-center py-4 px-6 font-semibold text-orange-600">Senova CRM</th>
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <blockquote className="text-2xl text-gray-700 italic mb-6">
              "Finally, a CRM that speaks our language. Treatment tracking alone saves us 2 hours daily,
              and the automated recalls increased our retention by 40%."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div>
                <div className="font-semibold text-gray-900">Dr. Michelle Rodriguez</div>
                <div className="text-gray-600">Owner, Tech Solutions Inc • Dallas, TX</div>
              </div>
            </div>
            <div className="mt-4 text-orange-600 font-semibold">40% increase in customer retention</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready for a CRM That Gets Your Business?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See how Senova can transform your customer management
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
              {['14-day free trial', 'No setup fees', 'Import existing customers', 'White-glove onboarding'].map((item, idx) => (
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