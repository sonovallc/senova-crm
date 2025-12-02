'use client'

import { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image';
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Database,
  Target,
  Zap,
  Users,
  LineChart,
  Sparkles,
  User,
  BookOpen,
  ChevronRight,
  Mail,
  Check
} from 'lucide-react';

// Blog categories from schema
const categories = [
  { id: 'all', name: 'All Posts', color: '', gradient: 'from-indigo-500 to-purple-600' },
  { id: 'b2b-data', name: 'B2B Data', color: 'from-blue-500/20 to-cyan-500/20 border-blue-400/30', gradient: 'from-blue-500 to-cyan-500', icon: Database },
  { id: 'programmatic', name: 'Programmatic Ads', color: 'from-purple-500/20 to-pink-500/20 border-purple-400/30', gradient: 'from-purple-500 to-pink-500', icon: Target },
  { id: 'visitor-id', name: 'Visitor ID', color: 'from-red-500/20 to-orange-500/20 border-red-400/30', gradient: 'from-red-500 to-orange-500', icon: Users },
  { id: 'automation', name: 'Automation', color: 'from-green-500/20 to-emerald-500/20 border-green-400/30', gradient: 'from-green-500 to-emerald-500', icon: Zap },
  { id: 'crm', name: 'CRM', color: 'from-orange-500/20 to-yellow-500/20 border-orange-400/30', gradient: 'from-orange-500 to-yellow-500', icon: LineChart },
];

