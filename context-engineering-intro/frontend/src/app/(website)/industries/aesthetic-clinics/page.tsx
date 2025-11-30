import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, ArrowRight, Sparkles, TrendingUp, Users, Calendar, DollarSign, Package, Heart, Star } from 'lucide-react';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'CRM for Aesthetic Clinics | Client Management Software | Senova',
  description: 'All-in-one CRM for aesthetic clinics. Manage clients, track treatments, automate marketing, handle memberships. Grow revenue by 45%. See demo.',
  openGraph: {
    title: 'CRM for Aesthetic Clinics | Client Management Software',
    description: 'All-in-one CRM for aesthetic clinics. Manage clients, track treatments, and grow revenue by 45%.',
    images: ['/images/aesthetic-clinic-crm.jpg'],
  },
};

const painPoints = [
  {
    title: 'Client Retention Issues',
    description: 'Clients disappear after initial treatments, no systematic follow-up',
    icon: Users,
  },
  {
    title: 'Membership Management',
    description: 'Tracking memberships, packages, and prepaid services manually',
    icon: Package,
  },
  {
    title: 'Scattered Information',
    description: 'Client records across booking system, POS, and spreadsheets',
    icon: Calendar,
  },
  {
    title: 'Marketing Inefficiency',
    description: 'Generic campaigns with poor ROI, no treatment-based targeting',
    icon: DollarSign,
  },
];

const solutions = [
  {
    title: 'Complete Client Profiles',
    description: 'Everything about your client in one unified dashboard',
    features: [
      'Full treatment history',
      'Product purchases tracking',
      'Allergy and preference notes',
      'Photo progress galleries',
    ],
  },
  {
    title: 'Smart Membership Management',
    description: 'Automate your membership and package programs',
    features: [
      'Membership usage tracking',
      'Auto-renewal reminders',
      'Package balance alerts',
      'VIP tier management',
    ],
  },
  {
    title: 'Automated Client Retention',
    description: 'Never let a client slip through the cracks',
    features: [
      'Treatment recall automation',
      'Birthday specials',
      'Re-engagement campaigns',
      'Loyalty point tracking',
    ],
  },
  {
    title: 'Revenue Optimization',
    description: 'Maximize every client relationship',
    features: [
      'Service recommendations',
      'Upsell opportunities',
      'Package suggestions',
      'Referral tracking',
    ],
  },
];

const treatments = [
  'Injectables & Fillers',
  'Laser Treatments',
  'Chemical Peels',
  'Microneedling',
  'Body Contouring',
  'Skin Tightening',
  'IPL Photofacials',
  'Dermaplaning',
  'HydraFacials',
  'PDO Threads',
  'PRP Treatments',
  'IV Therapy',
];

const results = [
  { metric: '45%', description: 'Revenue increase', detail: 'Average in year one' },
  { metric: '70%', description: 'Better retention', detail: 'Clients stay active longer' },
  { metric: '3X', description: 'More bookings', detail: 'From automated campaigns' },
  { metric: '85%', description: 'Membership renewals', detail: 'With auto-reminders' },
];

const features = [
  'Treatment tracking',
  'Before/after photos',
  'Membership management',
  'Package tracking',
  'Appointment reminders',
  'Two-way SMS',
  'Email campaigns',
  'Loyalty programs',
  'Inventory tracking',
  'Staff commissions',
  'Online booking sync',
  'Payment processing',
  'Custom forms',
  'Client portal',
  'Review automation',
  'Analytics dashboard',
];

