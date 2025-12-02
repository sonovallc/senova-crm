import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, ArrowRight, Users, Calendar, BarChart3, Zap, Shield, Globe, Sparkles, Heart, TrendingUp } from 'lucide-react';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'CRM for Medical Spas | Patient Management & Marketing | Senova',
  description: 'Purpose-built CRM for medical spas. Track treatments, manage memberships, automate marketing, and grow revenue. HIPAA compliant. See demo.',
  openGraph: {
    title: 'CRM for Medical Spas | Patient Management & Marketing',
    description: 'Purpose-built CRM for medical spas. Track treatments, manage memberships, and automate marketing.',
    images: ['/images/medical-spa-crm.jpg'],
  },
};

const painPoints = [
  {
    title: 'Scattered Patient Records',
    description: 'Patient history across multiple systems, paper files, and spreadsheets',
    icon: Users,
  },
  {
    title: 'Missed Revenue Opportunities',
    description: 'No automated recall for treatments, memberships expiring unnoticed',
    icon: TrendingUp,
  },
  {
    title: 'Ineffective Marketing',
    description: 'Generic email blasts with low engagement, no personalization',
    icon: BarChart3,
  },
  {
    title: 'Compliance Concerns',
    description: 'Worried about HIPAA violations with current tools',
    icon: Shield,
  },
];

const solutions = [
  {
    title: 'Complete Treatment History',
    description: 'Track every injection, laser session, and product purchase in one place',
    features: [
      'Before/after photo galleries',
      'Treatment notes and protocols',
      'Product inventory tracking',
      'Consent form management',
    ],
  },
  {
    title: 'Automated Revenue Growth',
    description: 'Never miss a revenue opportunity with smart automation',
    features: [
      'Botox/filler recall reminders',
      'Membership renewal alerts',
      'Package usage tracking',
      'Birthday & VIP campaigns',
    ],
  },
  {
    title: 'Targeted Patient Marketing',
    description: 'Send the right message to the right patients automatically',
    features: [
      'Segment by treatment history',
      'Personalized email & SMS',
      'Special event invitations',
      'Referral program automation',
    ],
  },
  {
    title: 'HIPAA-Compliant Platform',
    description: 'Built specifically for medical aesthetics compliance',
    features: [
      'Encrypted patient data',
      'HIPAA compliance support',
      'Audit trails',
      'Secure photo storage',
    ],
  },
];

const results = [
  { metric: 'Growth', description: 'Revenue increase', detail: 'From automated recalls and campaigns' },
  { metric: 'Better', description: 'Retention rate', detail: 'Patients stay engaged longer' },
  { metric: 'More', description: 'Treatment bookings', detail: 'From targeted marketing' },
  { metric: 'Faster', description: 'Daily workflows', detail: 'Streamlined administrative tasks' },
];

const features = [
  'Treatment tracking with photos',
  'Membership & package management',
  'Automated appointment reminders',
  'Two-way SMS messaging',
  'Online booking integration',
  'Inventory management',
  'Staff commission tracking',
  'Custom intake forms',
  'Email & SMS campaigns',
  'Loyalty program',
  'Review management',
  'Analytics dashboard',
];

export default function MedicalSpasPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
        <div className="absolute inset-0 z-0">
          <Image
            src={images.industries.medicalSpas.hero}
            alt="Medical spa treatment room"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Built for Medical Spas</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              The CRM That Grows Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 block">
                Medical Spa Revenue
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Track treatments, manage memberships, automate patient marketing, and stay HIPAA compliant - all in one platform designed specifically for medical spas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all">
                Schedule a Consultation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-6 py-3 border-2 border-orange-600 text-base font-medium rounded-lg text-orange-600 bg-white hover:bg-orange-50 transition-all">
                View Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['HIPAA Compliant', 'No Setup Fees', 'Professional Support', 'Import Existing Patients'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{item}</span>
                </div>
              ))}
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
                Running a successful medical spa shouldn't be this hard
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
                Your Complete Med Spa Solution
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to manage and grow your medical spa
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
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
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

      {/* Image Gallery Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                State-of-the-Art Medical Spa Experience
              </h2>
              <p className="text-xl text-gray-600">
                Modern facilities, premium treatments, exceptional results
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.medicalSpas.treatment}
                  alt="Medical spa treatment in progress"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.medicalSpas.reception}
                  alt="Medical spa reception area"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.medicalSpas.consultation}
                  alt="Medical spa consultation room"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Real Results from Real Med Spas
              </h2>
              <p className="text-xl text-orange-100">
                See the results Senova can deliver for your medical spa
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
                Features Built for Medical Spas
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need in one HIPAA-compliant platform
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Check className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TODO: Add real testimonial when available */}

      {/* Integration Section - Removed until integrations are built */}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Grow Your Medical Spa?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Discover how Senova CRM can transform your med spa operations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-orange-600 text-lg font-medium rounded-lg text-orange-600 bg-white hover:bg-orange-50 transition-all">
                Talk to Sales
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              No credit card required • Professional consultation • Import your existing patients
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}