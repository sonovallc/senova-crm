import { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen, Search, ChevronRight, FileText, Code, Database,
  Zap, Shield, Users, Settings, HelpCircle, Video, Download,
  Rocket, Terminal, Cloud, Key, Mail, BarChart, Eye, Megaphone, Plug,
  Sparkles, TrendingUp, Command
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Senova CRM Help Center & Documentation | Guides, Tutorials & Support',
  description: 'Complete documentation for Senova CRM. Learn email marketing, SuperPixel tracking, data intelligence, DSP advertising, and integrations. Quick start guides and API docs included.',
  openGraph: {
    title: 'Senova CRM Help Center & Documentation',
    description: 'Master Senova CRM with our comprehensive guides, tutorials, and API documentation',
    type: 'website',
    url: 'https://senova.io/docs',
    images: ['/og-docs-home.png']
  },
};

const docCategories = [
  {
    title: 'Getting Started',
    description: 'Quick guides to get up and running with Senova CRM',
    icon: Rocket,
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    href: '/docs/getting-started',
    articleCount: 9,
    articles: [
      { title: 'Getting Started Guide', time: 'Contact us', href: '/contact' },
      { title: 'Account Setup Help', time: 'Contact us', href: '/contact' },
      { title: 'Import Assistance', time: 'Contact us', href: '/contact' },
      { title: 'Campaign Support', time: 'Contact us', href: '/contact' },
      { title: 'Dashboard Overview', time: 'Contact us', href: '/contact' }
    ]
  },
  {
    title: 'CRM & Contacts',
    description: 'Managing contacts, companies, and relationships',
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    href: '/docs/crm',
    articleCount: 23,
    articles: [
      { title: 'Contact Management', time: 'Contact us', href: '/contact' },
      { title: 'Field Customization', time: 'Contact us', href: '/contact' },
      { title: 'Data Import Help', time: 'Contact us', href: '/contact' },
      { title: 'Segmentation Support', time: 'Contact us', href: '/contact' },
      { title: 'CRM Best Practices', time: 'Contact us', href: '/contact' }
    ]
  },
  {
    title: 'Email Marketing',
    description: 'Create and send email campaigns',
    icon: Mail,
    color: 'from-green-500 to-emerald-500',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    href: '/docs/email-marketing',
    articleCount: 18,
    articles: [
      { title: 'Campaign Creation', time: 'Contact us', href: '/contact' },
      { title: 'Template Library', time: 'Contact us', href: '/contact' },
      { title: 'Automation Help', time: 'Contact us', href: '/contact' },
      { title: 'Testing Strategies', time: 'Contact us', href: '/contact' },
      { title: 'Analytics Support', time: 'Contact us', href: '/contact' }
    ]
  },
  {
    title: 'SuperPixel',
    description: 'Website visitor identification and tracking',
    icon: Eye,
    color: 'from-orange-500 to-red-500',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    href: '/docs/superpixel',
    articleCount: 15,
    articles: [
      { title: 'SuperPixel Setup', time: 'Contact us', href: '/contact' },
      { title: 'Installation Support', time: 'Contact us', href: '/contact' },
      { title: 'WordPress Integration', time: 'Contact us', href: '/contact' },
      { title: 'Tracking Configuration', time: 'Contact us', href: '/contact' },
      { title: 'Alert Settings', time: 'Contact us', href: '/contact' }
    ]
  },
  {
    title: 'Data Intelligence',
    description: 'Profile enrichment and audience building',
    icon: Database,
    color: 'from-cyan-500 to-blue-500',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    href: '/docs/data-intelligence',
    articleCount: 12,
    articles: [
      { title: 'Data Enrichment', time: 'Contact us', href: '/contact' },
      { title: 'Audience Building', time: 'Contact us', href: '/contact' },
      { title: 'Lookalike Creation', time: 'Contact us', href: '/contact' },
      { title: 'Company Intelligence', time: 'Contact us', href: '/contact' },
      { title: 'Market Analysis', time: 'Contact us', href: '/contact' }
    ]
  },
  {
    title: 'DSP & Advertising',
    description: 'Programmatic advertising and campaign management',
    icon: Megaphone,
    color: 'from-pink-500 to-purple-500',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    href: '/docs/dsp-advertising',
    articleCount: 10,
    articles: [
      { title: 'DSP Introduction', time: 'Contact us', href: '/contact' },
      { title: 'Campaign Setup', time: 'Contact us', href: '/contact' },
      { title: 'Audience Targeting', time: 'Contact us', href: '/contact' },
      { title: 'Retargeting Help', time: 'Contact us', href: '/contact' },
      { title: 'Performance Reports', time: 'Contact us', href: '/contact' }
    ]
  },
  {
    title: 'Integrations',
    description: 'Connect Senova with your tech stack',
    icon: Plug,
    color: 'from-indigo-500 to-purple-500',
    glowColor: 'rgba(99, 102, 241, 0.5)',
    href: '/docs/integrations',
    articleCount: 28,
    articles: [
      { title: 'Integration Support', time: 'Contact us', href: '/contact' },
      { title: 'Zapier Connection', time: 'Contact us', href: '/contact' },
      { title: 'API Documentation', time: 'Contact us', href: '/contact' },
      { title: 'Webhook Configuration', time: 'Contact us', href: '/contact' },
      { title: 'API Authentication', time: 'Contact us', href: '/contact' }
    ]
  },
  {
    title: 'Account & Settings',
    description: 'Manage your account and team',
    icon: Settings,
    color: 'from-gray-500 to-gray-600',
    glowColor: 'rgba(107, 114, 128, 0.5)',
    href: '/docs/account-settings',
    articleCount: 14,
    articles: [
      { title: 'User Management', time: 'Contact us', href: '/contact' },
      { title: 'Permission Settings', time: 'Contact us', href: '/contact' },
      { title: 'Security Setup', time: 'Contact us', href: '/contact' },
      { title: 'Billing Support', time: 'Contact us', href: '/contact' },
      { title: 'Compliance Help', time: 'Contact us', href: '/contact' }
    ]
  }
];

