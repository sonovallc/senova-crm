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
  { name: 'Get Demo', path: '/demo', category: 'main', priority: 0.9 },

  // Platform/Solutions Pages
  { name: 'CRM', path: '/solutions/crm', category: 'platform', priority: 0.8, seoPage: 'solutions-crm.json', description: 'Customer relationship management' },
  { name: 'Audience Intelligence', path: '/solutions/audience-intelligence', category: 'platform', priority: 0.8, seoPage: 'solutions-audience-intelligence.json', description: 'Build targeted audiences' },
  { name: 'Visitor Identification', path: '/solutions/visitor-identification', category: 'platform', priority: 0.8, seoPage: 'solutions-visitor-identification.json', description: 'Identify website visitors' },
  { name: 'Campaign Activation', path: '/solutions/campaign-activation', category: 'platform', priority: 0.8, seoPage: 'solutions-campaign-activation.json', description: 'Multi-channel campaigns' },
  { name: 'Analytics', path: '/solutions/analytics', category: 'platform', priority: 0.8, seoPage: 'solutions-analytics.json', description: 'ROI & performance tracking' },

  // Industry Pages
  { name: 'Restaurants', path: '/industries/restaurants', category: 'industries', priority: 0.8, seoPage: 'industries-restaurants.json', description: 'Solutions for restaurants' },
  { name: 'Home Services', path: '/industries/home-services', category: 'industries', priority: 0.8, seoPage: 'industries-home-services.json', description: 'For service professionals' },
  { name: 'Retail', path: '/industries/retail', category: 'industries', priority: 0.8, seoPage: 'industries-retail.json', description: 'Retail business growth' },
  { name: 'Professional Services', path: '/industries/professional-services', category: 'industries', priority: 0.8, seoPage: 'industries-professional-services.json', description: 'For consultants and agencies' },

  // Resource Pages
  { name: 'Blog', path: '/blog', category: 'resources', priority: 0.7, description: 'Latest insights and trends' },
  { name: 'Case Studies', path: '/case-studies', category: 'resources', priority: 0.7, description: 'Success stories' },
  { name: 'ROI Calculator', path: '/roi-calculator', category: 'resources', priority: 0.7, description: 'Calculate your ROI' },
  { name: 'Documentation', path: '/docs', category: 'resources', priority: 0.6, description: 'Product documentation' },

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