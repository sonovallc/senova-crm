import Link from 'next/link'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import BlogPostClient from './BlogPostClient'
import { Metadata } from 'next'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Hash
} from 'lucide-react'

// Sample blog posts data (in a real app, this would come from an API/database)
const blogPosts: Record<string, {
  id: string
  slug: string
  title: string
  subtitle: string
  excerpt: string
  category: string
  categoryName: string
  author: {
    name: string
    role: string
    bio: string
    avatar: string
    linkedin: string
    twitter: string
  }
  publishedAt: string
  updatedAt: string
  readTime: number
  featuredImage: string
  tags: string[]
  content: {
    sections: Array<{
      id: string
      heading: string
      content: string
      bullets?: string[]
      stats?: Record<string, string | number>
      table?: { headers: string[]; rows: string[][] }
      callout?: { type: string; title: string; content: string }
      roadmap?: Array<{ phase: string; title: string; items: string[] }>
      insights?: Array<{ stat: string; label: string }>
      quote?: { text: string; author: string; role: string }
      timeline?: Array<{ phase: string; tasks: string[] }>
    }>
    keyTakeaways: string[]
  }
  relatedPosts: Array<{ slug: string; title: string; category?: string; readTime?: number; excerpt?: string; image?: string }>
}> = {
  'visitor-identification-roi': {
    id: 'website-visitor-identification-roi-calculator',
    slug: 'visitor-identification-roi',
    title: 'The ROI of Website Visitor Identification: A Comprehensive Guide',
    subtitle: 'How Top B2B Companies Turn Anonymous Traffic into Revenue',
    excerpt: 'We analyzed data from B2B companies using visitor identification. Discover how to increase qualified leads and grow your sales pipeline effectively.',
    category: 'visitor-id',
    categoryName: 'Visitor ID',
    author: {
      name: 'Senova Team',
      role: 'Data Analytics',
      bio: 'Our data science team focuses on developing cutting-edge predictive models for B2B marketing optimization. With extensive experience in machine learning and analytics, we help companies transform their lead generation and scoring processes.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
      linkedin: 'https://linkedin.com/company/senova',
      twitter: 'https://twitter.com/senova',
    },
    publishedAt: '2024-11-28',
    updatedAt: '2024-11-28',
    readTime: 8,
    featuredImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop',
    tags: ['visitor identification', 'ROI', 'lead generation', 'B2B analytics', 'case studies'],
    content: {
      sections: [
        {
          id: 'intro',
          heading: 'Introduction',
          content: `In today's hyper-competitive B2B landscape, the ability to identify and engage anonymous website visitors can make the difference between hitting your revenue targets and falling short. With the vast majority of website visitors leaving without converting, businesses are missing out on massive opportunities.

We conducted a comprehensive study of B2B companies that implemented visitor identification technology. The results demonstrate significant improvements in lead generation and pipeline growth.`
        },
        {
          id: 'hidden-cost',
          heading: 'The Hidden Cost of Anonymous Traffic',
          content: `Every day, hundreds or thousands of potential customers visit your website, browse your products or services, and leave without a trace. Traditional analytics tools tell you how many visited, but not who they were or how to reach them again.

Most B2B websites have low conversion rates, meaning the vast majority of website visitors – people who showed interest in your solution – leave without converting. This represents significant lost opportunity and wasted marketing investment.`,
          bullets: [
            'Most B2B websites have low conversion rates',
            'High cost of visitor acquisition',
            'Significant lost opportunities from anonymous traffic',
            'Substantial revenue impact from missed connections'
          ]
        },
        {
          id: 'study-methodology',
          heading: 'Our Study: B2B Companies Using Visitor Identification',
          content: `We partnered with B2B companies across various industries – from SaaS and technology to professional services and manufacturing. Each company implemented visitor identification technology and tracked key metrics.

The companies ranged across different sizes and industries, with varying levels of website traffic. We tracked conversion rates, lead quality scores, sales cycle length, and revenue attribution to measure the true impact of visitor identification.`,
          stats: {
            industries: 'Multiple',
            duration: 'Ongoing',
            traffic: 'Varies',
            revenue: 'All sizes'
          }
        },
        {
          id: 'results',
          heading: 'The Results: Significant Lead Generation Improvements',
          content: `Companies that implemented visitor identification saw improvements across key metrics:`,
          table: {
            headers: ['Metric', 'Impact'],
            rows: [
              ['Lead Volume', 'Significant increase'],
              ['Lead Quality Score', 'Notable improvement'],
              ['Sales Cycle Length', 'Reduced timeframes'],
              ['Average Deal Size', 'Higher value deals'],
              ['Pipeline Generated', 'Substantial growth']
            ]
          },
          callout: {
            type: 'success',
            title: 'Key Insight',
            content: 'Companies experienced significant pipeline growth and strong ROI on their visitor identification investment.'
          }
        },
        {
          id: 'calculator',
          heading: 'ROI Calculator: What\'s Your Potential?',
          content: `Want to see what visitor identification could mean for your business? Use our interactive calculator to estimate your potential ROI based on your current metrics.`
        },
        {
          id: 'implementation',
          heading: 'Implementation Roadmap: 30-60-90 Day Plan',
          content: `Getting started with visitor identification doesn\'t have to be complicated. Here\'s the proven roadmap our most successful customers follow:`,
          timeline: [
            {
              phase: 'Days 1-30: Foundation',
              tasks: [
                'Install tracking pixel on website',
                'Configure CRM integration',
                'Set up lead scoring rules',
                'Train sales team on new leads'
              ]
            },
            {
              phase: 'Days 31-60: Optimization',
              tasks: [
                'Refine lead scoring based on data',
                'Create targeted outreach sequences',
                'Implement automated workflows',
                'A/B test engagement strategies'
              ]
            },
            {
              phase: 'Days 61-90: Scale',
              tasks: [
                'Expand to additional traffic sources',
                'Integrate with marketing automation',
                'Launch account-based campaigns',
                'Measure and report ROI'
              ]
            }
          ]
        },
        {
          id: 'case-study',
          heading: 'Success Stories: How Companies Use Visitor Identification',
          content: `B2B companies across industries are using visitor identification to transform their lead generation. By identifying anonymous website visitors, companies can focus their outreach on warm prospects who have already shown interest.

The key to success is proper implementation: integrating with existing CRM systems, training sales teams on the new data, and creating targeted outreach sequences for identified visitors.`,
          quote: {
            text: 'Visitor identification transformed our go-to-market strategy. We now know exactly which companies to target based on their website behavior.',
            author: 'Customer Success Team',
            role: 'Senova'
          }
        }
      ],
      keyTakeaways: [
        'Website visitor identification can significantly increase qualified leads',
        'Companies see substantial pipeline growth from implementation',
        'Strong ROI potential from visitor identification technology',
        'Sales cycles can be reduced when targeting identified visitors',
        'Success requires proper implementation, training, and optimization'
      ]
    },
    relatedPosts: [
      {
        slug: 'b2b-programmatic-playbook',
        title: 'The B2B Programmatic Advertising Playbook',
        excerpt: 'Everything you need to know about B2B programmatic advertising.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop'
      },
      {
        slug: 'data-enrichment-automation',
        title: 'Automate or Die: The B2B Data Enrichment Survival Guide',
        excerpt: 'Learn how top B2B companies automate data enrichment.',
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop'
      }
    ]
  },
  'b2b-programmatic-playbook': {
    id: 'programmatic-advertising-b2b-playbook',
    slug: 'b2b-programmatic-playbook',
    title: 'The B2B Programmatic Advertising Playbook: From Zero to DSP Hero',
    subtitle: 'Master B2B programmatic advertising with this comprehensive guide',
    excerpt: 'Everything you need to know about B2B programmatic advertising in 2025. From DSP selection to campaign optimization, this guide covers it all.',
    category: 'programmatic',
    categoryName: 'Programmatic Ads',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop',
      role: 'Marketing',
      bio: 'Our marketing team has extensive experience in B2B marketing and programmatic advertising.',
      linkedin: 'https://linkedin.com/company/senova',
      twitter: 'https://twitter.com/senova'
    },
    publishedAt: '2024-11-26',
    updatedAt: '2024-11-26',
    readTime: 12,
    featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    tags: ['programmatic', 'DSP', 'B2B advertising', 'marketing automation'],
    content: {
      sections: [
        {
          id: 'intro',
          heading: 'Introduction to B2B Programmatic',
          content: 'B2B programmatic advertising has revolutionized how companies reach their target audiences. This comprehensive guide will take you from basics to advanced strategies.'
        }
      ],
      keyTakeaways: [
        'Understand the fundamentals of B2B programmatic advertising',
        'Learn how to select and configure the right DSP',
        'Master audience targeting and segmentation',
        'Optimize campaigns for maximum ROI'
      ]
    },
    relatedPosts: [
      {
        slug: 'visitor-identification-roi',
        title: 'The ROI of Website Visitor Identification',
        excerpt: 'Real numbers from 50 B2B companies.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'
      }
    ]
  },
  'data-enrichment-automation': {
    id: 'b2b-data-enrichment-automation-guide',
    slug: 'data-enrichment-automation',
    title: 'Automate or Die: The B2B Data Enrichment Survival Guide',
    subtitle: 'How to automate data enrichment and accelerate revenue growth',
    excerpt: 'Manual data entry is killing your sales velocity. Learn how top B2B companies automate data enrichment to accelerate revenue growth.',
    category: 'b2b-data',
    categoryName: 'B2B Data',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop',
      role: 'Revenue Operations',
      bio: 'Our team specializes in revenue operations and data automation strategies.',
      linkedin: 'https://linkedin.com/company/senova',
      twitter: 'https://twitter.com/senova'
    },
    publishedAt: '2024-11-24',
    updatedAt: '2024-11-24',
    readTime: 10,
    featuredImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
    tags: ['data enrichment', 'automation', 'RevOps', 'B2B data'],
    content: {
      sections: [
        {
          id: 'intro',
          heading: 'The Data Enrichment Crisis',
          content: 'Every minute your sales team spends on manual data entry is a minute not spent selling. Learn how automation can transform your revenue operations.'
        }
      ],
      keyTakeaways: [
        'Automate data enrichment to save significant time per rep',
        'Improve data accuracy with automated enrichment',
        'Accelerate sales velocity through automation',
        'Reduce cost per lead substantially'
      ]
    },
    relatedPosts: []
  },
  'abm-strategies-that-work': {
    id: 'account-based-marketing-strategies',
    slug: 'abm-strategies-that-work',
    title: '5 Account-Based Marketing Strategies That Actually Work',
    subtitle: 'Proven ABM tactics for increasing deal size and win rates',
    excerpt: 'Learn proven ABM tactics that have helped B2B companies increase deal sizes and improve win rates.',
    category: 'automation',
    categoryName: 'Automation',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop',
      role: 'Account-Based Marketing',
      bio: 'Our ABM experts have a track record of successful enterprise campaigns.',
      linkedin: 'https://linkedin.com/company/senova',
      twitter: 'https://twitter.com/senova'
    },
    publishedAt: '2024-11-24',
    updatedAt: '2024-11-24',
    readTime: 7,
    featuredImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop',
    tags: ['ABM', 'account-based marketing', 'B2B strategy', 'automation'],
    content: {
      sections: [
        {
          id: 'intro',
          heading: 'ABM Success Stories',
          content: 'Account-based marketing has transformed how B2B companies approach their most valuable prospects. These 5 strategies have consistently delivered results.'
        }
      ],
      keyTakeaways: [
        'Focus on quality over quantity with target accounts',
        'Align sales and marketing for coordinated campaigns',
        'Personalize content at scale with automation',
        'Measure success with account-level metrics'
      ]
    },
    relatedPosts: []
  },
  'crm-optimization-best-practices': {
    id: 'crm-optimization-guide',
    slug: 'crm-optimization-best-practices',
    title: 'How Leading Companies Increase Pipeline Growth',
    subtitle: 'A deep dive into data-driven CRM optimization',
    excerpt: 'A deep dive into the data-driven strategies that transform B2B marketing approaches.',
    category: 'crm',
    categoryName: 'CRM',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop',
      role: 'Customer Success',
      bio: 'Our team helps companies optimize their CRM strategies for maximum growth.',
      linkedin: 'https://linkedin.com/company/senova',
      twitter: 'https://twitter.com/senova'
    },
    publishedAt: '2024-11-20',
    updatedAt: '2024-11-20',
    readTime: 10,
    featuredImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop',
    tags: ['CRM', 'pipeline management', 'case study', 'optimization'],
    content: {
      sections: [
        {
          id: 'intro',
          heading: 'The CRM Transformation Success Story',
          content: 'Companies that optimize their CRM processes can see dramatic improvements in pipeline growth and deal size through strategic implementation.'
        }
      ],
      keyTakeaways: [
        'Clean and enrich CRM data for better insights',
        'Implement lead scoring to prioritize efforts',
        'Automate repetitive tasks to free up selling time',
        'Use data to continuously optimize processes'
      ]
    },
    relatedPosts: []
  },
  'intent-data-guide': {
    id: 'intent-data-b2b-success',
    slug: 'intent-data-guide',
    title: 'Intent Data: Your Secret Weapon for B2B Success',
    subtitle: 'How to leverage buyer intent signals effectively',
    excerpt: 'How to leverage buyer intent signals to identify and engage high-value prospects at the right time.',
    category: 'b2b-data',
    categoryName: 'B2B Data',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=40&h=40&fit=crop',
      role: 'Sales Engineering',
      bio: 'Our team specializes in intent data and predictive analytics for B2B sales.',
      linkedin: 'https://linkedin.com/company/senova',
      twitter: 'https://twitter.com/senova'
    },
    publishedAt: '2024-11-18',
    updatedAt: '2024-11-18',
    readTime: 6,
    featuredImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
    tags: ['intent data', 'B2B sales', 'predictive analytics', 'lead generation'],
    content: {
      sections: [
        {
          id: 'intro',
          heading: 'Understanding Intent Data',
          content: 'Intent data reveals which companies are actively researching solutions like yours. Learn how to use these signals to time your outreach perfectly.'
        }
      ],
      keyTakeaways: [
        'Identify companies showing buying intent',
        'Time your outreach for maximum impact',
        'Prioritize accounts based on intent signals',
        'Combine intent data with other data sources'
      ]
    },
    relatedPosts: []
  }
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug: slug,
  }))
}

