import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, User, Tag, Search, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | Insights for Growing Your Business | Senova CRM',
  description: 'Expert insights, tips, and strategies for growing your business with CRM automation and intelligent customer data.',
  openGraph: {
    title: 'Blog | Insights for Growing Your Business | Senova CRM',
    description: 'Expert insights, tips, and strategies for growing your business with CRM automation and intelligent customer data.',
  },
};

const blogPosts = [
  {
    id: 1,
    title: '5 Ways CRM Automation Increases Customer Retention',
    excerpt: 'Discover how automated follow-ups, personalized campaigns, and intelligent timing can transform your customer retention rates. Learn proven strategies that successful businesses use to keep customers coming back.',
    author: 'Sarah Johnson',
    date: '2024-01-15',
    readTime: '5 min read',
    category: 'Automation',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    featured: true
  },
  {
    id: 2,
    title: 'The Future of Customer Intelligence in 2024',
    excerpt: 'AI-powered customer insights are revolutionizing how businesses understand and engage their audiences. Explore the latest trends in customer intelligence and what they mean for your business growth.',
    author: 'Michael Chen',
    date: '2024-01-10',
    readTime: '7 min read',
    category: 'Industry Trends',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'
  },
  {
    id: 3,
    title: 'How Medical Spas Are Using Data to Grow Revenue',
    excerpt: 'Real-world case studies from medical spas that increased revenue by 40% using data-driven marketing strategies. Learn their exact playbook for identifying and converting high-value patients.',
    author: 'Dr. Emily Rodriguez',
    date: '2024-01-08',
    readTime: '6 min read',
    category: 'Case Studies',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop'
  },
  {
    id: 4,
    title: 'Getting Started with Email Campaign Automation',
    excerpt: 'A step-by-step guide to setting up your first automated email campaigns. From welcome series to re-engagement campaigns, master the fundamentals of email marketing automation.',
    author: 'James Wilson',
    date: '2024-01-05',
    readTime: '8 min read',
    category: 'Getting Started',
    image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&h=400&fit=crop'
  },
  {
    id: 5,
    title: 'Maximizing ROI with Smart Customer Segmentation',
    excerpt: 'Learn how to divide your customer base into profitable segments and create targeted campaigns that convert. Includes real examples and templates you can use today.',
    author: 'Lisa Thompson',
    date: '2024-01-03',
    readTime: '6 min read',
    category: 'Marketing Strategy',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop'
  },
  {
    id: 6,
    title: 'The Small Business Guide to Affordable Advertising',
    excerpt: 'Stop wasting money on expensive ads that don\'t work. Discover how to reach your ideal customers at wholesale advertising rates and skip the agency markups.',
    author: 'David Park',
    date: '2023-12-28',
    readTime: '5 min read',
    category: 'Advertising',
    image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=400&fit=crop'
  }
];

const categories = [
  { name: 'All Posts', count: 24 },
  { name: 'Getting Started', count: 6 },
  { name: 'Case Studies', count: 5 },
  { name: 'Automation', count: 4 },
  { name: 'Marketing Strategy', count: 4 },
  { name: 'Industry Trends', count: 3 },
  { name: 'Advertising', count: 2 }
];

export default function BlogPage() {
  const featuredPost = blogPosts[0];
  const recentPosts = blogPosts.slice(1);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Insights for Growth
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Expert strategies, industry trends, and success stories to help you grow your business with intelligent customer data and automation.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="h-64 md:h-full">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                    Featured
                  </span>
                  <span className="text-sm text-gray-500">{featuredPost.category}</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-600 mb-6 line-clamp-3">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(featuredPost.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <Link href="#" className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2">
                    Read More
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Blog Posts Grid */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Articles</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {recentPosts.map((post) => (
                  <article key={post.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden group">
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-orange-600 font-semibold uppercase tracking-wider">
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          <span>{post.author}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <Link href="#" className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center gap-1">
                          Read
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Load More Button */}
              <div className="text-center mt-10">
                <button className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                  Load More Articles
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Categories */}
              <div className="bg-white rounded-xl shadow p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
                <ul className="space-y-3">
                  {categories.map((category) => (
                    <li key={category.name}>
                      <Link href="#" className="flex items-center justify-between text-gray-600 hover:text-orange-600 transition-colors">
                        <span>{category.name}</span>
                        <span className="text-sm text-gray-400">({category.count})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl shadow p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Stay Updated</h3>
                <p className="mb-6 opacity-90">
                  Get the latest insights and strategies delivered to your inbox weekly.
                </p>
                <form className="space-y-4">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white"
                  />
                  <button type="submit" className="w-full px-4 py-3 bg-white text-orange-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                    Subscribe
                  </button>
                </form>
                <p className="text-sm mt-4 opacity-75">
                  Join 5,000+ businesses getting weekly insights
                </p>
              </div>

              {/* Popular Tags */}
              <div className="bg-white rounded-xl shadow p-6 mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {['CRM', 'Automation', 'Email Marketing', 'Customer Data', 'ROI', 'Medical Spas', 'Analytics', 'Campaigns'].map((tag) => (
                    <Link
                      key={tag}
                      href="#"
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-orange-100 hover:text-orange-700 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}