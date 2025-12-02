import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Clock, BookOpen, Search, Filter, ArrowLeft, Sparkles, Tag, TrendingUp, BookMarked } from 'lucide-react'
import { notFound } from 'next/navigation'

// Category configuration
const categoryConfig: Record<string, {
  title: string
  description: string
  icon: any
  color: string
  glowColor: string
  metaTitle: string
  metaDescription: string
  subcategories: {
    id: string
    title: string
    articles: {
      title: string
      slug: string
      description: string
      difficulty: 'beginner' | 'intermediate' | 'advanced'
      timeToComplete: string
    }[]
  }[]
}> = {
  'getting-started': {
    title: 'Getting Started',
    description: 'Quick guides to get up and running with Senova CRM',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    metaTitle: 'Getting Started with Senova CRM - Quick Start Guides & Tutorials',
    metaDescription: 'New to Senova CRM? Start here with our beginner-friendly guides. Learn account setup, contact import, and send your first campaign in under 30 minutes.',
    subcategories: [
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        articles: [
          {
            title: 'Welcome to Senova',
            slug: 'welcome-to-senova',
            description: 'Get familiar with Senova CRM\'s powerful features and learn how to navigate the platform effectively',
            difficulty: 'beginner',
            timeToComplete: '10 min'
          },
          {
            title: 'Account Setup',
            slug: 'account-setup',
            description: 'Configure your account settings, add team members, and customize your workspace',
            difficulty: 'beginner',
            timeToComplete: '5 min'
          },
          {
            title: 'First Contact Import',
            slug: 'first-contact-import',
            description: 'Import your contacts from CSV, Excel, or other CRMs',
            difficulty: 'beginner',
            timeToComplete: '8 min'
          },
          {
            title: 'Sending First Campaign',
            slug: 'sending-first-campaign',
            description: 'Create and send your first email marketing campaign',
            difficulty: 'beginner',
            timeToComplete: '15 min'
          },
          {
            title: 'Understanding Dashboard',
            slug: 'understanding-dashboard',
            description: 'Master the main dashboard and key metrics',
            difficulty: 'beginner',
            timeToComplete: '5 min'
          }
        ]
      },
      {
        id: 'onboarding',
        title: 'Onboarding Checklist',
        articles: [
          {
            title: 'Complete Profile',
            slug: 'complete-profile',
            description: 'Set up your company profile and branding',
            difficulty: 'beginner',
            timeToComplete: '10 min'
          },
          {
            title: 'Team Setup',
            slug: 'team-setup',
            description: 'Add team members and configure permissions',
            difficulty: 'beginner',
            timeToComplete: '12 min'
          },
          {
            title: 'Data Migration',
            slug: 'data-migration',
            description: 'Migrate your data from existing systems',
            difficulty: 'intermediate',
            timeToComplete: '30 min'
          },
          {
            title: 'Initial Configuration',
            slug: 'initial-configuration',
            description: 'Configure essential settings for your organization',
            difficulty: 'beginner',
            timeToComplete: '15 min'
          }
        ]
      }
    ]
  },
  'email-marketing': {
    title: 'Email Marketing',
    description: 'Create and send email campaigns',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    metaTitle: 'Email Marketing Help - Campaigns, Automation & Analytics | Senova',
    metaDescription: 'Create powerful email campaigns with Senova. Learn email design, automation setup, A/B testing, and analyze performance with our email marketing guides.',
    subcategories: [
      {
        id: 'campaigns',
        title: 'Campaigns',
        articles: [
          {
            title: 'Creating Campaigns',
            slug: 'creating-campaigns',
            description: 'Step-by-step guide to creating email campaigns',
            difficulty: 'beginner',
            timeToComplete: '20 min'
          },
          {
            title: 'Email Templates',
            slug: 'email-templates',
            description: 'Design beautiful emails with our template editor',
            difficulty: 'beginner',
            timeToComplete: '15 min'
          },
          {
            title: 'Personalization Tokens',
            slug: 'personalization-tokens',
            description: 'Add dynamic content to personalize emails',
            difficulty: 'intermediate',
            timeToComplete: '10 min'
          },
          {
            title: 'A/B Testing',
            slug: 'ab-testing',
            description: 'Test different versions to optimize performance',
            difficulty: 'intermediate',
            timeToComplete: '12 min'
          },
          {
            title: 'Scheduling Sends',
            slug: 'scheduling-sends',
            description: 'Schedule campaigns for optimal timing',
            difficulty: 'beginner',
            timeToComplete: '5 min'
          }
        ]
      },
      {
        id: 'autoresponders',
        title: 'Autoresponders',
        articles: [
          {
            title: 'Autoresponder Basics',
            slug: 'autoresponder-basics',
            description: 'Set up automated email sequences',
            difficulty: 'intermediate',
            timeToComplete: '15 min'
          },
          {
            title: 'Trigger Conditions',
            slug: 'trigger-conditions',
            description: 'Define when emails should be sent',
            difficulty: 'intermediate',
            timeToComplete: '10 min'
          },
          {
            title: 'Drip Campaigns',
            slug: 'drip-campaigns',
            description: 'Create nurture sequences that convert',
            difficulty: 'intermediate',
            timeToComplete: '20 min'
          },
          {
            title: 'Welcome Series',
            slug: 'welcome-series',
            description: 'Build effective welcome email sequences',
            difficulty: 'beginner',
            timeToComplete: '15 min'
          },
          {
            title: 'Follow-up Sequences',
            slug: 'follow-up-sequences',
            description: 'Automate follow-up communications',
            difficulty: 'intermediate',
            timeToComplete: '12 min'
          }
        ]
      },
      {
        id: 'analytics',
        title: 'Email Analytics',
        articles: [
          {
            title: 'Understanding Metrics',
            slug: 'understanding-metrics',
            description: 'Learn what email metrics mean',
            difficulty: 'beginner',
            timeToComplete: '8 min'
          },
          {
            title: 'Open & Click Rates',
            slug: 'open-click-rates',
            description: 'Improve your email engagement',
            difficulty: 'intermediate',
            timeToComplete: '10 min'
          },
          {
            title: 'Engagement Reports',
            slug: 'engagement-reports',
            description: 'Analyze subscriber engagement patterns',
            difficulty: 'intermediate',
            timeToComplete: '12 min'
          },
          {
            title: 'Deliverability Guide',
            slug: 'deliverability-guide',
            description: 'Ensure your emails reach the inbox',
            difficulty: 'advanced',
            timeToComplete: '15 min'
          }
        ]
      }
    ]
  },
  'superpixel': {
    title: 'SuperPixel',
    description: 'Website visitor identification and tracking',
    icon: BookOpen,
    color: 'from-orange-500 to-red-500',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    metaTitle: 'SuperPixel Setup & Configuration - Website Visitor Tracking | Senova',
    metaDescription: 'Install SuperPixel to identify website visitors. Step-by-step installation guides for WordPress, custom sites, and tag managers. Start tracking in 5 minutes.',
    subcategories: [
      {
        id: 'setup',
        title: 'Installation & Setup',
        articles: [
          {
            title: 'SuperPixel Overview',
            slug: 'superpixel-overview',
            description: 'Understanding SuperPixel and its capabilities',
            difficulty: 'beginner',
            timeToComplete: '5 min'
          },
          {
            title: 'Installation Guide',
            slug: 'installation-guide',
            description: 'Step-by-step installation for any website',
            difficulty: 'beginner',
            timeToComplete: '15 min'
          },
          {
            title: 'WordPress Plugin',
            slug: 'wordpress-plugin',
            description: 'Install SuperPixel on WordPress sites',
            difficulty: 'beginner',
            timeToComplete: '8 min'
          },
          {
            title: 'Custom Websites',
            slug: 'custom-websites',
            description: 'Add SuperPixel to custom HTML sites',
            difficulty: 'intermediate',
            timeToComplete: '10 min'
          },
          {
            title: 'Verification & Testing',
            slug: 'verification-testing',
            description: 'Verify SuperPixel is working correctly',
            difficulty: 'beginner',
            timeToComplete: '5 min'
          }
        ]
      },
      {
        id: 'visitor-tracking',
        title: 'Visitor Tracking',
        articles: [
          {
            title: 'Visitor Identification',
            slug: 'visitor-identification',
            description: 'How SuperPixel identifies visitors',
            difficulty: 'intermediate',
            timeToComplete: '10 min'
          },
          {
            title: 'Company Matching',
            slug: 'company-matching',
            description: 'Match visitors to companies',
            difficulty: 'intermediate',
            timeToComplete: '8 min'
          },
          {
            title: 'Behavior Tracking',
            slug: 'behavior-tracking',
            description: 'Track visitor actions and engagement',
            difficulty: 'intermediate',
            timeToComplete: '12 min'
          },
          {
            title: 'Lead Scoring',
            slug: 'lead-scoring',
            description: 'Score leads based on behavior',
            difficulty: 'advanced',
            timeToComplete: '15 min'
          },
          {
            title: 'Privacy Compliance',
            slug: 'privacy-compliance',
            description: 'GDPR and privacy considerations',
            difficulty: 'intermediate',
            timeToComplete: '10 min'
          }
        ]
      },
      {
        id: 'alerts',
        title: 'Alerts & Notifications',
        articles: [
          {
            title: 'Real-time Alerts',
            slug: 'real-time-alerts',
            description: 'Get notified of important visitor activity',
            difficulty: 'beginner',
            timeToComplete: '12 min'
          },
          {
            title: 'Notification Rules',
            slug: 'notification-rules',
            description: 'Configure when to receive alerts',
            difficulty: 'intermediate',
            timeToComplete: '10 min'
          },
          {
            title: 'Sales Triggers',
            slug: 'sales-triggers',
            description: 'Alert sales team of hot leads',
            difficulty: 'intermediate',
            timeToComplete: '8 min'
          },
          {
            title: 'Engagement Scoring',
            slug: 'engagement-scoring',
            description: 'Score visitors by engagement level',
            difficulty: 'advanced',
            timeToComplete: '12 min'
          }
        ]
      }
    ]
  }
}

