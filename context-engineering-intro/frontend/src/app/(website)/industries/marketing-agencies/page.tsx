import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowRight, UserX, FileSpreadsheet, Puzzle, TrendingDown, Rocket, Handshake, Zap, Target } from 'lucide-react';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'White-Label CRM for Marketing Agencies | Partner Program | Senova',
  description: 'Not your competition - your secret weapon for client success. White-label CRM partnership, automated reporting, and increased MRR. Join our partner program.',
  openGraph: {
    title: 'White-Label CRM for Marketing Agencies | Partner Program',
    description: 'Your secret weapon for client success. White-label CRM partnership with revenue sharing.',
    images: ['/images/marketing-agencies-crm.jpg'],
  },
};

const painPoints = [
  {
    title: 'Client Retention Crisis',
    description: 'Agencies lose significant clients annually',
    icon: UserX,
  },
  {
    title: 'Manual Reporting Hell',
    description: 'Teams waste many hours weekly creating reports',
    icon: FileSpreadsheet,
  },
  {
    title: 'Tool Sprawl Chaos',
    description: 'Managing 10+ different tools per client',
    icon: Puzzle,
  },
  {
    title: 'Revenue Growth Plateau',
    description: 'Struggling to scale beyond project work',
    icon: TrendingDown,
  },
];

const solutions = [
  {
    title: 'White-Label CRM Platform',
    description: 'Offer Senova as YOUR OWN branded CRM solution',
    features: [
      'Full white-label branding',
      'Custom domain setup',
      'Multi-tenant architecture',
      'Revenue sharing program',
    ],
  },
  {
    title: 'Automated Client Reporting',
    description: 'Generate beautiful reports in seconds',
    features: [
      'One-click report generation',
      'Custom branded templates',
      'Real-time ROI tracking',
      'Automated report delivery',
    ],
  },
  {
    title: 'Unified Client Hub',
    description: 'Manage all client campaigns from one platform',
    features: [
      'Multi-client dashboard',
      'Campaign management tools',
      'Lead tracking & attribution',
      'Team collaboration features',
    ],
  },
  {
    title: 'Agency Growth Accelerator',
    description: 'Tools and training to scale your agency',
    features: [
      'Agency playbooks & templates',
      'Sales enablement tools',
      'Partner certification program',
      'Priority support channel',
    ],
  },
];

const results = [
  { metric: 'Better', description: 'Client retention', detail: 'Through better service delivery' },
  { metric: 'Higher', description: 'MRR added', detail: 'From CRM revenue sharing' },
  { metric: 'Faster', description: 'Reporting', detail: 'With automated reports' },
  { metric: 'Increased', description: 'Client lifetime value', detail: 'From retention & upsell' },
];

const features = [
  'White-label platform',
  'Multi-client management',
  'Campaign tracking',
  'Lead attribution',
  'Automated reporting',
  'Client portals',
  'Team collaboration',
  'API integrations',
  'Revenue sharing',
  'Training resources',
  'Priority support',
  'Custom development',
];

export default function MarketingAgenciesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section - Special Partnership Positioning */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-red-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-6">
              <Handshake className="w-4 h-4" />
              <span className="text-sm font-semibold">Partner Program</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Not Your Competition -
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-senova-primary to-senova-hot block">
                Your Secret Weapon for Client Success
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Join our white-label partnership program. Offer Senova CRM as your own branded solution, add recurring revenue, and deliver exceptional results for your clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-senova-primary to-senova-hot hover:from-orange-700 hover:to-red-600 transition-all">
                Become a Partner
                <Rocket className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-6 py-3 border-2 border-senova-electric text-base font-medium rounded-lg bg-senova-electric text-white hover:bg-senova-electric-600 hover:scale-105 shadow-lg transition-all">
                <Zap className="mr-2 w-5 h-5" />
                View Partner Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['White-Label Solution', 'Revenue Sharing', 'Partner Training', 'Priority Support'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-senova-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Benefits Banner */}
      <section className="py-8 bg-gradient-to-r from-senova-primary to-senova-hot text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              <span className="font-semibold">YOUR Brand, YOUR Clients</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6" />
              <span className="font-semibold">Competitive Revenue Share</span>
            </div>
            <div className="flex items-center gap-2">
              <Handshake className="w-6 h-6" />
              <span className="font-semibold">We Support, You Succeed</span>
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
                src={images.industries.marketingAgencies.workspace}
                alt="Marketing agency workspace"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.marketingAgencies.collaboration}
                alt="Agency team collaboration"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.marketingAgencies.strategy}
                alt="Strategic planning session"
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
                Your Current Agency Challenges
              </h2>
              <p className="text-xl text-gray-600">
                We know what keeps agency owners up at night
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

      {/* Solutions Section - Partnership Focus */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Your Partnership Advantage
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to add CRM as a profitable service line
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
                Real Results from Partner Agencies
              </h2>
              <p className="text-xl text-orange-100">
                Join 200+ agencies already growing with Senova
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
                Partner Program Features
              </h2>
              <p className="text-xl text-gray-600">
                Everything included in your partnership
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



      {/* CTA Section - Partner Focus */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Grow Your Agency with Partnership?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join 200+ agencies already succeeding with Senova's Partner Program
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-senova-primary to-senova-hot hover:from-orange-700 hover:to-red-600 transition-all">
                Apply for Partner Program
                <Rocket className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-8 py-4 border-2 border-senova-primary text-lg font-medium rounded-lg text-senova-primary bg-white hover:bg-orange-50 transition-all">
                View Pricing Options
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              Revenue share program • White-label ready • Full training included • Dedicated partner success team
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}