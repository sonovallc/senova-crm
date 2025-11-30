import { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen, Search, ChevronRight, FileText, Code, Database,
  Zap, Shield, Users, Settings, HelpCircle, Video, Download,
  Rocket, Terminal, Cloud, Key, Mail, BarChart
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation | Senova CRM',
  description: 'Complete documentation, API reference, and guides for Senova CRM. Get started quickly with our comprehensive resources.',
  openGraph: {
    title: 'Documentation | Senova CRM',
    description: 'Complete documentation, API reference, and guides for Senova CRM.',
  },
};

const docCategories = [
  {
    title: 'Getting Started',
    description: 'Everything you need to begin using Senova CRM',
    icon: Rocket,
    color: 'bg-green-100 text-green-700',
    articles: [
      { title: 'Quick Start Guide', time: '5 min' },
      { title: 'Initial Setup & Configuration', time: '10 min' },
      { title: 'Importing Your Data', time: '8 min' },
      { title: 'Setting Up Your Team', time: '5 min' },
      { title: 'Your First Campaign', time: '15 min' }
    ]
  },
  {
    title: 'Features Guide',
    description: 'Deep dive into all Senova CRM features',
    icon: Zap,
    color: 'bg-orange-100 text-orange-700',
    articles: [
      { title: 'Contact Management', time: '12 min' },
      { title: 'Email Campaigns', time: '20 min' },
      { title: 'Automation Workflows', time: '25 min' },
      { title: 'Customer Segmentation', time: '15 min' },
      { title: 'Analytics & Reporting', time: '18 min' }
    ]
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation for developers',
    icon: Code,
    color: 'bg-blue-100 text-blue-700',
    articles: [
      { title: 'Authentication', time: '10 min' },
      { title: 'REST API Endpoints', time: '30 min' },
      { title: 'Webhooks', time: '15 min' },
      { title: 'Rate Limits', time: '5 min' },
      { title: 'SDKs & Libraries', time: '10 min' }
    ]
  },
  {
    title: 'Integrations',
    description: 'Connect Senova with your favorite tools',
    icon: Cloud,
    color: 'bg-purple-100 text-purple-700',
    articles: [
      { title: 'Zapier Integration', time: '8 min' },
      { title: 'Google Workspace', time: '12 min' },
      { title: 'Facebook & Instagram', time: '15 min' },
      { title: 'Mailchimp Migration', time: '10 min' },
      { title: 'Custom Integrations', time: '20 min' }
    ]
  },
  {
    title: 'Security & Compliance',
    description: 'Keep your data safe and compliant',
    icon: Shield,
    color: 'bg-red-100 text-red-700',
    articles: [
      { title: 'Security Overview', time: '10 min' },
      { title: 'HIPAA Compliance', time: '15 min' },
      { title: 'Data Privacy & GDPR', time: '12 min' },
      { title: 'User Permissions', time: '8 min' },
      { title: 'Backup & Recovery', time: '10 min' }
    ]
  },
  {
    title: 'Best Practices',
    description: 'Tips and strategies from our experts',
    icon: BarChart,
    color: 'bg-teal-100 text-teal-700',
    articles: [
      { title: 'Email Marketing Best Practices', time: '15 min' },
      { title: 'Segmentation Strategies', time: '12 min' },
      { title: 'Automation Playbook', time: '20 min' },
      { title: 'A/B Testing Guide', time: '10 min' },
      { title: 'ROI Optimization', time: '18 min' }
    ]
  }
];

const popularArticles = [
  { title: 'How to Import Contacts from CSV', category: 'Getting Started', views: '12.3k' },
  { title: 'Setting Up Email Automation', category: 'Features', views: '9.8k' },
  { title: 'API Authentication Guide', category: 'API', views: '7.2k' },
  { title: 'HIPAA Compliance Checklist', category: 'Security', views: '6.5k' },
  { title: 'Zapier Integration Tutorial', category: 'Integrations', views: '5.9k' }
];

