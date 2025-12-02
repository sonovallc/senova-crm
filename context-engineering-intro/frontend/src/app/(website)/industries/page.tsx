import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Building2, Sparkles, Users, Shield, Target, Briefcase, Home, Store, Utensils, Scale, FileText, TrendingUp, DollarSign, Megaphone, Zap, Rocket, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'

const allIndustries = [
  // Medical Aesthetics
  {
    category: 'Medical Aesthetics',
    categoryIcon: Sparkles,
    featured: true,
    industries: [
      {
        name: 'Medical Spas',
        href: '/industries/medical-spas',
        description: 'Grow your medspa with data intelligence and targeted marketing',
        icon: Sparkles,
        color: 'from-purple-500 to-pink-500',
        image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=600&fit=crop',
        stats: { growth: 'Strong', retention: 'High' }
      },
      {
        name: 'Dermatology',
        href: '/industries/dermatology',
        description: 'Patient acquisition solutions for dermatology practices',
        icon: Shield,
        color: 'from-blue-500 to-teal-500',
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=600&fit=crop',
        stats: { growth: 'Consistent', retention: 'Excellent' }
      },
      {
        name: 'Plastic Surgery',
        href: '/industries/plastic-surgery',
        description: 'Attract qualified cosmetic surgery patients',
        icon: Target,
        color: 'from-indigo-500 to-purple-500',
        image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=600&fit=crop',
        stats: { growth: 'Strong', retention: 'Very High' }
      },
      {
        name: 'Aesthetic Clinics',
        href: '/industries/aesthetic-clinics',
        description: 'Marketing solutions for aesthetic practices',
        icon: Users,
        color: 'from-pink-500 to-rose-500',
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop',
        stats: { growth: 'Excellent', retention: 'High' }
      }
    ]
  },
  // Business Services
  {
    category: 'Business Services',
    categoryIcon: Briefcase,
    industries: [
      {
        name: 'Legal & Law Firms',
        href: '/industries/legal-attorneys',
        description: 'Client acquisition and CRM for attorneys',
        icon: Scale,
        color: 'from-slate-600 to-slate-800',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop',
        stats: { growth: 'Steady', retention: 'Excellent' }
      },
      {
        name: 'Real Estate',
        href: '/industries/real-estate',
        description: 'Lead generation and nurturing for agents',
        icon: Home,
        color: 'from-green-500 to-emerald-500',
        image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
        stats: { growth: 'Strong', retention: 'Good' }
      },
      {
        name: 'Insurance',
        href: '/industries/insurance',
        description: 'Find and retain policyholders with smart data',
        icon: Shield,
        color: 'from-blue-600 to-blue-800',
        image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop',
        stats: { growth: 'Stable', retention: 'Very High' }
      },
      {
        name: 'Mortgage & Lending',
        href: '/industries/mortgage-lending',
        description: 'Loan officer lead generation and pipeline management',
        icon: DollarSign,
        color: 'from-emerald-500 to-green-600',
        image: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&h=600&fit=crop',
        stats: { growth: 'Good', retention: 'High' }
      },
      {
        name: 'Marketing Agencies',
        href: '/industries/marketing-agencies',
        description: 'Data tools to deliver better client results',
        icon: Megaphone,
        color: 'from-orange-500 to-red-500',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
        stats: { growth: 'Rapid', retention: 'Strong' }
      }
    ]
  }
]

