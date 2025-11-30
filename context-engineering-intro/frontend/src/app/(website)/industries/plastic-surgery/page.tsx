import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, ArrowRight, Users, Camera, Shield, TrendingUp, Star, Award, Heart, Clock } from 'lucide-react';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'CRM for Plastic Surgery Practices | Patient Management | Senova',
  description: 'HIPAA-compliant CRM designed for plastic surgeons. Manage consultations, track procedures, store before/after photos, and increase conversions by 50%.',
  openGraph: {
    title: 'CRM for Plastic Surgery Practices | Patient Management',
    description: 'HIPAA-compliant CRM designed for plastic surgeons. Manage consultations, track procedures, and grow your practice.',
    images: ['/images/plastic-surgery-crm.jpg'],
  },
};

const painPoints = [
  {
    title: 'Long Sales Cycles',
    description: 'Patients take months to decide, requiring persistent nurturing',
    icon: Clock,
  },
  {
    title: 'Photo Management Chaos',
    description: 'Thousands of before/after photos scattered across systems',
    icon: Camera,
  },
  {
    title: 'Complex Consultations',
    description: 'Multi-procedure quotes, financing options, lengthy follow-ups',
    icon: Users,
  },
  {
    title: 'HIPAA Compliance Risk',
    description: 'Sensitive patient photos and data require strict security',
    icon: Shield,
  },
];

const solutions = [
  {
    title: 'Consultation to Surgery Pipeline',
    description: 'Convert more consultations into procedures with smart follow-up',
    features: [
      'Consultation tracking and notes',
      'Multi-procedure quote management',
      'Financing integration',
      'Automated nurture campaigns',
    ],
  },
  {
    title: 'Secure Photo Management',
    description: 'HIPAA-compliant storage for all patient images',
    features: [
      'Before/after photo galleries',
      'Encrypted cloud storage',
      'Photo consent management',
      'Gallery sharing with patients',
    ],
  },
  {
    title: 'Complete Procedure Tracking',
    description: 'Document every detail from consultation to recovery',
    features: [
      'Surgical planning notes',
      'Pre/post-op instructions',
      'Recovery timeline tracking',
      'Complication documentation',
    ],
  },
  {
    title: 'Intelligent Marketing Automation',
    description: 'Build your practice with targeted patient outreach',
    features: [
      'Procedure-specific campaigns',
      'Virtual consultation booking',
      'Review request automation',
      'Referral program management',
    ],
  },
];

const results = [
  { metric: '50%', description: 'Higher conversion rate', detail: 'From consultation to surgery' },
  { metric: '3X', description: 'More referrals', detail: 'Through automated programs' },
  { metric: '40%', description: 'Revenue growth', detail: 'Average in first year' },
  { metric: '5 hours', description: 'Weekly time saved', detail: 'On admin tasks' },
];

const procedures = [
  'Breast Augmentation',
  'Rhinoplasty',
  'Facelift',
  'Liposuction',
  'Tummy Tuck',
  'Brazilian Butt Lift',
  'Mommy Makeover',
  'Eyelid Surgery',
  'Breast Lift',
  'Arm Lift',
  'Thigh Lift',
  'Non-Surgical Procedures',
];

const features = [
  'HIPAA-compliant platform',
  'Before/after photo management',
  'Consultation management',
  'Quote and pricing tools',
  'Financing integration',
  'Virtual consultation support',
  'Surgical calendar',
  'Recovery tracking',
  'Patient portal',
  'Automated marketing',
  'Review management',
  'Multi-surgeon support',
];