const quickLinks = [
  { title: 'Video Tutorials', icon: Video, href: '#' },
  { title: 'Download Resources', icon: Download, href: '#' },
  { title: 'API Status', icon: Terminal, href: '#' },
  { title: 'Release Notes', icon: FileText, href: '#' }
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 backdrop-blur rounded-full">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Documentation Center
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Everything you need to master Senova CRM. From quick start guides to advanced API documentation.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full pl-14 pr-6 py-4 rounded-xl text-gray-900 placeholder-gray-500 text-lg focus:ring-4 focus:ring-white/30"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors font-semibold">
                Search
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="text-white/80">Popular searches:</span>
              {['API key', 'Import contacts', 'Email automation', 'HIPAA', 'Webhooks'].map((term) => (
                <button
                  key={term}
                  className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm hover:bg-white/30 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-6 py-12 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <link.icon className="w-6 h-6 text-orange-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-gray-700">{link.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Documentation Categories */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse Documentation</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {docCategories.map((category) => (
                  <div
                    key={category.title}
                    className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6 group cursor-pointer"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3 rounded-lg ${category.color}`}>
                        <category.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {category.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {category.articles.map((article) => (
                        <Link
                          key={article.title}
                          href="#"
                          className="flex items-center justify-between py-2 text-gray-600 hover:text-orange-600 transition-colors"
                        >
                          <span className="text-sm">{article.title}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{article.time}</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </Link>
                      ))}
                    </div>

                    <Link
                      href="#"
                      className="inline-flex items-center gap-2 mt-4 text-orange-600 hover:text-orange-700 font-semibold text-sm"
                    >
                      View all articles
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Popular Articles */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Most Popular</h3>
                <div className="space-y-3">
                  {popularArticles.map((article, index) => (
                    <Link
                      key={article.title}
                      href="#"
                      className="flex items-start gap-3 group"
                    >
                      <span className="text-2xl font-bold text-gray-300 w-8">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{article.category}</span>
                          <span>•</span>
                          <span>{article.views} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Need Help Card */}
              <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl shadow p-6 text-white">
                <HelpCircle className="w-10 h-10 mb-4" />
                <h3 className="text-xl font-bold mb-3">Need Help?</h3>
                <p className="mb-6 text-white/90">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/contact"
                    className="block w-full px-4 py-3 bg-white text-orange-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-center"
                  >
                    Contact Support
                  </Link>
                  <button className="w-full px-4 py-3 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors font-semibold">
                    Schedule a Call
                  </button>
                </div>
              </div>

              {/* Developer Resources */}
              <div className="bg-gray-900 rounded-xl shadow p-6 text-white">
                <Terminal className="w-10 h-10 mb-4 text-green-400" />
                <h3 className="text-xl font-bold mb-3">Developer Resources</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="#" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <Key className="w-4 h-4" />
                      <span>Get API Key</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <Code className="w-4 h-4" />
                      <span>Code Examples</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <Database className="w-4 h-4" />
                      <span>Data Schema</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <Mail className="w-4 h-4" />
                      <span>Postman Collection</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  q: 'How do I get started with Senova CRM?',
                  a: 'Start with our Quick Start Guide which walks you through initial setup, importing contacts, and creating your first campaign in under 30 minutes.'
                },
                {
                  q: 'Is there an API rate limit?',
                  a: 'Yes, our API allows 1000 requests per minute for Professional plans and unlimited for Enterprise. See our API documentation for details.'
                },
                {
                  q: 'Can I import my data from another CRM?',
                  a: 'Absolutely! We support CSV imports and have direct migration tools for popular CRMs like Salesforce, HubSpot, and Mailchimp.'
                },
                {
                  q: 'How does HIPAA compliance work?',
                  a: 'Senova is fully HIPAA compliant with encrypted data storage, audit logs, and BAA agreements available for healthcare clients.'
                },
                {
                  q: 'What integrations are available?',
                  a: 'We integrate with 100+ tools including Zapier, Google Workspace, Facebook, Instagram, QuickBooks, and more.'
                },
                {
                  q: 'How do I set up email automation?',
                  a: 'Our visual workflow builder makes it easy. Check our Email Automation guide for step-by-step instructions and templates.'
                }
              ].map((faq, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of businesses growing with Senova CRM.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/demo"
              className="px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-gray-800 text-white border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors font-semibold text-lg"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}