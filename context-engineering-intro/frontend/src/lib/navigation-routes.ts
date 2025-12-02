/**
 * Navigation Routes Configuration for Senova CRM
 * Maps all SEO pages to their respective routes
 */

export interface Route {
  name: string
  path: string
  description?: string
  category?: 'main' | 'platform' | 'industries' | 'resources' | 'legal' | 'company'
  priority?: number
  seoPage?: string // Reference to SEO page JSON file
}

export const routes: Route[] = [
  // Main Pages
  { name: 'Home', path: '/', category: 'main', priority: 1.0, seoPage: 'home.json' },
  { name: 'Platform', path: '/platform', category: 'main', priority: 0.9, seoPage: 'platform.json' },
  { name: 'Pricing', path: '/pricing', category: 'main', priority: 0.9, seoPage: 'pricing.json' },
  { name: 'About', path: '/about', category: 'company', priority: 0.7, seoPage: 'about.json' },
  { name: 'Contact', path: '/contact', category: 'company', priority: 0.8, seoPage: 'contact.json' },
  { name: 'Login', path: '/login', category: 'main', priority: 0.5 },
  { name: 'Consultation', path: '/demo', category: 'main', priority: 0.9 },

  // Platform/Solutions Pages
  { name: 'CRM', path: '/solutions/crm', category: 'platform', priority: 0.8, seoPage: 'solutions-crm.json', description: 'Customer relationship management' },
  { name: 'Audience Intelligence', path: '/solutions/audience-intelligence', category: 'platform', priority: 0.8, seoPage: 'solutions-audience-intelligence.json', description: 'Build targeted audiences' },
  { name: 'Visitor Identification', path: '/solutions/visitor-identification', category: 'platform', priority: 0.8, seoPage: 'solutions-visitor-identification.json', description: 'Identify website visitors' },
  { name: 'Campaign Activation', path: '/solutions/campaign-activation', category: 'platform', priority: 0.8, seoPage: 'solutions-campaign-activation.json', description: 'Multi-channel campaigns' },
  { name: 'Analytics', path: '/solutions/analytics', category: 'platform', priority: 0.8, seoPage: 'solutions-analytics.json', description: 'ROI & performance tracking' },

  // Industries Landing Page
  { name: 'Industries', path: '/industries', category: 'industries', priority: 0.9, description: 'All industry solutions' },

  // Industry Pages - Medical Aesthetics
  { name: 'Medical Spas', path: '/industries/medical-spas', category: 'industries', priority: 0.8, seoPage: 'industries-medical-spas.json', description: 'Complete medspa management platform' },
  { name: 'Dermatology', path: '/industries/dermatology', category: 'industries', priority: 0.8, seoPage: 'industries-dermatology.json', description: 'For dermatology practices' },
  { name: 'Plastic Surgery', path: '/industries/plastic-surgery', category: 'industries', priority: 0.8, seoPage: 'industries-plastic-surgery.json', description: 'Plastic surgery patient management' },
  { name: 'Aesthetic Clinics', path: '/industries/aesthetic-clinics', category: 'industries', priority: 0.8, seoPage: 'industries-aesthetic-clinics.json', description: 'Aesthetic clinic solutions' },

  // Industry Pages - Business Services
  { name: 'Legal & Law Firms', path: '/industries/legal-attorneys', category: 'industries', priority: 0.8, seoPage: 'industries-legal-attorneys.json', description: 'CRM for attorneys and law firms' },
  { name: 'Real Estate', path: '/industries/real-estate', category: 'industries', priority: 0.8, seoPage: 'industries-real-estate.json', description: 'Close more deals with smart lead management' },
  { name: 'Mortgage & Lending', path: '/industries/mortgage-lending', category: 'industries', priority: 0.8, seoPage: 'industries-mortgage-lending.json', description: 'Streamline your loan pipeline' },
  { name: 'Insurance', path: '/industries/insurance', category: 'industries', priority: 0.8, seoPage: 'industries-insurance.json', description: 'Maximize retention and cross-sell' },
  { name: 'Marketing Agencies', path: '/industries/marketing-agencies', category: 'industries', priority: 0.8, seoPage: 'industries-marketing-agencies.json', description: 'Your secret weapon for client success' },


  // Resource Pages
  { name: 'Blog', path: '/blog', category: 'resources', priority: 0.7, description: 'Latest insights and trends' },
  { name: 'ROI Calculator', path: '/roi-calculator', category: 'resources', priority: 0.7, description: 'Calculate your ROI' },

  // Legal Pages
  { name: 'Privacy Policy', path: '/privacy-policy', category: 'legal', priority: 0.5, seoPage: 'privacy-policy.json' },
  { name: 'Terms of Service', path: '/terms-of-service', category: 'legal', priority: 0.5, seoPage: 'terms-of-service.json' },
  { name: 'Security', path: '/security', category: 'legal', priority: 0.6, seoPage: 'security.json', description: 'Security & privacy' },

  // Company Pages
  { name: 'Careers', path: '/careers', category: 'company', priority: 0.6 },
  { name: 'Press', path: '/press', category: 'company', priority: 0.5 },
]

/**
 * Get routes by category
 */
export function getRoutesByCategory(category: Route['category']): Route[] {
  return routes.filter(route => route.category === category)
}

/**
 * Get route by path
 */
export function getRouteByPath(path: string): Route | undefined {
  return routes.find(route => route.path === path)
}

/**
 * Check if a path exists in our routes
 */
export function isValidRoute(path: string): boolean {
  return routes.some(route => route.path === path)
}

/**
 * Get all routes that have SEO pages
 */
export function getSeoRoutes(): Route[] {
  return routes.filter(route => route.seoPage)
}

/**
 * Generate breadcrumbs for a given path
 */
export function generateBreadcrumbs(path: string): { name: string; path: string }[] {
  const breadcrumbs: { name: string; path: string }[] = [
    { name: 'Home', path: '/' }
  ]

  if (path === '/') return []

  const segments = path.split('/').filter(Boolean)
  let currentPath = ''

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const route = getRouteByPath(currentPath)

    if (route) {
      breadcrumbs.push({
        name: route.name,
        path: route.path
      })
    } else {
      // Handle dynamic segments
      const formattedName = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      breadcrumbs.push({
        name: formattedName,
        path: currentPath
      })
    }
  })

  return breadcrumbs
}