// Sample blog posts data - aligned with research
const blogPosts = [
  {
    id: 'website-visitor-identification-roi-calculator',
    slug: 'visitor-identification-roi',
    title: 'The ROI of Website Visitor Identification: A Comprehensive Guide',
    excerpt: 'We analyzed data from B2B companies using visitor identification. Discover how to increase qualified leads and grow your sales pipeline effectively.',
    category: 'visitor-id',
    categoryName: 'Visitor ID',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop',
      role: 'Data Analytics',
    },
    date: '2024-11-28',
    readTime: 8,
    featured: true,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
  },
  {
    id: 'programmatic-advertising-b2b-playbook',
    slug: 'b2b-programmatic-playbook',
    title: 'The B2B Programmatic Advertising Playbook: From Zero to DSP Hero',
    excerpt: 'Everything you need to know about B2B programmatic advertising in 2025. From DSP selection to campaign optimization, this guide covers it all.',
    category: 'programmatic',
    categoryName: 'Programmatic Ads',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop',
      role: 'Marketing',
    },
    date: '2024-11-26',
    readTime: 12,
    featured: false,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  },
  {
    id: 'b2b-data-enrichment-automation-guide',
    slug: 'data-enrichment-automation',
    title: 'Automate or Die: The B2B Data Enrichment Survival Guide',
    excerpt: 'Manual data entry is killing your sales velocity. Learn how top B2B companies automate data enrichment to accelerate revenue growth.',
    category: 'b2b-data',
    categoryName: 'B2B Data',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop',
      role: 'Revenue Operations',
    },
    date: '2024-11-24',
    readTime: 10,
    featured: false,
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
  },
  {
    id: 'account-based-marketing-strategies',
    slug: 'abm-strategies-that-work',
    title: '5 Account-Based Marketing Strategies That Actually Work',
    excerpt: 'Learn proven ABM tactics that have helped B2B companies increase deal sizes and improve win rates.',
    category: 'automation',
    categoryName: 'Automation',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop',
      role: 'Account-Based Marketing',
    },
    date: '2024-11-24',
    readTime: 7,
    featured: false,
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop',
  },
  {
    id: 'crm-optimization-guide',
    slug: 'crm-optimization-best-practices',
    title: 'How Leading Companies Increase Pipeline Growth',
    excerpt: 'A deep dive into the data-driven strategies that transform B2B marketing approaches.',
    category: 'crm',
    categoryName: 'CRM',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop',
      role: 'Customer Success',
    },
    date: '2024-11-20',
    readTime: 10,
    featured: false,
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop',
  },
  {
    id: 'intent-data-b2b-success',
    slug: 'intent-data-guide',
    title: 'Intent Data: Your Secret Weapon for B2B Success',
    excerpt: 'How to leverage buyer intent signals to identify and engage high-value prospects at the right time.',
    category: 'b2b-data',
    categoryName: 'B2B Data',
    author: {
      name: 'Senova Team',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=40&h=40&fit=crop',
      role: 'Sales Engineering',
    },
    date: '2024-11-18',
    readTime: 6,
    featured: false,
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop',
  },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter posts based on category and search
  const filteredPosts = blogPosts.filter(post => {
    const categoryMatch = selectedCategory === 'all' || post.category === selectedCategory;
    const searchMatch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Get featured post
  const featuredPost = blogPosts.find(post => post.featured);

  // Schema.org structured data
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': 'Senova B2B Marketing Blog',
    'description': 'Expert insights on B2B data intelligence, programmatic advertising, and marketing automation',
    'url': 'https://senova.io/blog',
    'publisher': {
      '@type': 'Organization',
      'name': 'Senova',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://senova.io/logo.png'
      }
    },
    'blogPost': filteredPosts.map(post => ({
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': post.excerpt,
      'datePublished': post.date,
      'author': {
        '@type': 'Person',
        'name': post.author.name
      },
      'url': `https://senova.io/blog/${post.slug}`
    }))
  };

  return (
    <>
      {/* Schema.org structured data */}
      <Script
        id="blog-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData)
        }}
      />

      {/* Hero Section with Gradient Mesh */}
      <section className="relative min-h-[500px] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black">
        {/* Gradient Mesh Background */}
        <div className="absolute inset-0 gradient-mesh-vibrant opacity-40"></div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 right-1/3 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

        <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-gray-300">Knowledge Hub</span>
            </div>

            <h1 className="heading-hero mb-6">
              <span className="text-gradient-premium">
                Senova Insights
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Data-driven strategies, marketing intelligence, and industry insights
              <br className="hidden md:block" />
              to transform your B2B marketing performance
            </p>

            {/* Search Bar with Glass Effect */}
            <div className="max-w-2xl mx-auto">
              <div className="glass-premium rounded-2xl p-1">
                <div className="flex items-center px-6 py-4">
                  <Search className="w-5 h-5 text-indigo-400 mr-4" />
                  <input
                    type="text"
                    placeholder="Search insights, strategies, guides..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none flex-1 text-white placeholder-gray-400 text-lg"
                  />
                  <div className="ml-4 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white font-medium cursor-pointer hover:shadow-glow transition-all">
                    Search
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-8 max-w-md mx-auto mt-12">
              {[
                { label: 'Topics', value: 'B2B Marketing', icon: BookOpen },
                { label: 'Avg. Reading Time', value: '8 min', icon: Clock }
              ].map((stat, idx) => (
                <div key={idx} className="glass-card rounded-xl p-4 animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <stat.icon className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-white glow-text">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Pills with Gradient Active States */}
      <section className="relative -mt-8 z-20 px-4 mb-16">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-wrap justify-center gap-3 stagger-children">
            {categories.map((category, idx) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`group relative px-6 py-3 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? `bg-gradient-to-r ${category.gradient} text-white shadow-glow`
                      : 'glass-card hover:glass-card-hover text-gray-300 hover:text-white'
                  }`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />}
                    {category.name}
                  </div>
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-20 blur-lg -z-10"
                         style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Post as Large Glass Card */}
      {featuredPost && selectedCategory === 'all' && (
        <section className="px-4 mb-20">
          <div className="container mx-auto max-w-7xl">
            <div className="glass-premium rounded-3xl overflow-hidden group hover:shadow-glow transition-all duration-500 animate-fade-in">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="relative h-80 lg:h-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-6 left-6 z-20">
                    <span className="glass-card px-4 py-2 rounded-full text-sm font-medium text-white backdrop-blur-md">
                      <Sparkles className="w-4 h-4 inline mr-2 text-yellow-400" />
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${
                    categories.find(c => c.id === featuredPost.category)?.gradient || 'from-indigo-500 to-purple-600'
                  } bg-opacity-20 backdrop-blur-sm w-fit mb-6`}>
                    {categories.find(c => c.id === featuredPost.category)?.icon && (
                      <>{(() => {
                        const Icon = categories.find(c => c.id === featuredPost.category)?.icon;
                        return Icon && <Icon className="w-4 h-4 text-white" />;
                      })()}</>
                    )}
                    <span className="text-sm font-medium text-white">{featuredPost.categoryName}</span>
                  </div>

                  <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                    <Link href={`/blog/${featuredPost.slug}`} className="text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-400 hover:to-purple-400 transition-all duration-300">
                      {featuredPost.title}
                    </Link>
                  </h2>

                  <p className="text-gray-300 text-lg mb-8 line-clamp-3">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-md opacity-50"></div>
                        <img
                          src={featuredPost.author.avatar}
                          alt={featuredPost.author.name}
                          className="relative w-12 h-12 rounded-full ring-2 ring-white/20"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{featuredPost.author.name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span>{featuredPost.author.role}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {featuredPost.readTime} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${featuredPost.slug}`}
                      className="group/btn flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white font-medium hover:shadow-glow transition-all duration-300"
                    >
                      Read Article
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Cards in Bento Grid */}
      <section className="px-4 mb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="bento-grid bento-grid-3 stagger-children">
            {filteredPosts.filter(post => !post.featured || selectedCategory !== 'all').map((post, idx) => {
              const categoryConfig = categories.find(c => c.id === post.category);
              return (
                <article
                  key={post.id}
                  className="glass-card rounded-2xl overflow-hidden group hover:shadow-glow transition-all duration-500 hover:-translate-y-2"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute bottom-4 left-4 z-20">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${
                        categoryConfig?.gradient || 'from-indigo-500 to-purple-600'
                      } bg-opacity-90 backdrop-blur-sm text-xs font-medium text-white`}>
                        {categoryConfig?.icon && (
                          <>{(() => {
                            const Icon = categoryConfig.icon;
                            return <Icon className="w-3 h-3" />;
                          })()}</>
                        )}
                        {post.categoryName}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 line-clamp-2">
                      <Link href={`/blog/${post.slug}`} className="text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-400 hover:to-purple-400 transition-all duration-300">
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-8 h-8 rounded-full ring-2 ring-white/10"
                        />
                        <div>
                          <p className="text-xs font-medium text-white">{post.author.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{post.readTime} min</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Load More Button */}
          <div className="flex justify-center mt-16">
            <button className="group px-8 py-4 glass-premium rounded-2xl font-medium text-white hover:shadow-glow transition-all duration-300 flex items-center gap-3">
              Load More Articles
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA with Gradient Background */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-90"></div>
            <div className="absolute inset-0 gradient-mesh-vibrant opacity-30"></div>

            {/* Floating Elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 p-12 lg:p-16 text-center">
              <div className="max-w-3xl mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-8 mx-auto animate-float">
                  <Mail className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
                  Stay Ahead of the Curve
                </h2>

                <p className="text-xl text-white/90 mb-10">
                  Get weekly insights on B2B marketing trends, data strategies,
                  <br className="hidden md:block" />
                  and growth tactics delivered straight to your inbox.
                </p>

                <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="flex-1 px-6 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl outline-none focus:border-white/50 transition-colors text-white placeholder-white/70 text-lg"
                  />
                  <button className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold hover:bg-white/90 transition-all duration-300 hover:shadow-glow">
                    Subscribe Now
                  </button>
                </form>

                <div className="flex items-center justify-center gap-8 mt-8 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>No spam, ever</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Unsubscribe anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Subscribe to our updates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}