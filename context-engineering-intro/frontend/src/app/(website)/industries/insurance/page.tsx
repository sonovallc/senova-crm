import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowRight, RefreshCw, Package, FileText, HeartHandshake, Shield, Umbrella, TrendingUp, BarChart3 } from 'lucide-react';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'CRM for Insurance Agencies | Policy Management & Cross-Sell | Senova',
  description: 'Maximize retention and cross-sell with intelligent policy management. Automated renewals, coverage gap analysis, and 94% retention rate. See demo.',
  openGraph: {
    title: 'CRM for Insurance Agencies | Policy Management & Cross-Sell',
    description: 'Maximize retention and cross-sell with intelligent policy management. Automated renewals and coverage gaps.',
    images: ['/images/insurance-crm.jpg'],
  },
};

const painPoints = [
  {
    title: 'Renewal Revenue Loss',
    description: 'Missing renewal opportunities costs 15-20% of recurring revenue',
    icon: RefreshCw,
  },
  {
    title: 'Cross-Sell Blindness',
    description: 'Agents miss 73% of cross-sell opportunities',
    icon: Package,
  },
  {
    title: 'Quote Follow-Up Failure',
    description: '60% of quotes never get proper follow-up',
    icon: FileText,
  },
  {
    title: 'Client Service Struggles',
    description: 'Poor response times to claims',
    icon: HeartHandshake,
  },
];

const solutions = [
  {
    title: 'Automated Renewal Management',
    description: 'Never miss a renewal with automated tracking',
    features: [
      '90-day renewal alerts',
      'Automated renewal campaigns',
      'Rate shopping reminders',
      'Retention risk scoring',
    ],
  },
  {
    title: 'Smart Cross-Sell Engine',
    description: 'AI identifies coverage gaps and suggests products',
    features: [
      'Coverage gap analysis',
      'Life event triggers',
      'Bundle recommendations',
      'Needs assessment automation',
    ],
  },
  {
    title: 'Quote Nurture Automation',
    description: 'Convert more quotes with persistent follow-up',
    features: [
      'Multi-touch quote follow-up',
      'Competitor comparison tools',
      'Price drop alerts',
      'Instant quote generation',
    ],
  },
  {
    title: 'Client Service Portal',
    description: 'Deliver exceptional service with 24/7 self-service',
    features: [
      'Client self-service portal',
      'Claims tracking system',
      'Policy document vault',
      'Mobile app access',
    ],
  },
];

const results = [
  { metric: '94%', description: 'Renewal rate', detail: 'Up from 82% baseline' },
  { metric: '2.8x', description: 'Policies per household', detail: 'Through cross-sell' },
  { metric: '47%', description: 'Quote-to-bind improvement', detail: 'With automated follow-up' },
  { metric: '$156K', description: 'Additional premium/agent', detail: 'From retention & cross-sell' },
];

const features = [
  'Policy tracking system',
  'Renewal automation',
  'Quote management',
  'Claims tracking',
  'Cross-sell intelligence',
  'Commission tracking',
  'Carrier integration',
  'Document management',
  'Client portal',
  'Risk assessment tools',
  'Marketing automation',
  'Performance analytics',
];

export default function InsurancePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full mb-6">
              <Umbrella className="w-4 h-4" />
              <span className="text-sm font-semibold">Built for Insurance Agencies</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Maximize Retention and Cross-Sell
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-senova-primary to-senova-accent block">
                with Intelligent Policy Management
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Automate renewals, identify coverage gaps, nurture quotes, and deliver exceptional service - all in one platform designed specifically for insurance agencies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-senova-primary to-senova-accent hover:from-orange-700 hover:to-amber-600 transition-all">
                See Insurance Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-6 py-3 border-2 border-senova-primary text-base font-medium rounded-lg text-senova-primary bg-white hover:bg-amber-50 transition-all">
                View Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['Carrier Integration', 'Renewal Automation', '14-Day Free Trial', 'Import Your Book'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-senova-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.insurance.family}
                alt="Insurance family protection"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.insurance.review}
                alt="Policy review consultation"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.insurance.business}
                alt="Business insurance planning"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Your Current Challenges
              </h2>
              <p className="text-xl text-gray-600">
                Growing an insurance agency shouldn't be this hard
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {painPoints.map((point, idx) => (
                <div key={idx} className="bg-red-50 rounded-xl p-6 border border-red-100">
                  <point.icon className="w-10 h-10 text-red-500 mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{point.title}</h3>
                  <p className="text-sm text-gray-600">{point.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Your Complete Insurance Solution
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to maximize retention and growth
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {solutions.map((solution, idx) => (
                <div key={idx} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{solution.title}</h3>
                  <p className="text-gray-600 mb-6">{solution.description}</p>
                  <ul className="space-y-3">
                    {solution.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-senova-primary mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-gradient-to-br from-senova-primary to-senova-accent text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Real Results from Real Agencies
              </h2>
              <p className="text-xl text-amber-100">
                Join hundreds of successful insurance agencies using Senova
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {results.map((result, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-5xl font-bold mb-2">{result.metric}</div>
                  <div className="text-lg font-semibold mb-1">{result.description}</div>
                  <div className="text-sm text-amber-200">{result.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Features Built for Insurance Agencies
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to grow your book of business
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Check className="w-5 h-5 text-senova-primary flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-senova-bg-tertiary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
              <Shield className="w-12 h-12 text-senova-primary mb-6" />
              <blockquote className="text-2xl text-gray-700 italic mb-6">
                "Senova increased our retention rate from 82% to 94% in just one year. The cross-sell intelligence has helped us grow policies per household by 2.8x."
              </blockquote>
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-bold text-gray-900">Robert Thompson</div>
                  <div className="text-gray-600">Agency Owner • Thompson Insurance Group</div>
                </div>
              </div>
              <div className="mt-4 text-senova-primary font-semibold">
                12% retention increase + 180% cross-sell growth
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Integrates with Your Insurance Systems
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Works seamlessly with popular agency management systems
            </p>
            <div className="flex flex-wrap gap-8 justify-center items-center">
              {['Applied Epic', 'EZLynx', 'HawkSoft', 'Vertafore', 'Agency Zoom'].map((tool) => (
                <div key={tool} className="text-lg font-semibold text-gray-700 px-6 py-3 bg-gray-100 rounded-lg">
                  {tool}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Grow Your Insurance Agency?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See why hundreds of agencies choose Senova CRM
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/demo" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-senova-primary to-senova-accent hover:from-orange-700 hover:to-amber-600 transition-all">
                Book Your Insurance Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-senova-primary text-lg font-medium rounded-lg text-senova-primary bg-white hover:bg-amber-50 transition-all">
                Talk to Sales
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              No credit card required • 14-day free trial • Import your book of business
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}