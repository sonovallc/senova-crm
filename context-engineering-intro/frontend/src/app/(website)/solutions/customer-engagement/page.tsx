import { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ArrowRight, MessageSquare, Heart, Sparkles, Zap, Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Customer Engagement That Drives 5X Loyalty | Senova',
  description: 'Build lasting customer relationships with personalized communications, automated touchpoints, and intelligent engagement tracking. Increase retention by 60%.',
  openGraph: {
    title: 'Customer Engagement That Drives 5X Loyalty | Senova',
    description: 'Build lasting customer relationships with personalized communications and intelligent engagement tracking.',
    images: ['/images/customer-engagement.jpg'],
  },
};

const features = [
  {
    title: 'Personalized Communications',
    description: 'Every message feels personal and relevant',
    icon: MessageSquare,
    capabilities: [
      'Dynamic content based on customer data',
      'Behavioral trigger campaigns',
      'Preference-based messaging',
      'Smart send-time optimization',
      'Multi-language support',
      'A/B testing for messaging',
    ],
  },
  {
    title: 'Multi-Channel Orchestration',
    description: 'Reach customers where they are',
    icon: Sparkles,
    capabilities: [
      'Email marketing automation',
      'SMS and MMS campaigns',
      'Social media engagement',
      'In-app messaging',
      'Direct mail integration',
      'Voice call campaigns',
    ],
  },
  {
    title: 'Loyalty & Retention',
    description: 'Turn customers into advocates',
    icon: Heart,
    capabilities: [
      'Points and rewards programs',
      'VIP tier management',
      'Birthday and anniversary campaigns',
      'Win-back sequences',
      'Referral program automation',
      'Customer milestone celebrations',
    ],
  },
  {
    title: 'Engagement Analytics',
    description: 'Understand what drives loyalty',
    icon: Zap,
    capabilities: [
      'Customer engagement scoring',
      'Lifetime value predictions',
      'Churn risk identification',
      'Campaign performance metrics',
      'Customer journey mapping',
      'Sentiment analysis tracking',
    ],
  },
];

const engagementJourney = [
  { stage: 'Welcome', description: 'Personalized onboarding sequence', timing: 'Days 1-7' },
  { stage: 'Activation', description: 'Feature education and quick wins', timing: 'Days 8-30' },
  { stage: 'Engagement', description: 'Regular value-add communications', timing: 'Month 2-3' },
  { stage: 'Retention', description: 'Loyalty rewards and exclusive offers', timing: 'Month 4+' },
  { stage: 'Advocacy', description: 'Referral programs and testimonials', timing: 'Month 6+' },
];

const metrics = [
  { value: '60%', label: 'Higher retention', description: 'With engagement automation' },
  { value: '5X', label: 'More loyal', description: 'Engaged customers are' },
  { value: '3.4X', label: 'Higher LTV', description: 'From personalized journeys' },
  { value: '45%', label: 'More referrals', description: 'From engaged customers' },
];

export default function CustomerEngagementPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Build Relationships That{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                Last a Lifetime
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Transform one-time buyers into lifetime advocates with intelligent engagement automation
              that makes every customer feel valued and understood.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary">
                See Engagement Demo
              </Link>
              <Link href="#features" className="btn-secondary">
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why 70% of Customers Never Return
              </h2>
              <ul className="space-y-4">
                {[
                  'Generic, irrelevant communications',
                  'No follow-up after purchase',
                  'Treating all customers the same',
                  'Missing important milestones',
                  'No loyalty incentives',
                ].map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                The Engagement Advantage
              </h2>
              <ul className="space-y-4">
                {[
                  'Hyper-personalized messaging at scale',
                  'Automated post-purchase sequences',
                  'Segment-specific engagement paths',
                  'Never miss birthdays or renewals',
                  'Automated loyalty and rewards',
                ].map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Journey Visual */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">The Perfect Customer Journey</h2>
              <p className="text-xl text-gray-600">Automated touchpoints that build lasting relationships</p>
            </div>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-200 via-orange-400 to-orange-600"></div>
              {engagementJourney.map((item, idx) => (
                <div key={idx} className="relative flex items-start mb-8">
                  <div className="absolute left-6 w-5 h-5 bg-white border-4 border-orange-500 rounded-full"></div>
                  <div className="ml-16 bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{item.stage}</h3>
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {item.timing}
                      </span>
                    </div>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Engagement Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to build meaningful customer relationships
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-8 border-2 border-gray-100 hover:border-orange-200 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <feature.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-16">
                  {feature.capabilities.map((cap, capIdx) => (
                    <li key={capIdx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Metrics */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Engagement That Pays Off</h2>
            <p className="text-xl text-amber-100">Real results from engaged customers</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl font-bold mb-2">{metric.value}</div>
                <div className="text-lg font-semibold mb-2">{metric.label}</div>
                <div className="text-sm text-orange-200">{metric.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personalization Example */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Personalization at Scale</h2>
              <p className="text-xl text-gray-600">One campaign, thousands of personalized experiences</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-900">New Customer - Sarah</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Subject:</span> Welcome Sarah! Here's your exclusive 20% off
                  </p>
                  <p className="text-sm text-gray-600">
                    Hi Sarah, thanks for joining! As a welcome gift, enjoy 20% off your first order.
                    We noticed you browsed our premium collection...
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span>Sent at optimal time: 10:30 AM</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-900">VIP Customer - Michael</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Subject:</span> Michael, your VIP early access is here
                  </p>
                  <p className="text-sm text-gray-600">
                    As our valued VIP member for 2 years, you get 48-hour early access to our new collection.
                    Based on your preferences for tech products...
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span>Sent at optimal time: 7:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Retention Strategies */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Proven Retention Strategies</h2>
            <p className="text-xl text-gray-600">Automated campaigns that keep customers coming back</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome Series</h3>
              <p className="text-gray-600">7-day onboarding that increases activation by 40%</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Win-Back Campaigns</h3>
              <p className="text-gray-600">Re-engage dormant customers with 25% success rate</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">VIP Treatment</h3>
              <p className="text-gray-600">Top 20% customers drive 80% of revenue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <blockquote className="text-2xl text-gray-700 italic mb-6">
              "Senova's engagement automation increased our customer lifetime value by 3.4X.
              The personalization capabilities are unlike anything we've used before."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div>
                <div className="font-semibold text-gray-900">Mark Thompson</div>
                <div className="text-gray-600">CMO, Retail Solutions Inc • Seattle, WA</div>
              </div>
            </div>
            <div className="mt-4 text-orange-600 font-semibold">3.4X increase in customer LTV</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Build Lasting Relationships?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See how Senova can transform your customer engagement
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/contact" className="btn-primary">
                Get Personalized Demo
              </Link>
              <Link href="/pricing" className="btn-secondary">
                See Pricing
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['Professional consultation', 'No setup fees', 'Migration support', 'Dedicated success manager'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}