import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, Users, Fingerprint, Shield, Zap, Database, Lock, AlertCircle, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Patient Identification Technology | Identity Matching | Senova',
  description: 'Advanced patient identification system that matches records across systems, prevents duplicates, and ensures data accuracy. 99.8% match accuracy. See demo.',
  openGraph: {
    title: 'Patient Identification Technology | Identity Matching',
    description: 'Advanced patient identification system with 99.8% match accuracy. Prevent duplicates and ensure data integrity.',
    images: ['/images/patient-identification.jpg'],
  },
};

const howItWorks = [
  {
    step: '1',
    title: 'Data Ingestion',
    description: 'System collects patient data from all sources',
    details: ['Multiple data formats', 'Real-time processing', 'Batch imports supported'],
  },
  {
    step: '2',
    title: 'Smart Matching',
    description: 'AI algorithms analyze and match patient records',
    details: ['Fuzzy name matching', 'Address normalization', 'Phone/email verification'],
  },
  {
    step: '3',
    title: 'Identity Resolution',
    description: 'Creates unified patient profile across systems',
    details: ['Duplicate detection', 'Record merging', 'Master record creation'],
  },
  {
    step: '4',
    title: 'Continuous Monitoring',
    description: 'Maintains data quality over time',
    details: ['Real-time updates', 'Quality scoring', 'Alert notifications'],
  },
];

const features = [
  {
    icon: Fingerprint,
    title: 'Biometric Matching',
    description: 'Optional fingerprint and facial recognition for highest accuracy',
  },
  {
    icon: Database,
    title: 'Multi-Source Integration',
    description: 'Connect EMR, PMS, billing, and marketing systems seamlessly',
  },
  {
    icon: Shield,
    title: 'HIPAA Compliant',
    description: 'Full compliance with healthcare privacy regulations',
  },
  {
    icon: Zap,
    title: 'Real-Time Processing',
    description: 'Instant patient identification at point of care',
  },
];

const benefits = [
  { metric: '99.8%', label: 'Match Accuracy', description: 'Industry-leading identification precision' },
  { metric: '73%', label: 'Fewer Duplicates', description: 'Reduction in duplicate patient records' },
  { metric: '45 min', label: 'Daily Time Saved', description: 'On patient record management' },
  { metric: '$1.2M', label: 'Average Savings', description: 'From prevented medical errors' },
];

const useCases = [
  {
    title: 'Multi-Location Practices',
    description: 'Identify patients across all locations instantly',
    benefits: ['Unified patient view', 'Consistent care delivery', 'Centralized records'],
  },
  {
    title: 'Practice Mergers',
    description: 'Consolidate patient databases without duplicates',
    benefits: ['Clean data migration', 'Record deduplication', 'Historical preservation'],
  },
  {
    title: 'Referral Networks',
    description: 'Share patient identity across provider network',
    benefits: ['Seamless referrals', 'Care coordination', 'Reduced admin burden'],
  },
  {
    title: 'Marketing Campaigns',
    description: 'Ensure accurate patient targeting and avoid duplicates',
    benefits: ['Clean contact lists', 'Better segmentation', 'Higher ROI'],
  },
];

const comparisonData = [
  { feature: 'Matching accuracy', traditional: '85-90%', senova: '99.8%' },
  { feature: 'Processing speed', traditional: 'Hours/days', senova: 'Real-time' },
  { feature: 'Duplicate prevention', traditional: 'Manual review', senova: 'Automated' },
  { feature: 'System integration', traditional: 'Limited', senova: 'Unlimited' },
  { feature: 'Biometric support', traditional: 'Not available', senova: 'Fully integrated' },
];

