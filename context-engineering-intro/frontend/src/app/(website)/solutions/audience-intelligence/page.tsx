import { Metadata } from 'next';
import Link from 'next/link';
import { Check, Target, Users, Globe, TrendingUp, Database, Mail, DollarSign, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Customer Intelligence Software | Know & Grow Your Base',
  description: 'Understand your customers better with small business CRM that shows you who buys, why they buy, and how to find more like them. Simple, powerful insights.',
  openGraph: {
    title: 'Customer Intelligence Software | Know & Grow Your Base',
    description: 'Understand your customers better with small business CRM that shows you who buys, why they buy, and how to find more like them. Simple, powerful insights.',
    images: ['/images/audience-builder.jpg'],
  },
};

const stats = [
  { value: 'Millions', label: 'Customer Profiles' },
  { value: '1000s', label: 'Data Points' },
  { value: '50+', label: 'Ready Audiences' },
];

const problems = [
  { title: "Facebook targeting doesn't work", description: '"Interested in shopping" is too vague' },
  { title: 'Google Ads are too expensive', description: 'Paying $50+ per click is unsustainable' },
  { title: "Can't find competitor customers", description: "Missing people who buy from competitors" },
  { title: 'Wrong timing with customers', description: 'Missing when customers are ready to buy' },
];

const audienceCategories = [
  {
    name: 'Restaurant Customers',
    audiences: [
      'Lunch Hour Office Workers',
      'Weekend Brunch Lovers',
      'Family Dinner Groups',
      'Date Night Couples',
      'Takeout Regulars',
    ],
  },
  {
    name: 'Home Service Buyers',
    audiences: [
      'New Homeowners',
      'Spring Cleaning Seekers',
      'Emergency Repair Needs',
      'Regular Maintenance Buyers',
      'Home Improvement DIYers',
    ],
  },
  {
    name: 'Retail Shoppers',
    audiences: [
      'Bargain Hunters',
      'Premium Product Buyers',
      'Seasonal Shoppers',
      'Gift Buyers',
      'Loyalty Program Members',
    ],
  },
  {
    name: 'Service Seekers',
    audiences: [
      'Small Business Owners',
      'Busy Professionals',
      'Parents with Kids',
      'Senior Citizens',
      'First-Time Buyers',
    ],
  },
];

const channels = [
  {
    name: 'Social Media',
    description: 'Find customers on Facebook, Instagram, and more',
    benefits: ['Custom audiences', 'Similar customers', 'Exclude existing'],
  },
  {
    name: 'Search Advertising',
    description: 'Reach people actively searching',
    benefits: ['Search campaigns', 'Shopping ads', 'Video ads'],
  },
  {
    name: 'Email Marketing',
    description: 'Send messages that get opened',
    benefits: ['Verified emails', 'Smart segments', 'Personal touches'],
  },
  {
    name: 'Direct Mail',
    description: 'Yes, physical mail still works!',
    benefits: ['Local neighborhoods', 'New movers', 'High-value areas'],
  },
];

const caseStudyResults = [
  { metric: '50%', description: 'Lower cost per customer' },
  { metric: '3x', description: 'Better conversion rates' },
  { metric: '40%', description: 'Higher purchase amounts' },
  { metric: '2x', description: 'Faster results' },
];

const faqs = [
  {
    question: 'Is customer data kept private?',
    answer: 'Yes, all data is anonymous and grouped together. We never use individual personal data, only general patterns.',
  },
  {
    question: 'How accurate is the information?',
    answer: 'Our data is highly accurate and updated weekly. We verify through multiple sources and remove any questionable records.',
  },
  {
    question: 'Can I exclude my existing customers?',
    answer: 'Absolutely! Upload your customer list and we\'ll exclude them from targeting to focus on finding new customers.',
  },
  {
    question: 'How quickly can I start?',
    answer: 'Pre-built audiences are ready instantly. Custom audiences take about 24 hours to process and verify.',
  },
];

export default function AudienceIntelligencePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Know Your Customers.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                Find More Just Like Them.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Our customer intelligence shows you who your best customers are and helps you find more people just like them. No guessing, just results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/demo" className="btn-primary">
                Find Your Customers
              </Link>
              <Link href="#audiences" className="btn-secondary">
                See Sample Audiences
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
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
              Stop Wasting Money on the Wrong People
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {problems.map((problem, idx) => (
                <div key={idx} className="bg-red-50 rounded-lg p-6 border border-red-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{problem.title}</h3>
                  <p className="text-gray-700">{problem.description}</p>
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
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Find Customers Who Actually Want What You Sell
              </h2>
              <p className="text-xl text-gray-600">
                Smart data tells you exactly who to target and when
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left side - How it works */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <Database className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold">1.</span>
                    <span>We analyze your best customers to understand what makes them special</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold">2.</span>
                    <span>Our system finds millions of similar people who match that profile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold">3.</span>
                    <span>You can reach them through any advertising channel you want</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold">4.</span>
                    <span>Track which audiences bring in the most valuable customers</span>
                  </li>
                </ul>
              </div>

              {/* Right side - What you get */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <Target className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">What You Get</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Detailed profiles of your ideal customers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Ready-made audiences you can use today</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Custom audiences built for your business</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Monthly updates as customer preferences change</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-built Audiences */}
      <section id="audiences" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                50+ Ready-Made Audiences for Every Business
              </h2>
              <p className="text-xl text-gray-600">
                Start targeting the right customers immediately with pre-built audiences
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {audienceCategories.map((category, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h3>
                  <ul className="space-y-2">
                    {category.audiences.map((audience, audienceIdx) => (
                      <li key={audienceIdx} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-orange-600" />
                        <span className="text-gray-700">{audience}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-amber-50 rounded-xl p-8 border border-orange-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Can't Find What You Need?
              </h3>
              <p className="text-gray-700 text-center mb-6">
                We'll build custom audiences specifically for your business. Tell us who your ideal customer is,
                and we'll find thousands more just like them.
              </p>
              <div className="text-center">
                <Link href="/demo" className="btn-primary">
                  Request Custom Audience
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Channel Activation */}
      <section className="py-20 bg-gradient-to-br from-senova-primary/5 to-senova-info/5">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Use Your Audiences Everywhere
              </h2>
              <p className="text-xl text-gray-600">
                One audience works across all your marketing channels
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {channels.map((channel, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-lg">
                  <Globe className="w-10 h-10 text-orange-600 mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{channel.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{channel.description}</p>
                  <ul className="space-y-1">
                    {channel.benefits.map((benefit, benefitIdx) => (
                      <li key={benefitIdx} className="text-xs text-gray-600 flex items-start gap-1">
                        <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
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
      <section className="py-20 bg-gradient-to-br from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">
              Businesses See Real Results
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {caseStudyResults.map((result, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-4xl font-bold mb-2">{result.metric}</div>
                  <div className="text-orange-200">{result.description}</div>
                </div>
              ))}
            </div>
            <blockquote className="text-xl italic text-center text-amber-100">
              "Finding our ideal customers used to be guesswork. Now we know exactly who to target
              and our advertising costs are half what they used to be."
            </blockquote>
            <p className="text-center mt-4 text-orange-200">- Sarah Thompson, Retail Store Owner</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
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
              Ready to Find Your Perfect Customers?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start with our pre-built audiences or let us create custom ones for you
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
              {['50+ audiences ready', 'No minimums', 'Works with any business', 'Cancel anytime'].map((item, idx) => (
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