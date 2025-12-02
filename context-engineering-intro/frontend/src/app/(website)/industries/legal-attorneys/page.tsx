import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowRight, Users, Clock, FolderX, MessageSquare, Shield, FileText, Scale, Briefcase } from 'lucide-react';
import { images } from '@/lib/images';

export const metadata: Metadata = {
  title: 'CRM for Law Firms & Attorneys | Legal Practice Management | Senova',
  description: 'Transform your law practice with intelligent client management. Automate intake, track billable hours, manage cases, and increase revenue. See demo.',
  openGraph: {
    title: 'CRM for Law Firms & Attorneys | Legal Practice Management',
    description: 'Transform your law practice with intelligent client management. Automate intake and track billable hours.',
    images: ['/images/legal-attorneys-crm.jpg'],
  },
};

const painPoints = [
  {
    title: 'Client Intake Chaos',
    description: 'Manual intake processes leading to lost leads, incomplete information, and delayed response times',
    icon: Users,
  },
  {
    title: 'Billable Hours Leakage',
    description: 'Attorneys lose significant billable time due to poor time tracking',
    icon: Clock,
  },
  {
    title: 'Case Management Nightmare',
    description: 'Scattered documents, missed deadlines, lack of visibility',
    icon: FolderX,
  },
  {
    title: 'Client Communication Gaps',
    description: 'Inconsistent follow-ups, delayed responses',
    icon: MessageSquare,
  },
];

const solutions = [
  {
    title: 'Automated Client Intake',
    description: 'Smart intake forms, automated conflict checks, instant lead qualification',
    features: [
      'Smart intake forms with conditional logic',
      'Automated conflict checking',
      'Instant lead scoring and routing',
      'Document collection portal',
    ],
  },
  {
    title: 'Time & Billing Integration',
    description: 'Capture every billable minute with automated time tracking',
    features: [
      'One-click time tracking',
      'Automated billing reminders',
      'Integration with QuickBooks/Clio',
      'Real-time profitability analytics',
    ],
  },
  {
    title: 'Complete Case Management',
    description: 'Centralize all case information, documents, communications',
    features: [
      'Matter-centric organization',
      'Automated deadline tracking',
      'Document management system',
      'Court calendar integration',
    ],
  },
  {
    title: 'Client Portal & Communication',
    description: 'Keep clients informed with automated updates',
    features: [
      'Secure client portal',
      'Automated case updates',
      'Two-way texting compliance',
      'Review management system',
    ],
  },
];

const results = [
  { metric: 'Higher', description: 'Intake conversion', detail: 'More leads become clients' },
  { metric: 'Hours', description: 'Saved per attorney/day', detail: 'On administrative tasks' },
  { metric: 'Better', description: 'Client satisfaction', detail: 'Through better communication' },
  { metric: 'More', description: 'Revenue per attorney', detail: 'From improved efficiency' },
];

const features = [
  'Legal-specific intake forms',
  'Conflict checking system',
  'Time tracking integration',
  'Document management',
  'Court calendar sync',
  'Client portal access',
  'Automated billing',
  'Trust accounting compliance',
  'Matter management',
  'Task automation',
  'Email integration',
  'Performance analytics',
];

export default function LegalAttorneysPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-6">
              <Scale className="w-4 h-4" />
              <span className="text-sm font-semibold">Built for Law Firms</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Law Practice with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-senova-primary to-senova-hot block">
                Intelligent Client Management
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Automate intake, track billable hours, manage cases, and deliver exceptional client service - all in one platform designed specifically for law firms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-senova-primary to-senova-hot hover:from-orange-700 hover:to-red-600 transition-all">
                Schedule a Consultation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-6 py-3 border-2 border-senova-primary text-base font-medium rounded-lg text-senova-primary bg-white hover:bg-orange-50 transition-all">
                View Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['Bar Compliant', 'Secure Client Portal', 'Professional Support', 'Import Existing Clients'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange-500" />
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
                src={images.industries.legalAttorneys.team}
                alt="Legal team collaboration"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.legalAttorneys.library}
                alt="Law library research"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={images.industries.legalAttorneys.consultation}
                alt="Client consultation"
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
                Running a successful law practice shouldn't be this hard
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
                Your Complete Legal Solution
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to manage and grow your law practice
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
                Real Results from Real Law Firms
              </h2>
              <p className="text-xl text-orange-100">
                Join hundreds of successful law firms using Senova
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
                Features Built for Law Firms
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

      {/* Trust & Credibility Section */}
      <section className="py-20 bg-senova-bg-tertiary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl text-center">
              <Briefcase className="w-12 h-12 text-senova-primary mb-6 mx-auto" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Built for Law Firms Like Yours
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                From solo practitioners to multi-attorney firms, our platform adapts to your practice's unique needs.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-senova-primary mb-2">Secure</div>
                  <p className="text-gray-600">Enterprise-grade security for sensitive client data</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-senova-primary mb-2">Compliant</div>
                  <p className="text-gray-600">Built with legal industry requirements in mind</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-senova-primary mb-2">Scalable</div>
                  <p className="text-gray-600">Grows with your practice as you expand</p>
                </div>
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
              Integrates with Your Legal Tools
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Works seamlessly with popular legal practice management software
            </p>
            <div className="flex flex-wrap gap-8 justify-center items-center">
              {['Clio', 'QuickBooks', 'LawPay', 'PracticePanther', 'MyCase'].map((tool) => (
                <div key={tool} className="text-lg font-semibold text-gray-700 px-6 py-3 bg-gray-100 rounded-lg">
                  {tool}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Law Practice?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See why hundreds of law firms choose Senova CRM
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-senova-primary to-senova-hot hover:from-orange-700 hover:to-red-600 transition-all">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-senova-primary text-lg font-medium rounded-lg text-senova-primary bg-white hover:bg-orange-50 transition-all">
                Talk to Sales
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              No credit card required • Professional consultation • Import your existing clients
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}