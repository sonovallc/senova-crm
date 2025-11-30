import { Metadata } from 'next';
import Link from 'next/link';
import { Check, Zap, Mail, MessageSquare, Globe, TrendingUp, Calendar, Users, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Smart Business Advertising Platform | Reach More Customers',
  description: 'Find new customers online with smart advertising that works everywhere. Skip the agency markups and advertise directly at wholesale prices. Start today.',
  openGraph: {
    title: 'Smart Business Advertising Platform | Reach More Customers',
    description: 'Find new customers online with smart advertising that works everywhere. Skip the agency markups and advertise directly at wholesale prices. Start today.',
    images: ['/images/campaign-dashboard.jpg'],
  },
};

const stats = [
  { value: '50%', label: 'Lower Ad Costs' },
  { value: '24hr', label: 'Campaign Launch' },
  { value: '5-10x', label: 'Return on Spend' },
];

const channels = [
  { name: 'Email', icon: Mail },
  { name: 'Text/SMS', icon: MessageSquare },
  { name: 'Social Media', icon: Globe },
  { name: 'News Sites', icon: Globe },
  { name: 'Mobile Apps', icon: Target },
  { name: 'Streaming TV', icon: Globe },
];

const campaignTemplates = [
  { name: 'New Customer Welcome', description: 'Turn first-time buyers into repeat customers', rate: '22%' },
  { name: 'Win Back Old Customers', description: 'Bring back customers who haven\'t bought in a while', rate: '18%' },
  { name: 'Seasonal Promotions', description: 'Holiday and seasonal campaigns that work', rate: '15%' },
  { name: 'Birthday Specials', description: 'Personalized birthday offers', rate: '31%' },
];

const businessTemplates = [
  { name: 'Restaurant Lunch Rush', description: 'Fill tables during slow hours', rate: '24%' },
  { name: 'Service Appointment Reminders', description: 'Keep your schedule full', rate: '34%' },
  { name: 'Product Launch', description: 'Introduce new products or services', rate: '19%' },
  { name: 'Loyalty Program', description: 'Reward your best customers', rate: '41%' },
];

const automatedWorkflows = [
  { name: 'Welcome Series', description: '5-email series for new customers', rate: '28%' },
  { name: 'Abandoned Cart Recovery', description: 'Bring back window shoppers', rate: '26%' },
  { name: 'Customer Reviews', description: 'Ask happy customers for reviews', rate: '16%' },
  { name: 'Referral Program', description: 'Turn customers into advocates', rate: '24%' },
];

const results = [
  { metric: '2x', description: 'More customers from campaigns' },
  { metric: '50%', description: 'Less spent on advertising' },
  { metric: '3x', description: 'Better email open rates' },
  { metric: '5x', description: 'Return on ad spend' },
];

export default function CampaignActivationPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Customers Are Everywhere.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                Now Your Ads Can Be Too.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Show your ads to people who actually want what you sell. Reach them on websites, apps, streaming services - everywhere they spend time online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/demo" className="btn-primary">
                Start Your First Campaign
              </Link>
              <Link href="#templates" className="btn-secondary">
                See Campaign Templates
              </Link>
            </div>
            <div className="flex justify-center gap-12">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              Your Marketing Is Too Complicated and Expensive
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'Different tools for email, text, and social media',
                'Generic templates that don\'t speak to your customers',
                'No way to track which ads actually work',
                'Hours spent creating campaigns nobody sees',
                'Missing the right time to reach customers',
                'Can\'t advertise on most websites',
              ].map((issue, idx) => (
                <div key={idx} className="bg-red-50 rounded-lg p-4 text-left border border-red-100">
                  <p className="text-gray-700">{issue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              Everything You Need in One Simple Platform
            </h2>
            <p className="text-xl text-gray-600 mb-12 text-center">
              Create, launch, and track campaigns across all channels
            </p>

            {/* Multi-Channel Grid */}
            <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Advertise Everywhere at Once</h3>
              <p className="text-gray-600 mb-8">Launch campaigns across all platforms from one simple dashboard</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {channels.map((channel, idx) => (
                  <div key={idx} className="text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <channel.icon className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{channel.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <Calendar className="w-10 h-10 text-orange-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Set It and Forget It</h3>
                <p className="text-gray-600 mb-4">Campaigns that run themselves while you run your business</p>
                <ul className="space-y-2">
                  {['Welcome new customers', 'Birthday offers', 'Service reminders', 'Win-back campaigns'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <TrendingUp className="w-10 h-10 text-orange-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">See What Actually Works</h3>
                <p className="text-gray-600 mb-4">Know exactly which ads bring in customers</p>
                <ul className="space-y-2">
                  {['Test different messages', 'Best time to send', 'Track every sale', 'Stop wasting money'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Targeting Features */}
      <section className="py-20 bg-gradient-to-br from-senova-primary/5 to-senova-info/5">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              Find Customers Who Actually Want What You Sell
            </h2>
            <p className="text-xl text-gray-600 mb-12 text-center">
              Stop wasting money showing ads to the wrong people
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Find the Right People */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <Target className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Find the Right People</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Target by age, income, location, interests</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Find people actively looking for your products</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Reach specific neighborhoods or areas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Use data from millions of real shoppers</span>
                  </li>
                </ul>
              </div>

              {/* Reach Them Anywhere */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <Globe className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Reach Them Anywhere</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Your ads on news sites and blogs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>In mobile apps and games</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>On streaming TV services</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Beyond just Facebook and Google</span>
                  </li>
                </ul>
              </div>

              {/* Smart Campaign Management */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <TrendingUp className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Campaign Management</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Automatically finds what works best</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Test different messages easily</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Spend more on what works</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Know your cost per customer</span>
                  </li>
                </ul>
              </div>

              {/* Save Money */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <Zap className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Skip the Middleman</h3>
                <p className="text-gray-700 mb-4">
                  Buy advertising directly at wholesale prices, just like big companies do.
                  No agency markups, no hidden fees.
                </p>
                <div className="bg-amber-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-orange-900">
                    <strong>Save 30-50%:</strong> Most businesses cut their advertising costs in half while reaching more customers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Templates */}
      <section id="templates" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">50+ Proven Campaign Templates</h2>
              <p className="text-xl text-gray-600">Launch campaigns in minutes with templates that actually work</p>
            </div>

            {/* Template Categories */}
            <div className="space-y-12">
              {/* General Business Campaigns */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Customer Campaigns</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {campaignTemplates.map((template, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                        <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-1 rounded">
                          {template.rate} success rate
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business-Specific */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Business-Specific Templates</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {businessTemplates.map((template, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                        <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-1 rounded">
                          {template.rate} success rate
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automated Workflows */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Automated Workflows</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {automatedWorkflows.map((template, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                        <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-1 rounded">
                          {template.rate} success rate
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Real Results from Real Businesses</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {results.map((result, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-4xl font-bold mb-2">{result.metric}</div>
                  <div className="text-orange-200">{result.description}</div>
                </div>
              ))}
            </div>
            <blockquote className="text-xl italic text-center mt-12 text-amber-100">
              "The campaign templates alone saved us 20 hours a month. Our welcome emails now get
              opened 3x more often, and we're spending half as much on advertising."
            </blockquote>
            <p className="text-center mt-4 text-orange-200">- Maria Rodriguez, Restaurant Owner</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Get More Customers?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start with our proven templates and see results in days, not months
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/demo" className="btn-primary">
                Start Free Trial
              </Link>
              <Link href="/pricing" className="btn-secondary">
                See Pricing
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['50+ templates included', 'No setup fees', 'Launch in minutes', 'Cancel anytime'].map((item, idx) => (
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