// Generate metadata for SEO
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const resolvedParams = await params
  const post = blogPosts[resolvedParams.slug]

  if (!post) {
    return {
      title: 'Post Not Found - Senova Blog',
      description: 'The requested blog post was not found.'
    }
  }

  return {
    title: `${post.title} | Senova Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `https://senova.io/blog/${post.slug}`,
      images: [post.featuredImage],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.featuredImage]
    }
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const post = blogPosts[resolvedParams.slug]

  if (!post) {
    notFound()
  }

  // Schema.org structured data
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'alternativeHeadline': post.subtitle,
    'description': post.excerpt,
    'image': {
      '@type': 'ImageObject',
      'url': post.featuredImage,
      'width': 1200,
      'height': 600
    },
    'datePublished': post.publishedAt,
    'dateModified': post.updatedAt,
    'author': {
      '@type': 'Person',
      'name': post.author.name,
      'jobTitle': post.author.role,
      'url': post.author.linkedin
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Senova',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://senova.io/logo.png'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://senova.io/blog/${post.slug}`
    },
    'keywords': post.tags.join(', ')
  }

  return (
    <>
      {/* Schema.org structured data */}
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData)
        }}
      />

      {/* Hero Section with Gradient Mesh and Floating Orbs */}
      <section className="relative min-h-[600px] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black">
        {/* Gradient Mesh Background */}
        <div className="absolute inset-0 gradient-mesh-vibrant opacity-30"></div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

        <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            {/* Back to Blog Link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm text-gray-300 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            {/* Category Badge */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-sm font-medium text-white">
                <Hash className="w-3 h-3" />
                {post.categoryName}
              </span>
            </div>

            {/* Title with Gradient Text */}
            <h1 className="heading-hero mb-6 text-gradient-premium">
              {post.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-300 mb-10 leading-relaxed">
              {post.subtitle}
            </p>

            {/* Author Info Card */}
            <div className="inline-flex items-center gap-4 glass-premium rounded-2xl px-6 py-4 mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-50"></div>
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="relative w-14 h-14 rounded-full ring-2 ring-white/20"
                />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">{post.author.name}</p>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{post.author.role}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime} min read
                  </span>
                </div>
              </div>
            </div>

            {/* Featured Image with Glass Effect */}
            <div className="glass-premium rounded-3xl overflow-hidden animate-scale-in">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pass data to client component for interactive features */}
      <BlogPostClient post={post} />
    </>
  )
}