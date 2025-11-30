import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowRight, FileQuestion, Shield, Eye, Users, Calculator, FileCheck, Clock, DollarSign } from 'lucide-react';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'CRM for Mortgage Lenders | Loan Pipeline Management | Senova',
  description: 'Streamline your loan pipeline from application to close. Automated document collection, compliance tracking, and 38% faster closing. See demo.',
  openGraph: {
    title: 'CRM for Mortgage Lenders | Loan Pipeline Management',
    description: 'Streamline your loan pipeline from application to close. Automated document collection and compliance.',
    images: ['/images/mortgage-lending-crm.jpg'],
  },
};

const painPoints = [
  {
    title: 'Document Collection Chaos',
    description: 'Chasing borrowers for documents wastes 40% of loan officer time',
    icon: FileQuestion,
  },
  {
    title: 'Compliance Nightmares',
    description: 'Missing TRID deadlines, RESPA violations',
    icon: Shield,
  },
  {
    title: 'Pipeline Visibility Problems',
    description: 'Lack of real-time visibility causing bottlenecks',
    icon: Eye,
  },
  {
    title: 'Referral Partner Disconnect',
    description: 'Poor communication with real estate agents',
    icon: Users,
  },
];

const solutions = [
  {
    title: 'Automated Document Collection',
    description: 'Smart portals, automated reminders, instant verification',
    features: [
      'Borrower document portal',
      'Automated chase sequences',
      'OCR document reading',
      'Instant verification checks',
    ],
  },
  {
    title: 'Compliance Automation',
    description: 'Never miss a deadline with automated TRID tracking',
    features: [
      'TRID timeline tracking',
      'Automated disclosure delivery',
      'Built-in compliance rules',
      'Complete audit trails',
    ],
  },
  {
    title: 'Real-Time Pipeline Management',
    description: 'Complete visibility with visual pipelines and alerts',
    features: [
      'Visual loan pipeline',
      'Milestone automation',
      'Rate lock tracking',
      'Closing prediction AI',
    ],
  },
  {
    title: 'Partner Portal & Communication',
    description: 'Keep referral partners informed with automated updates',
    features: [
      'Realtor partner portal',
      'Automated status updates',
      'Co-marketing tools',
      'Referral tracking system',
    ],
  },
];

const results = [
  { metric: '38%', description: 'Faster closing', detail: 'From 42 to 26 days average' },
  { metric: '91%', description: 'First-time doc completion', detail: 'Reduced back-and-forth' },
  { metric: '100%', description: 'TRID compliance', detail: 'Zero violations' },
  { metric: '$218K', description: 'Additional loans/LO', detail: 'From improved efficiency' },
];

const features = [
  'Loan application portal',
  'Document management',
  'Compliance tracking',
  'Pipeline visualization',
  'Rate lock tracking',
  'Automated underwriting',
  'Partner portals',
  'Credit pull integration',
  'Income verification',
  'Closing coordination',
  'Commission tracking',
  'Reporting analytics',
];

export default function MortgageLendingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-red-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-6">
              <Calculator className="w-4 h-4" />
              <span className="text-sm font-semibold">Built for Mortgage Lenders</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your Loan Pipeline
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-senova-primary to-senova-hot block">
                From Application to Close
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Automate document collection, ensure compliance, manage your pipeline, and close loans 38% faster - all in one platform designed specifically for mortgage lenders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-senova-primary to-senova-hot hover:from-orange-700 hover:to-red-600 transition-all">
                See Mortgage Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-6 py-3 border-2 border-senova-primary text-base font-medium rounded-lg text-senova-primary bg-white hover:bg-orange-50 transition-all">
                View Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['TRID Compliant', 'Automated Docs', '14-Day Free Trial', 'LOS Integration'].map((item) => (
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
                src={images.industries.mortgageLending.signing}
                alt="Mortgage document signing"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.mortgageLending.advisor}
                alt="Mortgage advisor consultation"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.mortgageLending.planning}
                alt="Financial planning"
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
                Closing loans efficiently shouldn't be this hard
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
                Your Complete Lending Solution
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to close loans faster and compliant
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
      <section className="py-20 bg-gradient-to-br from-senova-primary to-senova-hot text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Real Results from Real Lenders
              </h2>
              <p className="text-xl text-orange-100">
                Join hundreds of successful mortgage lenders using Senova
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {results.map((result, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-5xl font-bold mb-2">{result.metric}</div>
                  <div className="text-lg font-semibold mb-1">{result.description}</div>
                  <div className="text-sm text-orange-200">{result.detail}</div>
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
                Features Built for Mortgage Lenders
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need in one compliant platform
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
              <DollarSign className="w-12 h-12 text-senova-primary mb-6" />
              <blockquote className="text-2xl text-gray-700 italic mb-6">
                "Senova cut our average closing time from 42 days to 26 days. The compliance automation has saved us from multiple potential violations."
              </blockquote>
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-bold text-gray-900">Jennifer Rodriguez</div>
                  <div className="text-gray-600">VP of Operations • First National Mortgage</div>
                </div>
              </div>
              <div className="mt-4 text-senova-primary font-semibold">
                38% reduction in closing time
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
              Integrates with Your Loan Origination Systems
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Works seamlessly with popular mortgage lending software
            </p>
            <div className="flex flex-wrap gap-8 justify-center items-center">
              {['Encompass', 'Blend', 'ICE Mortgage', 'Calyx', 'Floify'].map((tool) => (
                <div key={tool} className="text-lg font-semibold text-gray-700 px-6 py-3 bg-gray-100 rounded-lg">
                  {tool}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Close Loans Faster?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See why hundreds of lenders choose Senova CRM
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/demo" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-senova-primary to-senova-hot hover:from-orange-700 hover:to-red-600 transition-all">
                Book Your Mortgage Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-senova-primary text-lg font-medium rounded-lg text-senova-primary bg-white hover:bg-orange-50 transition-all">
                Talk to Sales
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              No credit card required • 14-day free trial • Import your pipeline
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}