export default function AestheticClinicsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-violet-50 via-white to-rose-50 py-20 md:py-32">
        <div className="absolute inset-0 z-0">
          <Image
            src={images.industries.aestheticClinics.hero}
            alt="Aesthetic clinic treatment room"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Designed for Aesthetic Clinics</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              The CRM That Grows Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-rose-600 block">
                Aesthetic Clinic by 45%
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Manage clients, track treatments, automate retention marketing, and handle memberships - all in one platform built specifically for aesthetic clinics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-700 hover:to-rose-700 transition-all">
                See Aesthetic Clinic Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-6 py-3 border-2 border-violet-600 text-base font-medium rounded-lg text-violet-600 bg-white hover:bg-violet-50 transition-all">
                View Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['No Setup Fees', '14-Day Free Trial', 'Import Existing Clients', 'Full Training Included'].map((item) => (
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
                Stop Losing Revenue to These Common Problems
              </h2>
              <p className="text-xl text-gray-600">
                Most aesthetic clinics struggle with the same challenges
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
                Your Complete Aesthetic Clinic Solution
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to run a profitable, efficient clinic
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

      {/* Client Journey */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Automate the Entire Client Journey
            </h2>
            <div className="relative">
              <div className="grid md:grid-cols-5 gap-6">
                {[
                  { stage: 'Attract', icon: Star, desc: 'Capture leads from all channels' },
                  { stage: 'Convert', icon: Users, desc: 'Turn inquiries into bookings' },
                  { stage: 'Deliver', icon: Sparkles, desc: 'Track every treatment detail' },
                  { stage: 'Retain', icon: Heart, desc: 'Automated recalls & campaigns' },
                  { stage: 'Grow', icon: TrendingUp, desc: 'Referrals & reviews' },
                ].map((step, idx) => (
                  <div key={idx} className="text-center">
                    <div className="bg-gradient-to-br from-violet-100 to-rose-100 rounded-full p-3 w-14 h-14 mx-auto mb-3">
                      <step.icon className="w-8 h-8 text-violet-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{step.stage}</h3>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                  </div>
                ))}
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
                Premium Aesthetic Clinic Experience
              </h2>
              <p className="text-xl text-gray-600">
                Luxurious environment, advanced treatments, personalized care
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.aestheticClinics.treatment}
                  alt="Aesthetic treatment in progress"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.aestheticClinics.consultation}
                  alt="Aesthetic consultation"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={images.industries.aestheticClinics.equipment}
                  alt="Advanced aesthetic equipment"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-rose-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Real Results from Real Clinics
              </h2>
              <p className="text-xl text-violet-100">
                Join hundreds of successful aesthetic clinics
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {results.map((result, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-5xl font-bold mb-2">{result.metric}</div>
                  <div className="text-lg font-semibold mb-1">{result.description}</div>
                  <div className="text-sm text-violet-200">{result.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Treatments Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Track Every Treatment Type
              </h2>
              <p className="text-xl text-gray-600">
                Comprehensive support for all aesthetic services
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {treatments.map((treatment, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg">
                  <Check className="w-4 h-4 text-violet-600 flex-shrink-0" />
                  <span className="text-gray-700">{treatment}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Membership Focus */}
      <section className="py-20 bg-violet-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Package className="w-12 h-12 text-violet-600 mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Master Membership & Package Management
                </h2>
                <p className="text-gray-600 mb-6">
                  Turn one-time clients into recurring revenue with smart membership tools
                </p>
                <ul className="space-y-3">
                  {[
                    'Unlimited membership tiers',
                    'Usage tracking & balance alerts',
                    'Auto-renewal processing',
                    'Member-only pricing',
                    'Exclusive perks management',
                    'Detailed membership analytics',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-xl">
                <div className="text-4xl font-bold text-violet-600 mb-2">85%</div>
                <div className="text-xl font-semibold text-gray-900 mb-4">
                  Average membership renewal rate
                </div>
                <p className="text-gray-600">
                  "Our membership program went from 50 to 500+ members in 6 months. The automated reminders and usage tracking made it effortless to scale."
                </p>
                <div className="mt-4">
                  <div className="font-bold text-gray-900">Emma Thompson</div>
                  <div className="text-sm text-gray-600">Radiance Aesthetic Clinic • Chicago</div>
                </div>
              </div>
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
                All-In-One Platform Features
              </h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Check className="w-5 h-5 text-violet-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-violet-50 to-rose-50 rounded-2xl p-8 md:p-12 shadow-xl">
              <Heart className="w-12 h-12 text-rose-500 mb-6" />
              <blockquote className="text-2xl text-gray-700 italic mb-6">
                "Senova completely transformed our clinic operations. The automated recalls bring clients back consistently, membership management is seamless, and our revenue has grown 45% in just 8 months. It's the best investment we've made."
              </blockquote>
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-bold text-gray-900">Dr. Lisa Park</div>
                  <div className="text-gray-600">Bloom Aesthetic Clinic • San Francisco, CA</div>
                </div>
              </div>
              <div className="mt-4 text-violet-600 font-semibold">
                45% revenue growth | 500+ active members | 70% retention rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Works With Your Existing Tools
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Seamless integration with popular aesthetic clinic software
            </p>
            <div className="flex flex-wrap gap-8 justify-center items-center">
              {['Aesthetic Record', 'Vagaro', 'Boulevard', 'Zenoti', 'MindBody'].map((tool) => (
                <div key={tool} className="text-lg font-semibold text-gray-700 px-6 py-3 bg-white rounded-lg shadow-md">
                  {tool}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-violet-50 to-rose-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Grow Your Aesthetic Clinic?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join hundreds of successful clinics using Senova CRM
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/demo" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-700 hover:to-rose-700 transition-all">
                Book Your Clinic Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-violet-600 text-lg font-medium rounded-lg text-violet-600 bg-white hover:bg-violet-50 transition-all">
                Talk to Sales
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              No credit card required • 14-day free trial • Import your client list • Full onboarding support
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}