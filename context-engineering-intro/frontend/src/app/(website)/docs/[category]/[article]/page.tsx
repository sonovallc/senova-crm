import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, BookOpen, Clock, ArrowLeft } from 'lucide-react'

// Generate static params for docs articles
export async function generateStaticParams() {
  // Return some example article paths
  return [
    { category: 'getting-started', article: 'welcome-to-senova' },
    { category: 'getting-started', article: 'account-setup' },
    { category: 'getting-started', article: 'first-contact-import' },
    { category: 'getting-started', article: 'sending-first-campaign' },
    { category: 'getting-started', article: 'understanding-dashboard' },
    { category: 'getting-started', article: 'complete-profile' },
    { category: 'getting-started', article: 'team-setup' },
    { category: 'getting-started', article: 'data-migration' },
    { category: 'getting-started', article: 'initial-configuration' },
    { category: 'email-marketing', article: 'creating-campaigns' },
    { category: 'email-marketing', article: 'email-templates' },
    { category: 'email-marketing', article: 'personalization-tokens' },
    { category: 'email-marketing', article: 'ab-testing' },
    { category: 'email-marketing', article: 'scheduling-sends' },
    { category: 'email-marketing', article: 'autoresponder-basics' },
    { category: 'email-marketing', article: 'trigger-conditions' },
    { category: 'email-marketing', article: 'drip-campaigns' },
    { category: 'email-marketing', article: 'welcome-series' },
    { category: 'email-marketing', article: 'follow-up-sequences' },
    { category: 'email-marketing', article: 'understanding-metrics' },
    { category: 'email-marketing', article: 'open-click-rates' },
    { category: 'email-marketing', article: 'engagement-reports' },
    { category: 'email-marketing', article: 'deliverability-guide' },
    { category: 'superpixel', article: 'superpixel-overview' },
    { category: 'superpixel', article: 'installation-guide' },
    { category: 'superpixel', article: 'wordpress-plugin' },
    { category: 'superpixel', article: 'custom-websites' },
    { category: 'superpixel', article: 'verification-testing' },
    { category: 'superpixel', article: 'visitor-identification' },
    { category: 'superpixel', article: 'company-matching' },
    { category: 'superpixel', article: 'behavior-tracking' },
    { category: 'superpixel', article: 'lead-scoring' },
    { category: 'superpixel', article: 'privacy-compliance' },
    { category: 'superpixel', article: 'real-time-alerts' },
    { category: 'superpixel', article: 'notification-rules' },
    { category: 'superpixel', article: 'sales-triggers' },
    { category: 'superpixel', article: 'engagement-scoring' },
  ]
}

// Generate metadata for SEO
export async function generateMetadata(
  { params }: { params: Promise<{ category: string, article: string }> }
): Promise<Metadata> {
  const resolvedParams = await params

  const title = resolvedParams.article
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    title: `${title} - Senova CRM Documentation`,
    description: `Learn about ${title} in Senova CRM documentation. Step-by-step guides and tutorials.`,
    openGraph: {
      title: `${title} - Senova CRM Documentation`,
      description: `Learn about ${title} in Senova CRM documentation.`,
      type: 'article',
      url: `https://senova.io/docs/${resolvedParams.category}/${resolvedParams.article}`
    }
  }
}

export default async function DocsArticlePage({
  params
}: {
  params: Promise<{ category: string; article: string }>
}) {
  const resolvedParams = await params

  const title = resolvedParams.article
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const categoryTitle = resolvedParams.category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <section className="relative py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm mb-8">
            <Link
              href="/docs"
              className="glass-card px-3 py-1.5 rounded-lg border border-white/10 hover:border-blue-500/30 text-gray-300 hover:text-blue-400 transition-all"
            >
              Documentation
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-500" />
            <Link
              href={`/docs/${resolvedParams.category}`}
              className="glass-card px-3 py-1.5 rounded-lg border border-white/10 hover:border-blue-500/30 text-gray-300 hover:text-blue-400 transition-all"
            >
              {categoryTitle}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-500" />
            <span className="glass-card px-3 py-1.5 rounded-lg border border-white/10 text-white font-medium">
              {title}
            </span>
          </nav>

          {/* Article Header */}
          <div className="glass-premium rounded-2xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <span className="text-sm text-gray-400">{categoryTitle}</span>
              <span className="text-gray-500">•</span>
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                5 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {title}
              </span>
            </h1>
            <p className="text-gray-300 text-lg">
              Learn how to {title.toLowerCase()} in Senova CRM with this comprehensive guide.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed mb-6">
                    This article covers {title.toLowerCase()} in detail. You'll learn the key concepts,
                    step-by-step instructions, and best practices for implementing this in your Senova CRM workflow.
                  </p>

                  <h3 className="text-xl font-semibold text-white mt-8 mb-4">Getting Started</h3>
                  <p className="text-gray-300 mb-4">
                    Before you begin with {title.toLowerCase()}, make sure you have:
                  </p>
                  <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-6">
                    <li>Access to your Senova CRM account</li>
                    <li>The necessary permissions for this feature</li>
                    <li>Any prerequisite setup completed</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mt-8 mb-4">Step-by-Step Guide</h3>
                  <ol className="list-decimal pl-6 text-gray-300 space-y-3 mb-6">
                    <li>Navigate to the relevant section in your Senova dashboard</li>
                    <li>Follow the on-screen instructions to set up {title.toLowerCase()}</li>
                    <li>Configure the settings according to your needs</li>
                    <li>Test the functionality to ensure everything works correctly</li>
                    <li>Monitor the results and adjust as needed</li>
                  </ol>

                  <h3 className="text-xl font-semibold text-white mt-8 mb-4">Best Practices</h3>
                  <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-6">
                    <li>Always test in a development environment first</li>
                    <li>Document your configuration for future reference</li>
                    <li>Regular review and optimize your setup</li>
                    <li>Keep up with updates and new features</li>
                  </ul>

                  <div className="glass-premium rounded-xl p-6 mt-8 border border-blue-500/30">
                    <h4 className="text-lg font-semibold text-blue-400 mb-3">Need More Help?</h4>
                    <p className="text-gray-300 mb-4">
                      If you need additional assistance with {title.toLowerCase()}, our support team is here to help.
                    </p>
                    <div className="flex gap-4">
                      <Link
                        href="/contact"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Contact Support
                      </Link>
                      <Link
                        href="/contact"
                        className="px-4 py-2 glass-card rounded-lg text-gray-300 hover:text-white transition-colors"
                      >
                        Book Consultation
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-6 sticky top-24">
                <h3 className="font-semibold text-white mb-4">Related Articles</h3>
                <div className="space-y-3">
                  <Link
                    href={`/docs/${resolvedParams.category}`}
                    className="block text-sm text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    ← Back to {categoryTitle}
                  </Link>
                  <div className="border-t border-gray-700/50 pt-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">In this section</p>
                    <div className="space-y-2">
                      <Link
                        href="/docs/getting-started/quick-start"
                        className="block text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        Quick Start Guide
                      </Link>
                      <Link
                        href="/docs/getting-started/account-setup"
                        className="block text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        Account Setup
                      </Link>
                      <Link
                        href="/docs/getting-started/first-steps"
                        className="block text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        Your First Steps
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Back to Category */}
          <div className="mt-12 text-center">
            <Link
              href={`/docs/${resolvedParams.category}`}
              className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-xl border border-white/10 hover:border-blue-500/30 text-gray-300 hover:text-blue-400 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back to {categoryTitle}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}