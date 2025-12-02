import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowRight, Timer, UserMinus, Home, FileX, TrendingUp, MapPin, Key, Building } from 'lucide-react';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'CRM for Real Estate Agents | Lead Management & Automation | Senova',
  description: 'Close more deals with intelligent lead management. Instant response, automated nurture campaigns, property matching, and more deals closed. See demo.',
  openGraph: {
    title: 'CRM for Real Estate Agents | Lead Management & Automation',
    description: 'Close more deals with intelligent lead management. Instant response and automated nurture campaigns.',
    images: ['/images/real-estate-crm.jpg'],
  },
};

const painPoints = [
  {
    title: 'Lead Response Chaos',
    description: 'Slow response times costing agents deals - most buyers work with first agent who responds',
    icon: Timer,
  },
  {
    title: 'Follow-Up Failure',
    description: 'Manual follow-up systems causing significant deal loss',
    icon: UserMinus,
  },
  {
    title: 'Property Matching Mess',
    description: 'Hours wasted manually matching buyers to properties',
    icon: Home,
  },
  {
    title: 'Transaction Tracking Trouble',
    description: 'Juggling multiple deals, missing critical deadlines',
    icon: FileX,
  },
];

const solutions = [
  {
    title: 'Fast Lead Response',
    description: 'Quick lead response tools to help you be first',
    features: [
      'Lead notification alerts',
      'Quick response templates',
      'Lead routing options',
      'Mobile notifications',
    ],
  },
  {
    title: 'Automated Nurture Campaigns',
    description: 'Never lose another lead with automated drip campaigns',
    features: [
      'Email drip campaigns',
      'Personalized follow-ups',
      'Scheduled outreach',
      'Birthday/anniversary reminders',
    ],
  },
  {
    title: 'Lead Organization',
    description: 'Keep your leads organized and prioritized',
    features: [
      'Lead scoring',
      'Custom tags and segments',
      'Search and filter',
      'Notes and activity tracking',
    ],
  },
  {
    title: 'Deal Pipeline Management',
    description: 'Visual pipeline tracking ensures no deal falls through',
    features: [
      'Visual deal pipeline',
      'Task management',
      'Status tracking',
      'Revenue forecasting',
    ],
  },
];

const results = [
  { metric: 'More', description: 'Deals closed', detail: 'Through better lead management' },
  { metric: 'Faster', description: 'Lead response', detail: 'With instant automation' },
  { metric: 'Increased', description: 'Referrals', detail: 'From improved client service' },
  { metric: 'Higher', description: 'GCI per agent', detail: 'From efficiency gains' },
];

const features = [
  'Lead capture forms',
  'Quick lead response',
  'Contact management',
  'Deal pipeline tracking',
  'Email automation',
  'Task reminders',
  'Lead scoring',
  'Reporting dashboard',
  'Marketing automation',
  'Mobile access',
  'Team collaboration',
  'Performance analytics',
];

export default function RealEstatePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full mb-6">
              <Key className="w-4 h-4" />
              <span className="text-sm font-semibold">Built for Real Estate</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Close More Deals with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-senova-primary to-senova-accent block">
                Intelligent Lead Management
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Respond instantly, nurture automatically, match properties intelligently, and close more deals - all in one platform designed specifically for real estate agents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-senova-primary to-senova-accent hover:from-orange-700 hover:to-amber-600 transition-all">
                Schedule a Consultation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-6 py-3 border-2 border-senova-primary text-base font-medium rounded-lg text-senova-primary bg-white hover:bg-amber-50 transition-all">
                View Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['Lead Automation', 'Instant Response Tools', 'Professional Support', 'Import Your Database'].map((item) => (
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
                src={images.industries.realEstate.keys}
                alt="Real estate agent with keys"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.realEstate.office}
                alt="Real estate office"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.realEstate.property}
                alt="Beautiful property"
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
                Competing in real estate shouldn't be this hard
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
                Your Complete Real Estate Solution
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to dominate your market
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
                Real Results from Top Producers
              </h2>
              <p className="text-xl text-amber-100">
                Join successful agents using Senova
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
                Features Built for Real Estate Agents
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to close more deals
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

      {/* Success Story */}
      <section className="py-20 bg-senova-bg-tertiary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
              <Building className="w-12 h-12 text-senova-primary mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Transform Your Real Estate Business
              </h3>
              <p className="text-lg text-gray-700 mb-4">
                Our automated follow-up system helps agents stay top-of-mind with their leads, ensuring no opportunity is missed.
              </p>
              <p className="text-gray-600">
                With intelligent lead nurturing and automated campaigns, you can focus on what you do best - closing deals and building relationships.
              </p>
              <div className="mt-6 text-senova-primary font-semibold">
                Join successful real estate professionals using Senova
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built-In Tools for Real Estate Success
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Everything you need to manage your real estate business in one platform
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { name: 'Email Campaigns', desc: 'Send automated drip sequences' },
                { name: 'Lead Forms', desc: 'Capture leads from your website' },
                { name: 'Task Manager', desc: 'Never miss a follow-up' },
                { name: 'Contact Database', desc: 'Organize all your leads' },
                { name: 'Performance Reports', desc: 'Track your conversion rates' },
                { name: 'Mobile Access', desc: 'Work from anywhere' },
              ].map((tool) => (
                <div key={tool.name} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900 mb-1">{tool.name}</div>
                  <div className="text-sm text-gray-600">{tool.desc}</div>
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
              Ready to Close More Deals?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See why top producers choose Senova CRM
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-senova-primary to-senova-accent hover:from-orange-700 hover:to-amber-600 transition-all">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-senova-primary text-lg font-medium rounded-lg text-senova-primary bg-white hover:bg-amber-50 transition-all">
                Talk to Sales
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              No credit card required • Professional consultation • Import your existing database
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}