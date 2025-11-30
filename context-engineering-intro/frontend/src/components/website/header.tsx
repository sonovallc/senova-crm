'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, ChevronDown, LogIn, Calendar, Sparkles, Users, Brain, Megaphone, BarChart3, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Navigation structure with megamenu dropdowns
const navigation = {
  platform: {
    name: 'Platform',
    icon: Sparkles,
    dropdown: [
      { name: 'Overview', href: '/platform', description: 'Complete platform capabilities', icon: Sparkles },
      { name: 'CRM Features', href: '/solutions/crm', description: 'Customer relationship management', icon: Users },
    ]
  },
  solutions: {
    name: 'Solutions',
    icon: Brain,
    dropdown: [
      { name: 'CRM', href: '/solutions/crm', description: '360° customer management', icon: Users },
      { name: 'Audience Intelligence', href: '/solutions/audience-intelligence', description: 'Data-driven customer insights', icon: Brain },
      { name: 'Patient Identification', href: '/solutions/patient-identification', description: 'Advanced patient matching system', icon: Sparkles },
      { name: 'Visitor Identification', href: '/solutions/visitor-identification', description: 'Identify website visitors', icon: Sparkles },
      { name: 'Campaign Activation', href: '/solutions/campaign-activation', description: 'Multi-channel marketing', icon: Megaphone },
      { name: 'Analytics', href: '/solutions/analytics', description: 'ROI & performance tracking', icon: BarChart3 },
    ]
  },
  industries: {
    name: 'Industries',
    icon: Building2,
    dropdown: [
      { name: 'Medical Spas', href: '/industries/medical-spas', description: 'Complete medspa management platform', icon: Building2 },
      { name: 'Dermatology', href: '/industries/dermatology', description: 'For dermatology practices', icon: Building2 },
      { name: 'Plastic Surgery', href: '/industries/plastic-surgery', description: 'Plastic surgery patient management', icon: Building2 },
      { name: 'Aesthetic Clinics', href: '/industries/aesthetic-clinics', description: 'Aesthetic clinic solutions', icon: Building2 },
      { name: 'Legal & Law Firms', href: '/industries/legal-attorneys', description: 'CRM for attorneys and law firms', icon: Building2 },
      { name: 'Real Estate', href: '/industries/real-estate', description: 'Close more deals with smart lead management', icon: Building2 },
      { name: 'Mortgage & Lending', href: '/industries/mortgage-lending', description: 'Streamline your loan pipeline', icon: Building2 },
      { name: 'Insurance', href: '/industries/insurance', description: 'Maximize retention and cross-sell', icon: Building2 },
      { name: 'Marketing Agencies', href: '/industries/marketing-agencies', description: 'Your secret weapon for client success', icon: Building2 },
      { name: 'Restaurants', href: '/industries/restaurants', description: 'Restaurant management solutions', icon: Building2 },
      { name: 'Home Services', href: '/industries/home-services', description: 'For contractors and service pros', icon: Building2 },
      { name: 'Retail & E-commerce', href: '/industries/retail', description: 'Retail business growth', icon: Building2 },
      { name: 'Professional Services', href: '/industries/professional-services', description: 'For consultants and agencies', icon: Building2 },
    ]
  },
  pricing: {
    name: 'Pricing',
    href: '/pricing',
    dropdown: null
  },
  about: {
    name: 'About',
    href: '/about',
    dropdown: null
  },
  contact: {
    name: 'Contact',
    href: '/contact',
    dropdown: null
  }
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null)
    }

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown])

  const handleDropdownToggle = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveDropdown(activeDropdown === key ? null : key)
  }

  return (
    <>
      {/* Header with glassmorphism effect */}
      <header
        className={cn(
          'fixed top-0 z-50 w-full transition-all duration-500',
          scrolled
            ? 'bg-white/70 dark:bg-senova-dark/70 backdrop-blur-xl shadow-lg border-b border-senova-gray-100/20'
            : 'bg-white/50 dark:bg-senova-dark/50 backdrop-blur-md'
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo with animation */}
          <Link href="/" className="flex items-center group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-senova-accent to-senova-success rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-senova-accent to-senova-success flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 group-hover:rotate-3">
                  <span className="text-senova-dark font-display font-black text-2xl">S</span>
                </div>
              </div>
              <span className="font-display font-bold text-3xl bg-gradient-to-r from-senova-primary to-senova-primary-light bg-clip-text text-transparent">
                Senova
              </span>
            </div>
          </Link>

          {/* Desktop Navigation with Megamenu */}
          <div className="hidden lg:flex lg:items-center lg:gap-x-1">
            {Object.entries(navigation).map(([key, item]) => (
              <div key={key} className="relative">
                {item.dropdown ? (
                  <button
                    onMouseEnter={() => setActiveDropdown(key)}
                    onMouseLeave={() => setActiveDropdown(null)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300',
                      'text-senova-gray-700 hover:text-senova-primary hover:bg-senova-accent/10',
                      activeDropdown === key && 'text-senova-primary bg-senova-accent/10'
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.name}
                    <ChevronDown className={cn(
                      'h-3.5 w-3.5 transition-transform duration-300',
                      activeDropdown === key && 'rotate-180'
                    )} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 text-senova-gray-700 hover:text-senova-primary hover:bg-senova-accent/10"
                  >
                    {item.name}
                  </Link>
                )}

                {/* Megamenu Dropdown with glassmorphism */}
                {item.dropdown && (
                  <div
                    className={cn(
                      'absolute top-full left-0 mt-2 transition-all duration-300 transform origin-top',
                      activeDropdown === key
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    )}
                    onMouseEnter={() => setActiveDropdown(key)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <div className="relative">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-senova-accent/20 to-senova-primary/20 rounded-2xl blur-xl"></div>

                      {/* Content */}
                      <div className="relative min-w-[320px] rounded-2xl bg-white/95 dark:bg-senova-dark/95 backdrop-blur-xl shadow-2xl border border-senova-gray-100/20 overflow-hidden">
                        <div className="p-2">
                          {item.dropdown.map((subItem, index) => (
                            <Link
                              key={`${key}-${subItem.href}-${index}`}
                              href={subItem.href}
                              className={cn(
                                'flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-senova-accent/10 hover:to-senova-primary/10 transition-all duration-300 group',
                                'animate-fade-in',
                              )}
                              style={{ animationDelay: `${index * 50}ms` }}
                              onClick={() => setActiveDropdown(null)}
                            >
                              <div className="mt-0.5 p-2 rounded-lg bg-gradient-to-br from-senova-accent/20 to-senova-primary/20 group-hover:from-senova-accent/30 group-hover:to-senova-primary/30 transition-colors duration-300">
                                {subItem.icon && <subItem.icon className="h-4 w-4 text-senova-primary" />}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-senova-dark group-hover:text-senova-primary transition-colors duration-300">
                                  {subItem.name}
                                </div>
                                <div className="text-xs text-senova-gray-500 mt-0.5">
                                  {subItem.description}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons with animations */}
          <div className="hidden lg:flex lg:items-center lg:gap-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-senova-gray-700 hover:text-senova-electric font-semibold hover:bg-senova-electric/10 transition-all duration-300"
              asChild
            >
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-senova-accent to-senova-success rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Button
                size="sm"
                className="relative gap-2 bg-gradient-to-r from-senova-accent to-senova-success text-senova-dark hover:text-white border-0 font-bold px-6 py-2.5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl"
                asChild
              >
                <Link href="/demo">
                  <Calendar className="h-4 w-4" />
                  Get Demo
                </Link>
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            id="mobile-menu-button"
            data-testid="mobile-menu-button"
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-senova-accent/10 transition-colors duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-senova-dark" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6 text-senova-dark" aria-hidden="true" />
            )}
          </button>
        </nav>

        {/* Mobile menu with slide animation */}
        <div
          id="mobile-menu"
          data-testid="mobile-menu"
          className={cn(
            'lg:hidden fixed inset-x-0 top-[73px] transition-all duration-500 transform',
            mobileMenuOpen
              ? 'translate-y-0 opacity-100'
              : '-translate-y-full opacity-0 pointer-events-none'
          )}
        >
          <div className="bg-white/95 dark:bg-senova-dark/95 backdrop-blur-xl border-t border-senova-gray-100/20 shadow-2xl">
            <div className="px-4 py-4 space-y-1 max-h-[calc(100vh-73px)] overflow-y-auto">
              {Object.entries(navigation).map(([key, item]) => (
                <div key={key}>
                  {item.dropdown ? (
                    <>
                      <button
                        onClick={(e) => handleDropdownToggle(key, e)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-base font-medium text-senova-dark hover:bg-gradient-to-r hover:from-senova-accent/10 hover:to-senova-primary/10 rounded-lg transition-all duration-300"
                      >
                        <span className="flex items-center gap-2">
                          {item.icon && <item.icon className="h-5 w-5" />}
                          {item.name}
                        </span>
                        <ChevronDown className={cn(
                          'h-4 w-4 transition-transform duration-300',
                          activeDropdown === key && 'rotate-180'
                        )} />
                      </button>
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-300',
                          activeDropdown === key ? 'max-h-96' : 'max-h-0'
                        )}
                      >
                        <div className="ml-4 mt-1 space-y-1">
                          {item.dropdown.map((subItem, subIndex) => (
                            <Link
                              key={`mobile-${key}-${subItem.href}-${subIndex}`}
                              href={subItem.href}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-senova-gray-600 hover:text-senova-primary hover:bg-senova-accent/10 rounded-lg transition-all duration-300"
                              onClick={() => {
                                setMobileMenuOpen(false)
                                setActiveDropdown(null)
                              }}
                            >
                              {subItem.icon && <subItem.icon className="h-4 w-4" />}
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="block px-3 py-2.5 text-base font-medium text-senova-dark hover:bg-gradient-to-r hover:from-senova-accent/10 hover:to-senova-primary/10 rounded-lg transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile CTA Buttons */}
              <div className="mt-6 space-y-3 pt-4 border-t border-senova-gray-100">
                <Button
                  variant="outline"
                  className="w-full gap-2 border-senova-primary text-senova-primary hover:bg-senova-primary hover:text-white transition-all duration-300"
                  asChild
                >
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-senova-accent to-senova-success text-senova-dark hover:text-white transition-all duration-300"
                  asChild
                >
                  <Link href="/demo" onClick={() => setMobileMenuOpen(false)}>
                    <Calendar className="h-4 w-4" />
                    Get Demo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[73px]" />
    </>
  )
}