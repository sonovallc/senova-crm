import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, ArrowRight, Users, Calendar, Shield, FileText, Heart, Activity, Microscope, Clock } from 'lucide-react';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'CRM for Dermatology Practices | Patient Management Software | Senova',
  description: 'HIPAA-compliant CRM built for dermatology. Manage medical and cosmetic patients, track treatments, automate recalls, and grow your practice.',
  openGraph: {
    title: 'CRM for Dermatology Practices | Patient Management Software',
    description: 'HIPAA-compliant CRM built for dermatology practices. Manage patients, track treatments, automate recalls.',
    images: ['/images/dermatology-crm.jpg'],
  },
};

const painPoints = [
  {
    title: 'Mixed Patient Types',
    description: 'Medical and cosmetic patients require different workflows and compliance',
    icon: Users,
  },
  {
    title: 'Complex Scheduling',
    description: 'Managing procedures, follow-ups, and cosmetic treatments across providers',
    icon: Calendar,
  },
  {
    title: 'Compliance Burden',
    description: 'HIPAA requirements for medical records, insurance documentation',
    icon: Shield,
  },
  {
    title: 'Fragmented Systems',
    description: 'EMR for medical, separate tools for cosmetics, marketing disconnected',
    icon: FileText,
  },
];

const solutions = [
  {
    title: 'Unified Patient Management',
    description: 'One system for both medical and cosmetic sides of your practice',
    features: [
      'Separate medical and cosmetic records',
      'Insurance and self-pay tracking',
      'Procedure and diagnosis coding',
      'Photo documentation system',
    ],
  },
  {
    title: 'Smart Appointment System',
    description: 'Optimize scheduling for maximum efficiency and revenue',
    features: [
      'Provider schedule management',
      'Automated appointment reminders',
      'Skin check recall system',
      'Cosmetic treatment scheduling',
    ],
  },
  {
    title: 'Complete Treatment Tracking',
    description: 'Document every procedure, prescription, and cosmetic service',
    features: [
      'Lesion mapping and tracking',
      'Before/after galleries',
      'Treatment plan management',
      'Prescription history',
    ],
  },
  {
    title: 'Automated Growth Tools',
    description: 'Build your practice with intelligent marketing automation',
    features: [
      'Annual skin check reminders',
      'Cosmetic service campaigns',
      'Patient education emails',
      'Referral program automation',
    ],
  },
];

const results = [
  { metric: 'Increased', description: 'Practice growth', detail: 'Measurable results in first year' },
  { metric: 'More', description: 'Skin checks scheduled', detail: 'From automated recalls' },
  { metric: 'Higher', description: 'Cosmetic revenue', detail: 'Through targeted marketing' },
  { metric: 'Significant', description: 'Time saved', detail: 'On administrative tasks' },
];

const features = [
  'HIPAA-compliant platform',
  'Medical record management',
  'Cosmetic treatment tracking',
  'Insurance verification',
  'Photo documentation',
  'Lesion tracking',
  'E-prescribing integration',
  'Lab results management',
  'Automated recalls',
  'Patient portal',
  'Telehealth integration',
  'Multi-location support',
];

{/* Removed: competitor comparison data */}

export default function DermatologyPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-20 md:py-32">
        <div className="absolute inset-0 z-0">
          <Image
            src={images.industries.dermatology.hero}
            alt="Modern dermatology clinic"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
              <Microscope className="w-4 h-4" />
              <span className="text-sm font-semibold">Designed for Dermatology</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              The Complete CRM for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600 block">
                Modern Dermatology Practices
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Manage medical and cosmetic patients, automate recalls, track treatments, and grow your practice - all while staying HIPAA compliant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 transition-all">
                Schedule a Consultation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-6 py-3 border-2 border-blue-600 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-all">
                View Pricing Plans
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['HIPAA Compliant', 'EMR Integration', 'Expert Support', 'No Setup Fees'].map((item) => (
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
                Challenges Dermatologists Face Daily
              </h2>
              <p className="text-xl text-gray-600">
                Generic CRMs don't understand the unique needs of dermatology
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {painPoints.map((point, idx) => (
                <div key={idx} className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                  <point.icon className="w-10 h-10 text-orange-500 mb-3" />
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
                Purpose-Built for Dermatology Success
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to run an efficient, profitable practice
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

      {/* Workflow Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Streamlined Workflows for Every Patient Type
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-8 h-8 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Medical Patients</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    'Insurance verification and billing',
                    'Diagnosis and procedure coding',
                    'Lab integration and results tracking',
                    'E-prescribing capabilities',
                    'Annual skin check reminders',
                    'Referral management',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-8 h-8 text-teal-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Cosmetic Patients</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    'Treatment tracking with photos',
                    'Package and membership management',
                    'Automated marketing campaigns',
                    'Product recommendations',
                    'Loyalty program tracking',
                    'Special offer automation',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
                Advanced Dermatology Practice Facilities
              </h2>
              <p className="text-xl text-gray-600">
                State-of-the-art equipment, modern clinic design, patient-centered care
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.dermatology.clinic}
                  alt="Dermatology clinic interior"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.dermatology.equipment}
                  alt="Advanced dermatology equipment"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.dermatology.consultation}
                  alt="Dermatology consultation room"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-teal-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Proven Results for Dermatology Practices
              </h2>
              <p className="text-xl text-blue-100">
                Discover how Senova can transform your dermatology practice
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {results.map((result, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-5xl font-bold mb-2">{result.metric}</div>
                  <div className="text-lg font-semibold mb-1">{result.description}</div>
                  <div className="text-sm text-blue-200">{result.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Removed: competitor comparison table */}

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Complete Feature Set for Dermatology
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transform Your Dermatology Practice
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See how Senova can help you deliver better patient care while growing your practice
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 transition-all">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-blue-600 text-lg font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-all">
                Talk to Specialist
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              HIPAA compliant • EMR integration • Professional consultation • White-glove onboarding
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}