export default function PlasticSurgeryPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-rose-50 via-white to-amber-50 py-20 md:py-32">
        <div className="absolute inset-0 z-0">
          <Image
            src={images.industries.plasticSurgery.hero}
            alt="Plastic surgery consultation room"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-full mb-6">
              <Award className="w-4 h-4" />
              <span className="text-sm font-semibold">Built for Plastic Surgeons</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              The CRM That Helps You Convert
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600 block">
                50% More Consultations
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Manage consultations, track procedures, store photos securely, and nurture patients through their journey - all HIPAA compliant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 transition-all">
                See Plastic Surgery Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-6 py-3 border-2 border-rose-600 text-base font-medium rounded-lg text-rose-600 bg-white hover:bg-rose-50 transition-all">
                View Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['HIPAA Compliant', 'Secure Photo Storage', 'Free Trial', 'White-Glove Setup'].map((item) => (
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
                Challenges Every Plastic Surgeon Faces
              </h2>
              <p className="text-xl text-gray-600">
                Generic CRMs weren't built for the unique needs of plastic surgery
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
                Built for Plastic Surgery Success
              </h2>
              <p className="text-xl text-gray-600">
                Every feature designed to grow your practice
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

      {/* Patient Journey Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Support Every Step of the Patient Journey
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { phase: 'Discovery', icon: Star, items: ['Online booking', 'Virtual consults', 'Lead capture'] },
                { phase: 'Consultation', icon: Users, items: ['3D imaging notes', 'Quote builder', 'Financing options'] },
                { phase: 'Decision', icon: Heart, items: ['Nurture emails', 'Follow-up automation', 'Patient education'] },
                { phase: 'Recovery', icon: Award, items: ['Post-op tracking', 'Photo timeline', 'Review requests'] },
              ].map((step, idx) => (
                <div key={idx} className="text-center">
                  <div className="bg-rose-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-rose-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.phase}</h3>
                  <ul className="space-y-2">
                    {step.items.map((item, iIdx) => (
                      <li key={iIdx} className="text-sm text-gray-600">{item}</li>
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
                World-Class Plastic Surgery Practice
              </h2>
              <p className="text-xl text-gray-600">
                Expert surgical team, cutting-edge facilities, exceptional patient care
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.plasticSurgery.team}
                  alt="Expert surgical team"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.plasticSurgery.facility}
                  alt="Modern surgical facility"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.plasticSurgery.consultation}
                  alt="Patient consultation"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-gradient-to-br from-rose-600 to-amber-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Results That Transform Practices
              </h2>
              <p className="text-xl text-rose-100">
                Join leading plastic surgeons using Senova
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {results.map((result, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-5xl font-bold mb-2">{result.metric}</div>
                  <div className="text-lg font-semibold mb-1">{result.description}</div>
                  <div className="text-sm text-rose-200">{result.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Procedures Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Track All Procedure Types
              </h2>
              <p className="text-xl text-gray-600">
                Comprehensive support for every procedure you perform
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {procedures.map((procedure, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Check className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span className="text-gray-700">{procedure}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything You Need, Nothing You Don't
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Check className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Photo Management Section */}
      <section className="py-20 bg-rose-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Camera className="w-12 h-12 text-rose-600 mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Secure Before & After Photo Management
                </h2>
                <p className="text-gray-600 mb-6">
                  Store, organize, and share patient photos with complete HIPAA compliance
                </p>
                <ul className="space-y-3">
                  {[
                    'Encrypted cloud storage',
                    'Automatic photo organization',
                    'Consent tracking',
                    'Watermarking capabilities',
                    'Patient portal sharing',
                    'Marketing gallery creation',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-xl">
                <blockquote className="text-xl text-gray-700 italic mb-4">
                  "The photo management alone is worth the investment. We went from chaos to complete organization, and our consultation conversion rate increased by 45% when we could easily show relevant before/after photos."
                </blockquote>
                <div>
                  <div className="font-bold text-gray-900">Dr. Jennifer Martinez</div>
                  <div className="text-gray-600">Beverly Hills Plastic Surgery</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-8 md:p-12 shadow-xl">
              <TrendingUp className="w-12 h-12 text-rose-500 mb-6" />
              <blockquote className="text-2xl text-gray-700 italic mb-6">
                "Senova transformed our practice. The consultation tracking and automated follow-ups increased our conversion rate by 50%. The secure photo management gives us peace of mind, and the marketing automation brings in 3x more referrals."
              </blockquote>
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-bold text-gray-900">Dr. Robert Chen</div>
                  <div className="text-gray-600">Chen Plastic Surgery Center • New York, NY</div>
                </div>
              </div>
              <div className="mt-4 text-rose-600 font-semibold">
                50% increase in consultation conversions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See why leading plastic surgeons choose Senova CRM
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/demo" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 transition-all">
                Book Your Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-rose-600 text-lg font-medium rounded-lg text-rose-600 bg-white hover:bg-rose-50 transition-all">
                Talk to Sales
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              HIPAA compliant • Secure photo storage • 14-day free trial • Full training included
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}