export default function PatientIdentificationPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-cyan-50 via-white to-blue-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full mb-6">
              <Fingerprint className="w-4 h-4" />
              <span className="text-sm font-semibold">Advanced Patient Matching</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Never Lose Track of a Patient with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 block">
                99.8% Accurate Identification
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Advanced AI-powered patient identification that eliminates duplicates, ensures data accuracy, and creates a single source of truth across all your systems.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 transition-all">
                See Live Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border-2 border-cyan-600 text-base font-medium rounded-lg text-cyan-600 bg-white hover:bg-cyan-50 transition-all">
                Talk to Expert
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  The Hidden Cost of Patient Misidentification
                </h2>
                <ul className="space-y-4">
                  {[
                    'Average practice has 18% duplicate patient records',
                    'Medical errors from wrong patient data cost millions',
                    'Staff waste hours daily reconciling patient records',
                    'Marketing campaigns fail due to duplicate contacts',
                    'Patient satisfaction drops from repeated data requests',
                  ].map((problem, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{problem}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-red-600 mb-2">$6.5B</div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    Annual Cost to Healthcare
                  </div>
                  <p className="text-gray-600">
                    Patient misidentification costs the U.S. healthcare system billions annually in medical errors, denied claims, and administrative burden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                How Patient Identification Works
              </h2>
              <p className="text-xl text-gray-600">
                Four-step process to ensure accurate patient matching
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {howItWorks.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="text-3xl font-bold text-cyan-600 mb-3">{step.step}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, dIdx) => (
                        <li key={dIdx} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {idx < howItWorks.length - 1 && (
                    <ArrowRight className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-cyan-400 w-6 h-6 z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Enterprise-Grade Features
              </h2>
              <p className="text-xl text-gray-600">
                Advanced technology for accurate patient identification
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, idx) => (
                <div key={idx} className="text-center">
                  <div className="bg-cyan-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-cyan-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits/ROI */}
      <section className="py-20 bg-gradient-to-br from-cyan-600 to-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Measurable ROI from Day One
              </h2>
              <p className="text-xl text-cyan-100">
                See immediate improvements in data quality and operational efficiency
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-5xl font-bold mb-2">{benefit.metric}</div>
                  <div className="text-lg font-semibold mb-1">{benefit.label}</div>
                  <div className="text-sm text-cyan-200">{benefit.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Perfect for Every Healthcare Scenario
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {useCases.map((useCase, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                  <p className="text-gray-600 mb-6">{useCase.description}</p>
                  <ul className="space-y-2">
                    {useCase.benefits.map((benefit, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                vs. Traditional Methods
              </h2>
              <p className="text-xl text-gray-600">
                See why leading practices choose Senova
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg shadow-lg">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-500">Traditional Methods</th>
                    <th className="text-center py-4 px-6 font-semibold text-cyan-600">Senova Patient ID</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                      <td className="py-4 px-6 text-center text-gray-500">{row.traditional}</td>
                      <td className="py-4 px-6 text-center text-cyan-600 font-semibold">{row.senova}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-blue-50 rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Lock className="w-12 h-12 text-blue-600 mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Bank-Level Security & Compliance
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your patient data is protected by the highest security standards
                  </p>
                  <ul className="space-y-3">
                    {[
                      'HIPAA compliant with BAA',
                      '256-bit AES encryption',
                      'SOC 2 Type II certified',
                      'GDPR compliant',
                      'Regular security audits',
                      '99.99% uptime SLA',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Data Protection Guarantee</h3>
                  </div>
                  <p className="text-gray-600">
                    We guarantee the security and privacy of your patient data. Our platform exceeds all healthcare compliance requirements and undergoes continuous security monitoring.
                  </p>
                  <Link href="/security" className="inline-flex items-center text-blue-600 hover:underline mt-4">
                    Learn about our security
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-cyan-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
              <TrendingUp className="w-12 h-12 text-cyan-500 mb-6" />
              <blockquote className="text-2xl text-gray-700 italic mb-6">
                "Patient identification was our biggest operational challenge. Senova eliminated 73% of our duplicate records in the first month and saved our staff 45 minutes daily. The ROI was immediate and substantial."
              </blockquote>
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-bold text-gray-900">Dr. James Wilson</div>
                  <div className="text-gray-600">Chief Medical Officer • MedGroup Partners</div>
                </div>
              </div>
              <div className="mt-4 text-cyan-600 font-semibold">
                73% reduction in duplicates | $1.2M saved annually
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-cyan-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Start Identifying Patients Accurately Today
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See how Senova can eliminate duplicates and ensure data accuracy
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/demo" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 transition-all">
                Schedule Live Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-cyan-600 text-lg font-medium rounded-lg text-cyan-600 bg-white hover:bg-cyan-50 transition-all">
                Get ROI Assessment
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              Implementation in 30 days • Full training included • 24/7 support
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}