export default function IndustriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/20 to-white">
      {/* Enhanced Hero Section with Premium Design */}
      <section className="relative overflow-hidden section-padding">
        {/* Multi-layer Background Effects */}
        <div className="absolute inset-0 gradient-mesh-vibrant opacity-30"></div>
        <div className="absolute inset-0 gradient-bg-mesh opacity-20"></div>
        <div className="absolute inset-0 pattern-bg opacity-5"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-orange-400/20 to-pink-400/20 rounded-full blur-3xl floating"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl floating" style={{ animationDelay: '1s' }}></div>

        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium mb-6 animate-scale-in">
              <Rocket className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-gray-800">13 Industries Supported</span>
            </div>

            <h1 className="heading-hero text-gradient-premium mb-6 animate-fade-in">
              Industries We Transform
            </h1>
            <p className="text-2xl text-gray-700 leading-relaxed font-body max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
              From medical aesthetics to marketing agencies, we deliver enterprise-grade CRM and advertising solutions that drive <span className="font-bold gradient-text">real growth</span>.
            </p>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text-hot mb-2">13</div>
                <div className="text-sm text-gray-600">Industries</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text-hot mb-2">Strong</div>
                <div className="text-sm text-gray-600">Growth</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text-hot mb-2">Positive</div>
                <div className="text-sm text-gray-600">ROI</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Industries Grid with Bento Layout */}
      {allIndustries.map((category, categoryIndex) => (
        <section key={category.category} className={`section-padding ${categoryIndex === 0 ? 'bg-gradient-to-br from-orange-50/50 via-white to-pink-50/30' : categoryIndex === 1 ? 'bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30' : ''}`}>
          <div className="container">
            {/* Enhanced Category Header */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                {category.categoryIcon && (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center animate-scale-in">
                    <category.categoryIcon className="w-6 h-6 text-white" />
                  </div>
                )}
                <h2 className="heading-2 gradient-text animate-slide-up" style={{ animationDelay: `${categoryIndex * 100}ms` }}>
                  {category.category}
                </h2>
              </div>
              {category.featured && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 text-sm font-medium text-gray-700">
                  <Award className="w-4 h-4" />
                  Most Popular
                </div>
              )}
            </div>

            {/* Premium Bento Grid Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${category.industries.length > 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8 max-w-7xl mx-auto`}>
              {category.industries.map((industry, index) => {
                const Icon = industry.icon
                return (
                  <Link
                    key={industry.name}
                    href={industry.href}
                    className="group relative overflow-hidden rounded-3xl gradient-border-animated glass-card glow-card-hover animate-scale-in"
                    style={{ animationDelay: `${(categoryIndex * 100) + (index * 50)}ms` }}
                  >
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                        style={{ backgroundImage: `url(${industry.image})` }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${industry.color} opacity-20 group-hover:opacity-30 transition-opacity duration-500`}></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-8">
                      {/* Top Section with Icon and Stats */}
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${industry.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>

                        {industry.stats && (
                          <div className="text-right">
                            <div className="text-2xl font-bold gradient-text">{industry.stats.growth}</div>
                            <div className="text-xs text-gray-600">Growth</div>
                          </div>
                        )}
                      </div>

                      {/* Text Content */}
                      <h3 className="heading-3 mb-3 group-hover:gradient-text transition-all duration-300">
                        {industry.name}
                      </h3>
                      <p className="text-gray-600 font-body mb-6 leading-relaxed">
                        {industry.description}
                      </p>

                      {/* Bottom Section with CTA and Retention */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-orange-600 font-semibold group-hover:text-orange-700">
                          <span className="underline-animated">Explore solutions</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                        </div>

                        {industry.stats && (
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-700">{industry.stats.retention}</div>
                            <div className="text-xs text-gray-500">Retention</div>
                          </div>
                        )}
                      </div>

                      {/* Hover Effect Line */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Enhanced CTA Section with Modern Design */}
      <section className="relative section-padding overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-pink-600 to-purple-600"></div>
        <div className="absolute inset-0 gradient-mesh-cool opacity-40"></div>

        {/* Floating Orbs */}
        <div className="absolute top-10 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl floating"></div>
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }}></div>

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md mb-6 animate-scale-in">
              <Zap className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Start Growing Today</span>
            </div>

            <h2 className="heading-hero text-white mb-6 animate-fade-in glow-text-hot">
              Ready to 10X Your Business?
            </h2>
            <p className="text-2xl text-white/90 mb-12 font-body max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
              Start using Senova to compete with industry giants at a fraction of the cost.
            </p>

            {/* CTA Buttons with Glass Effect */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-scale-in" style={{ animationDelay: '200ms' }}>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold text-lg hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-white/20"
              >
                Get Your Free Demo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </Link>

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl glass-premium border border-white/30 text-white font-bold text-lg hover:scale-105 transition-all duration-300 hover:bg-white/10"
              >
                View Pricing Plans
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-2 text-white/80">
                <Shield className="w-5 h-5" />
                <span className="text-sm">No Setup Fees</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Award className="w-5 h-5" />
                <span className="text-sm">Free Training</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Users className="w-5 h-5" />
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}