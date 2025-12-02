'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Check,
  CheckCircle2,
  Twitter,
  Linkedin,
  Link2,
  BookOpen,
  Hash,
  ChevronUp,
  Sparkles,
  Mail
} from 'lucide-react'

interface BlogPostClientProps {
  post: any
}

export default function BlogPostClient({ post }: BlogPostClientProps) {
  const [activeSection, setActiveSection] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Show scroll to top button
      setShowScrollTop(window.scrollY > 500)

      // Update active section for table of contents
      const sections = post.content.sections.map((s: any) => s.id)
      const current = sections.find((section: string) => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          return rect.top >= 0 && rect.top <= 200
        }
        return false
      })
      if (current) {
        setActiveSection(current)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [post])

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Article Content with Glass Sidebar */}
      <section className="relative px-4 py-20">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-4 gap-12">

            {/* Table of Contents - Glass Sidebar */}
            <aside className="lg:col-span-1">
              <div className="glass-premium rounded-2xl p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-6 text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Table of Contents
                </h3>
                <nav className="space-y-3">
                  {post.content.sections.map((section: any) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`block pl-4 border-l-2 transition-all duration-300 ${
                        activeSection === section.id
                          ? 'border-indigo-400 text-indigo-400 font-medium'
                          : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                      }`}
                    >
                      <span className="block text-sm">{section.heading}</span>
                    </a>
                  ))}
                  <a
                    href="#key-takeaways"
                    className={`block pl-4 border-l-2 transition-all duration-300 ${
                      activeSection === 'key-takeaways'
                        ? 'border-indigo-400 text-indigo-400 font-medium'
                        : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    <span className="block text-sm">Key Takeaways</span>
                  </a>
                </nav>

                {/* Share Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <p className="text-sm font-semibold mb-4 text-white">Share Article</p>
                  <div className="flex gap-3">
                    <button className="glass-card w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-500/20 transition-colors group">
                      <Twitter className="w-5 h-5 text-gray-400 group-hover:text-indigo-400" />
                    </button>
                    <button className="glass-card w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-500/20 transition-colors group">
                      <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-indigo-400" />
                    </button>
                    <button className="glass-card w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-500/20 transition-colors group">
                      <Link2 className="w-5 h-5 text-gray-400 group-hover:text-indigo-400" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <p className="text-sm font-semibold mb-4 text-white">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="glass-card px-3 py-1 rounded-lg text-xs text-gray-400">
                        #{tag.replace(/\s+/g, '')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <article className="lg:col-span-3 space-y-8">
              {post.content.sections.map((section: any, idx: number) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="glass-card rounded-2xl p-8 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
                    <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    {section.heading}
                  </h2>

                  <div className="prose prose-invert prose-lg max-w-none">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>

                    {/* Bullets with gradient icons */}
                    {section.bullets && (
                      <ul className="space-y-3 mt-6">
                        {section.bullets.map((bullet: string, bulletIdx: number) => (
                          <li key={bulletIdx} className="flex items-start gap-3">
                            <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-gray-300">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Stats Grid */}
                    {section.stats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        {Object.entries(section.stats).map(([key, value]) => (
                          <div key={key} className="glass-premium rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                              {String(value)}
                            </p>
                            <p className="text-sm text-gray-400 mt-1 capitalize">{key.replace(/_/g, ' ')}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Table with glassmorphism */}
                    {section.table && (
                      <div className="overflow-x-auto mt-8">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-indigo-500/30">
                              {section.table.headers.map((header: string, idx: number) => (
                                <th key={idx} className="text-left py-3 px-4 text-white font-semibold">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {section.table.rows.map((row: string[], rowIdx: number) => (
                              <tr key={rowIdx} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                {row.map((cell: string, cellIdx: number) => (
                                  <td key={cellIdx} className="py-3 px-4">
                                    {cellIdx === row.length - 1 && (cell.startsWith('+') || cell.startsWith('-')) ? (
                                      <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                                        {cell}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">{cell}</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Callout Box with gradient border */}
                    {section.callout && (
                      <div className="mt-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-sm opacity-50"></div>
                        <div className="relative glass-premium rounded-2xl p-6 border border-indigo-500/30">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-indigo-400 mb-2">{section.callout.title}</p>
                              <p className="text-gray-300">{section.callout.content}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    {section.timeline && (
                      <div className="space-y-8 mt-8">
                        {section.timeline.map((phase: any, phaseIdx: number) => (
                          <div key={phaseIdx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
                                {phaseIdx + 1}
                              </div>
                              {phaseIdx < section.timeline!.length - 1 && (
                                <div className="w-0.5 h-full bg-gradient-to-b from-indigo-500 to-purple-600 mt-2"></div>
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <h3 className="font-semibold text-white mb-3">{phase.phase}</h3>
                              <div className="glass-card rounded-xl p-4 space-y-2">
                                {phase.tasks.map((task: string, taskIdx: number) => (
                                  <div key={taskIdx} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300 text-sm">{task}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quote */}
                    {section.quote && (
                      <blockquote className="mt-8 glass-premium rounded-2xl p-6 border-l-4 border-indigo-500">
                        <div className="flex gap-4">
                          <div className="text-6xl text-indigo-500/30 leading-none">"</div>
                          <div>
                            <p className="text-xl text-gray-200 italic mb-4">
                              {section.quote.text}
                            </p>
                            <cite className="flex items-center gap-2 not-italic">
                              <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                              <span className="text-sm text-gray-400">
                                {section.quote.author}, {section.quote.role}
                              </span>
                            </cite>
                          </div>
                        </div>
                      </blockquote>
                    )}
                  </div>
                </div>
              ))}

              {/* Key Takeaways Section */}
              <div
                id="key-takeaways"
                className="glass-premium rounded-2xl p-8 border border-indigo-500/30"
              >
                <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  Key Takeaways
                </h2>
                <div className="space-y-3">
                  {post.content.keyTakeaways.map((takeaway: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 glass-card rounded-xl p-4">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-300">{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Author Bio Box */}
              <div className="glass-premium rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6 text-white">About the Author</h3>
                <div className="flex gap-6">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-md opacity-50"></div>
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="relative w-24 h-24 rounded-2xl ring-2 ring-white/20"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xl mb-1 text-white">{post.author.name}</h4>
                    <p className="text-indigo-400 mb-3">{post.author.role} at Senova</p>
                    <p className="text-gray-400 mb-4">
                      {post.author.bio}
                    </p>
                    <div className="flex gap-4">
                      <a href={post.author.linkedin} className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                      <a href={post.author.twitter} className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="relative rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
                <div className="absolute inset-0 gradient-mesh-vibrant opacity-30"></div>
                <div className="relative p-8 lg:p-12 text-center">
                  <h3 className="text-3xl font-bold mb-4 text-white">
                    Ready to Transform Your Lead Generation?
                  </h3>
                  <p className="text-xl text-white/90 mb-8">
                    See how Senova's visitor identification platform can help you identify
                    <br className="hidden md:block" />
                    and convert high-value prospects.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/contact"
                      className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold hover:bg-white/90 transition-all duration-300 hover:shadow-glow"
                    >
                      Book Consultation
                    </Link>
                    <Link
                      href="/resources/roi-calculator"
                      className="px-8 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl font-bold text-white hover:bg-white/30 transition-all"
                    >
                      Calculate Your ROI
                    </Link>
                  </div>
                </div>
              </div>

              {/* Related Posts */}
              <div>
                <h2 className="text-2xl font-bold mb-8 text-white">Related Articles</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {post.relatedPosts.map((relatedPost: any, idx: number) => (
                    <article
                      key={relatedPost.slug}
                      className="glass-card rounded-2xl overflow-hidden group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="h-48 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                        <img
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold mb-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all">
                          <Link href={`/blog/${relatedPost.slug}`}>
                            {relatedPost.title}
                          </Link>
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                        <div className="mt-4 flex items-center text-indigo-400 text-sm font-medium">
                          <span>Read More</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-glow hover:scale-110 transition-transform z-50"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900"></div>
            <div className="absolute inset-0 gradient-mesh-cool opacity-30"></div>

            <div className="relative z-10 p-12 lg:p-16 text-center">
              <div className="max-w-3xl mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-8 mx-auto animate-float">
                  <Mail className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
                  Never Miss an Insight
                </h2>

                <p className="text-xl text-white/90 mb-10">
                  Join B2B marketers getting weekly data-driven insights
                  <br className="hidden md:block" />
                  delivered straight to their inbox.
                </p>

                <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="flex-1 px-6 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl outline-none focus:border-white/50 transition-colors text-white placeholder-white/70 text-lg"
                  />
                  <button className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold hover:shadow-glow transition-all duration-300">
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}