// Difficulty badge configuration
const difficultyConfig = {
  beginner: {
    color: 'from-green-400 to-emerald-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Beginner'
  },
  intermediate: {
    color: 'from-yellow-400 to-amber-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Intermediate'
  },
  advanced: {
    color: 'from-red-400 to-pink-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Advanced'
  }
}

// Generate static params for all doc categories
export async function generateStaticParams() {
  return Object.keys(categoryConfig).map((category) => ({
    category: category,
  }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const resolvedParams = await params
  const category = categoryConfig[resolvedParams.category]

  if (!category) {
    return {
      title: 'Category Not Found - Senova CRM Documentation',
      description: 'The requested documentation category was not found.'
    }
  }

  return {
    title: category.metaTitle,
    description: category.metaDescription,
    openGraph: {
      title: category.metaTitle,
      description: category.metaDescription,
      type: 'website',
      url: `https://senova.io/docs/${resolvedParams.category}`
    }
  }
}

export default async function DocsCategoryPage({
  params
}: {
  params: Promise<{ category: string }>
}) {
  const resolvedParams = await params
  const category = categoryConfig[resolvedParams.category]

  if (!category) {
    notFound()
  }

  const totalArticles = category.subcategories.reduce(
    (sum, sub) => sum + sub.articles.length,
    0
  )

  const totalReadTime = category.subcategories.reduce(
    (sum, sub) => sum + sub.articles.reduce(
      (subSum, article) => subSum + parseInt(article.timeToComplete),
      0
    ),
    0
  )

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: `${category.title} Documentation`,
              description: category.description,
              url: `https://senova.io/docs/${resolvedParams.category}`,
              hasPart: category.subcategories.flatMap(sub =>
                sub.articles.map(article => ({
                  '@type': 'TechArticle',
                  name: article.title,
                  url: `/docs/${resolvedParams.category}/${sub.id}/${article.slug}`
                }))
              )
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Documentation',
                  item: '/docs'
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: category.title,
                  item: `/docs/${resolvedParams.category}`
                }
              ]
            }
          ])
        }}
      />

      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        {/* Gradient Mesh Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Header */}
        <section className="relative py-16 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb with Glass Effect */}
            <nav className="flex items-center space-x-2 text-sm mb-8 animate-fade-in">
              <Link
                href="/docs"
                className="glass-card px-3 py-1.5 rounded-lg border border-white/10 hover:border-blue-500/30 text-gray-300 hover:text-blue-400 transition-all"
              >
                Documentation
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <span className="glass-card px-3 py-1.5 rounded-lg border border-white/10 text-white font-medium">
                {category.title}
              </span>
            </nav>

            {/* Category Header with Glass Card */}
            <div className="relative group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div
                className="absolute -inset-1 bg-gradient-to-r rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"
                style={{
                  background: `linear-gradient(135deg, ${category.glowColor}, transparent)`
                }}
              ></div>
              <div className="relative glass-premium rounded-2xl p-8 border border-white/10">
                <div className="flex items-start space-x-4">
                  <div className={`p-4 bg-gradient-to-br ${category.color} rounded-xl shadow-xl`}>
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2">
                      <span className={`bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}>
                        {category.title}
                      </span>
                    </h1>
                    <p className="text-gray-300 text-lg mb-6">{category.description}</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <BookMarked className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">
                          <span className="font-semibold text-white">{totalArticles}</span> articles
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-300">
                          <span className="font-semibold text-white">{Math.ceil(totalReadTime / 60)}</span> hours reading time
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">
                          Popular category
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar with Glass */}
            <div className="flex flex-col md:flex-row gap-4 mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex-1 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative glass-card rounded-xl">
                  <div className="flex items-center px-4 py-3">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                      type="text"
                      placeholder="Search in this category..."
                      className="w-full bg-transparent outline-none text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
              <button className="glass-card px-6 py-3 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all flex items-center gap-2 text-gray-300 hover:text-purple-400 group">
                <Filter className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                <span>Filter by difficulty</span>
              </button>
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            {category.subcategories.map((subcategory, subIndex) => (
              <div key={subcategory.id} className="mb-16">
                <div className="flex items-center gap-3 mb-8 animate-fade-in" style={{ animationDelay: `${subIndex * 0.1}s` }}>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                  <h2 className="text-2xl font-bold text-white px-4">
                    {subcategory.title}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subcategory.articles.map((article, index) => (
                    <Link
                      key={article.slug}
                      href={`/docs/${resolvedParams.category}/${subcategory.id}/${article.slug}`}
                      className="group relative animate-fade-in-up"
                      style={{ animationDelay: `${(subIndex * 3 + index) * 0.05}s` }}
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 rounded-2xl blur opacity-0 group-hover:from-blue-500/30 group-hover:via-purple-500/30 group-hover:to-pink-500/30 group-hover:opacity-100 transition duration-500"></div>
                      <div className="relative glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                            {article.title}
                          </h3>
                          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                        </div>
                        <p className="text-gray-400 text-sm mb-6 flex-1">
                          {article.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyConfig[article.difficulty].bgColor} ${difficultyConfig[article.difficulty].borderColor} border`}>
                            <span className={`bg-gradient-to-r ${difficultyConfig[article.difficulty].color} bg-clip-text text-transparent`}>
                              {difficultyConfig[article.difficulty].label}
                            </span>
                          </span>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs">{article.timeToComplete}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Back to Documentation with Glass Button */}
            <div className="mt-16 text-center animate-fade-in">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-xl border border-white/10 hover:border-blue-500/30 text-gray-300 hover:text-blue-400 transition-all group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Documentation
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}