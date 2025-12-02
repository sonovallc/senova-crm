import Link from 'next/link'
import { Linkedin, Twitter, Youtube, Facebook, Mail, MapPin, Shield, Lock, Award, CheckCircle, ChevronRight } from 'lucide-react'

const footerLinks = {
  company: {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ]
  },
  solutions: {
    title: 'Solutions',
    links: [
      { name: 'CRM Platform', href: '/platform' },
      { name: 'Customer Intelligence', href: '/solutions/audience-intelligence' },
      { name: 'Website Visitor Tracking', href: '/solutions/visitor-identification' },
      { name: 'Smart Advertising', href: '/solutions/campaign-activation' },
      { name: 'Analytics Dashboard', href: '/solutions/analytics' },
    ]
  },
  resources: {
    title: 'Resources',
    links: [
      { name: 'Blog', href: '/blog' },
      { name: 'ROI Calculator', href: '/roi-calculator' },
    ]
  },
  industries: {
    title: 'Industries',
    links: [
      { name: 'Medical Spas', href: '/industries/medical-spas' },
      { name: 'Dermatology', href: '/industries/dermatology' },
      { name: 'Plastic Surgery', href: '/industries/plastic-surgery' },
      { name: 'Aesthetic Clinics', href: '/industries/aesthetic-clinics' },
      { name: 'Real Estate', href: '/industries/real-estate' },
      { name: 'Legal & Law Firms', href: '/industries/legal-attorneys' },
      { name: 'Insurance', href: '/industries/insurance' },
      { name: 'Mortgage & Lending', href: '/industries/mortgage-lending' },
      { name: 'Marketing Agencies', href: '/industries/marketing-agencies' },
      { name: 'View All Industries', href: '/industries' },
    ]
  },
  legal: {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'Data Security', href: '/security' },
    ]
  },
}

const socialLinks = [
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/senova' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/senovacrm' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@senovacrm' },
]

const trustBadges = [
  { name: 'Bank-Level Security', icon: Shield },
  { name: 'Privacy First', icon: Award },
  { name: '256-bit Encryption', icon: Lock },
]

export function Footer() {
  return (
    <footer className="relative bg-senova-dark overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-48 w-96 h-96 bg-senova-primary rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 -right-48 w-96 h-96 bg-senova-accent rounded-full filter blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `
            linear-gradient(30deg, transparent 40%, rgba(212, 165, 116, 0.1) 40%, rgba(212, 165, 116, 0.1) 60%, transparent 60%),
            linear-gradient(-30deg, transparent 40%, rgba(15, 23, 42, 0.1) 40%, rgba(15, 23, 42, 0.1) 60%, transparent 60%)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Top Section - Brand and Newsletter */}
        <div className="border-b border-senova-gray-700/30 pb-12 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="animate-fade-in">
              {/* Logo with glow effect */}
              <div className="flex items-center gap-3 mb-6 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-senova-accent to-senova-success rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative h-14 w-14 rounded-xl bg-gradient-to-br from-senova-accent to-senova-success flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                    <span className="text-senova-dark font-display font-black text-3xl">S</span>
                  </div>
                </div>
                <div>
                  <h2 className="font-display font-bold text-3xl bg-gradient-to-r from-senova-accent to-senova-success bg-clip-text text-transparent">
                    Senova
                  </h2>
                  <p className="text-xs text-senova-gray-400 font-body">A subsidiary of Noveris Data, LLC</p>
                </div>
              </div>
              <p className="text-senova-gray-300 font-body font-light max-w-md leading-relaxed">
                Simple, affordable CRM and advertising platform for growing businesses. Get big company marketing tools at small business prices.
              </p>
            </div>

            {/* Newsletter Signup with glassmorphism */}
            <div className="lg:text-right animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h3 className="font-display font-semibold text-xl text-white mb-4">
                Get Marketing Tips That Actually Work
              </h3>
              <p className="text-senova-gray-400 text-sm mb-6 font-body">
                Weekly tips to help you get more customers
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md ml-auto">
                <div className="flex-1 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-senova-accent/20 to-senova-success/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="relative w-full px-4 py-3 bg-senova-gray-800/50 backdrop-blur-sm border border-senova-gray-700/30 text-white rounded-lg placeholder-senova-gray-500 focus:outline-none focus:border-senova-accent/50 transition-colors duration-300 font-body"
                  />
                </div>
                <button className="relative group px-6 py-3 rounded-lg font-medium overflow-hidden transition-all duration-300 hover:scale-105 shadow-lg">
                  <div className="absolute inset-0 bg-senova-electric hover:bg-senova-electric-600 transition-colors duration-300"></div>
                  <span className="relative text-white font-body font-semibold">Subscribe</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Middle Section - Links with hover effects */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {Object.entries(footerLinks).map(([key, section], index) => (
            <div
              key={key}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <h3 className="font-display font-semibold text-white mb-6 relative">
                <span className="relative">
                  {section.title}
                  <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-senova-accent to-transparent"></div>
                </span>
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-senova-gray-400 hover:text-senova-accent transition-colors duration-200 font-body"
                    >
                      <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust Badges with enhanced styling */}
        <div className="border-y border-senova-gray-700/30 py-8 mb-8">
          <div className="flex flex-wrap justify-center gap-8 animate-scale-in">
            {trustBadges.map((badge, index) => {
              const Icon = badge.icon
              return (
                <div
                  key={badge.name}
                  className="group flex items-center gap-3 px-4 py-2 rounded-lg bg-senova-gray-800/30 backdrop-blur-sm border border-senova-gray-700/30 hover:border-senova-accent/30 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-senova-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Icon className="relative w-5 h-5 text-senova-accent" />
                  </div>
                  <span className="text-sm text-senova-gray-300 font-body font-light group-hover:text-white transition-colors duration-300">
                    {badge.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Section - Social and Copyright with enhanced animation */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left animate-fade-in">
            <p className="text-senova-gray-400 text-sm font-body" suppressHydrationWarning>
              © {new Date().getFullYear()} Senova. All rights reserved.
            </p>
            <p className="text-senova-gray-500 text-xs mt-1 font-body">
              Built to help small businesses grow
            </p>
          </div>

          <div className="flex gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {socialLinks.map((social) => {
              const Icon = social.icon
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2.5 rounded-lg bg-senova-gray-800/30 backdrop-blur-sm border border-senova-gray-700/30 hover:border-senova-accent/30 transition-all duration-300 hover:scale-110"
                  aria-label={social.name}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-senova-accent/20 to-senova-success/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Icon className="relative w-4 h-4 text-senova-gray-400 group-hover:text-senova-accent transition-colors duration-300" />
                </a>
              )
            })}
          </div>
        </div>
      </div>

      {/* Decorative gradient line at bottom */}
      <div className="h-px bg-gradient-to-r from-transparent via-senova-accent/50 to-transparent"></div>
    </footer>
  )
}