const popularArticles = [
  {
    title: 'Setting up your first campaign',
    category: 'Email Marketing',
    readTime: 'Contact support',
    href: '/contact'
  },
  {
    title: 'Understanding conversion tracking',
    category: 'SuperPixel',
    readTime: 'Contact support',
    href: '/contact'
  },
  {
    title: 'Importing contacts from CSV',
    category: 'CRM & Contacts',
    readTime: 'Contact support',
    href: '/contact'
  },
  {
    title: 'API Authentication Guide',
    category: 'Integrations',
    readTime: 'Contact support',
    href: '/contact'
  },
  {
    title: 'Creating custom audiences',
    category: 'Data Intelligence',
    readTime: 'Contact support',
    href: '/contact'
  }
];

const quickLinks = [
  { title: 'Quick Start Guide', icon: Rocket, href: '/contact' },
  { title: 'Video Tutorials', icon: Video, href: '/contact' },
  { title: 'API Documentation', icon: Code, href: '/contact' },
  { title: 'Support Center', icon: HelpCircle, href: '/contact' }
];

export default function DocsPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'TechArticle',
              headline: 'Senova CRM Documentation',
              description: 'Complete documentation and help resources for Senova CRM platform',
              author: {
                '@type': 'Organization',
                name: 'Senova'
              },
              proficiencyLevel: 'Beginner to Advanced',
              keywords: 'CRM documentation, email marketing help, SuperPixel setup, data intelligence guide, DSP advertising tutorial'
            },
            {
              '@context': 'https://schema.org',
              '@type': 'SiteNavigationElement',
              name: 'Documentation Navigation',
              url: '/docs',
              hasPart: docCategories.map(cat => ({
                '@type': 'WebPage',
                name: cat.title,
                url: cat.href
              }))
            }
          ])
        }}
      />

      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        {/* Gradient Mesh Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Hero Section */}
        <section className="relative py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 mb-6">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/90">Knowledge Base</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                  Documentation Center
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Everything you need to master Senova CRM, from getting started guides to advanced integrations
              </p>
            </div>

            {/* Search Bar with Glassmorphism */}
            <div className="max-w-3xl mx-auto mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <div className="glass-premium rounded-2xl p-1">
                    <div className="flex items-center px-6 py-4 bg-gray-900/50 rounded-xl">
                      <Search className="w-5 h-5 text-gray-400 mr-4" />
                      <input
                        type="text"
                        placeholder="Search documentation..."
                        className="bg-transparent w-full outline-none text-white placeholder-gray-400 text-lg"
                      />
                      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
                        <Command className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium">K</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Getting Started Section - Highlighted */}
            <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative glass-premium rounded-2xl p-8 border border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Start Here</h2>
                      <p className="text-gray-400">New to Senova? Begin your journey with our quick start guide</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-4 gap-4">
                    {quickLinks.map((link) => {
                      const Icon = link.icon
                      return (
                        <Link
                          key={link.title}
                          href={link.href}
                          className="group/link flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 hover:border-yellow-500/30 transition-all duration-200"
                        >
                          <Icon className="w-5 h-5 text-yellow-400 group-hover/link:scale-110 transition-transform" />
                          <span className="text-white group-hover/link:text-yellow-400 transition-colors">{link.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Documentation Categories - Bento Grid */}
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-white mb-8 animate-fade-in">Browse Documentation</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {docCategories.map((category, index) => {
                    const Icon = category.icon
                    return (
                      <Link
                        key={category.title}
                        href={category.href}
                        className="group relative animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div
                          className="absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 rounded-2xl blur-lg transition duration-500"
                          style={{
                            background: `linear-gradient(135deg, ${category.glowColor}, transparent)`
                          }}
                        ></div>
                        <div className="relative glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02]">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`p-3 bg-gradient-to-br ${category.color} rounded-xl shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-300"
                                  style={{
                                    '--tw-gradient-from': category.color.split(' ')[1],
                                    '--tw-gradient-to': category.color.split(' ')[3]
                                  } as any}>
                                {category.title}
                              </h3>
                              <p className="text-gray-400 text-sm mt-1">
                                {category.description}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            {category.articles.slice(0, 3).map((article) => (
                              <div
                                key={article.title}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <span className="text-sm text-gray-300">{article.title}</span>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{article.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                            <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                              {category.articleCount} articles
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-8">
                {/* Popular Articles with Glass Effect */}
                <div className="glass-premium rounded-2xl p-6 border border-white/10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">Popular Articles</h3>
                  </div>
                  <div className="space-y-3">
                    {popularArticles.map((article, index) => (
                      <Link
                        key={article.title}
                        href={article.href}
                        className="group flex items-center justify-between py-3 px-4 rounded-xl bg-gray-800/20 hover:bg-gray-800/40 border border-gray-700/30 hover:border-purple-500/30 transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors truncate">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-700/50 rounded-full">{article.category}</span>
                            <span>{article.readTime}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Need Help Card with Gradient */}
                <div className="relative group animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                  <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
                    <HelpCircle className="w-10 h-10 mb-4" />
                    <h3 className="text-xl font-bold mb-3">Need Help?</h3>
                    <p className="mb-6 text-white/90">
                      Can't find what you're looking for? Our support team is here to help.
                    </p>
                    <div className="space-y-3">
                      <Link
                        href="/contact"
                        className="block w-full px-4 py-3 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 transition-all font-semibold text-center border border-white/20"
                      >
                        Contact Support
                      </Link>
                      <Link
                        href="/contact"
                        className="block w-full px-4 py-3 bg-black/20 backdrop-blur text-white rounded-xl hover:bg-black/30 transition-all font-semibold text-center border border-white/10"
                      >
                        Book Consultation
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Developer Resources with Glass */}
                <div className="glass-premium rounded-2xl p-6 border border-white/10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <Terminal className="w-10 h-10 mb-4 text-green-400" />
                  <h3 className="text-xl font-bold mb-3 text-white">Developer Resources</h3>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/contact" className="flex items-center gap-3 text-gray-300 hover:text-green-400 transition-colors group">
                        <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                          <Key className="w-4 h-4 text-green-400" />
                        </div>
                        <span>Get API Key</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="flex items-center gap-3 text-gray-300 hover:text-green-400 transition-colors group">
                        <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                          <Code className="w-4 h-4 text-green-400" />
                        </div>
                        <span>Code Examples</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="flex items-center gap-3 text-gray-300 hover:text-green-400 transition-colors group">
                        <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                          <Database className="w-4 h-4 text-green-400" />
                        </div>
                        <span>API Reference</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="flex items-center gap-3 text-gray-300 hover:text-green-400 transition-colors group">
                        <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                          <Mail className="w-4 h-4 text-green-400" />
                        </div>
                        <span>Webhook Events</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FAQ Section with Glass Cards */}
            <div className="mt-20">
              <h2 className="text-3xl font-bold text-white mb-8 text-center animate-fade-in">Frequently Asked Questions</h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {[
                  {
                    q: 'How do I get started with Senova CRM?',
                    a: 'Start with our Quick Start Guide which walks you through initial setup, importing contacts, and creating your first campaign in under 30 minutes.'
                  },
                  {
                    q: 'What is SuperPixel and how does it work?',
                    a: 'SuperPixel is our advanced website visitor identification technology that helps you identify anonymous visitors and track their behavior on your website.'
                  },
                  {
                    q: 'Can I import my data from another CRM?',
                    a: 'Absolutely! We support CSV imports and have direct migration tools for popular CRMs like Salesforce, HubSpot, and Mailchimp.'
                  },
                  {
                    q: 'How does Data Intelligence enrich my contacts?',
                    a: 'Our Data Intelligence automatically enriches your contacts with data from 280M+ profiles, adding company info, social profiles, and demographic data.'
                  },
                  {
                    q: 'What integrations are available?',
                    a: 'We integrate with 100+ tools including Zapier, Google Workspace, Facebook, Instagram, Salesforce, and more through our API and webhooks.'
                  },
                  {
                    q: 'Is there an API rate limit?',
                    a: 'Yes, our API allows 1000 requests per hour for Professional plans and unlimited for Enterprise. See our API documentation for details.'
                  }
                ].map((faq, index) => (
                  <div
                    key={index}
                    className="glass-card rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                    <p className="text-gray-400">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA with Gradient */}
        <section className="relative py-20 px-6 mt-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-10"></div>
          <div className="max-w-4xl mx-auto text-center relative">
            <h2 className="text-4xl font-bold text-white mb-6 animate-fade-in">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Start growing with Senova CRM.
            </p>
            <div className="flex gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Link
                href="/contact"
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all font-semibold text-lg transform hover:scale-105"
              >
                Get Started
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 glass-premium text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all font-semibold text-lg"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}