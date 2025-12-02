/**
 * Senova Pricing Schema - Service-Based Model
 * Generated for data intelligence and marketing activation services
 */

// TypeScript Interfaces
export interface PricingTier {
  id: string
  name: string
  description: string
  priceModel: 'per-audience' | 'monthly-retainer' | 'management-fee-plus-media' | 'custom'
  startingAt: string
  price?: string // For display purposes
  features: string[]
  useCases: string[]
  cta: string
  ctaLink?: string
  popular: boolean
  badge?: string
  notIncluded?: string[]
  icon?: string // Icon name for UI components
}

export interface ALaCarteService {
  id: string
  name: string
  description: string
  priceModel: 'per-record' | 'monthly' | 'per-audience' | 'one-time' | 'per-page'
  startingAt: string
  icon?: string
  category?: string
}

// Main Service Tiers
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'raw-data',
    name: 'Raw Data Packages',
    description: 'Custom audience data delivered to you',
    priceModel: 'per-audience',
    startingAt: 'Starting at $500 per audience',
    price: '$500+',
    features: [
      'Custom audience creation via Senova Data Intelligence',
      'Access to 600M+ verified profiles',
      '250B+ weekly behavioral signals',
      'Data delivery (CSV, API, or CRM import)',
      'Email, phone, and address append',
      'Company firmographics enrichment',
      'Job title and seniority data',
      'LinkedIn profile matching',
      'Quarterly data refresh available',
      'You manage your own marketing'
    ],
    useCases: [
      'Agencies wanting data for their own campaigns',
      'Businesses with existing marketing teams',
      'List building for cold outreach',
      'Market research and analysis',
      'Sales prospecting'
    ],
    notIncluded: [
      'Campaign management',
      'Creative production',
      'DSP access',
      'CRM setup'
    ],
    cta: 'Get Started',
    ctaLink: '/contact?tier=raw-data',
    popular: false,
    icon: 'Database'
  },
  {
    id: 'data-activation',
    name: 'Data Activation',
    description: 'Done-for-you data activation and campaign setup',
    priceModel: 'monthly-retainer',
    startingAt: 'Starting at $1,500/month',
    price: '$1,500+/mo',
    features: [
      'Everything in Raw Data Packages',
      'Import audiences to your CRM and DSP',
      'DSP campaign setup and management',
      'Landing page creation in Senova CRM',
      'Pixel installation on your website',
      'Visitor enrichment and identification',
      'AI agent lead outreach and follow-up',
      'Full CRM access with email marketing',
      'Marketing automation workflows',
      'Lead scoring and segmentation',
      'Daily intent signal updates',
      'Monthly strategy calls'
    ],
    useCases: [
      'Businesses wanting done-for-you activation',
      'Medical aesthetics practices needing full funnel',
      'Companies without technical marketing resources',
      'Organizations wanting faster time to value',
      'Businesses scaling their outbound efforts'
    ],
    notIncluded: [
      'Creative production',
      'Content creation',
      'Ad spend (billed separately)'
    ],
    cta: 'Get Started',
    ctaLink: '/contact?tier=data-activation',
    popular: true,
    badge: 'MOST POPULAR',
    icon: 'Zap'
  },
  {
    id: 'dsp-management',
    name: 'DSP/Marketing Management',
    description: 'Programmatic advertising at wholesale rates',
    priceModel: 'management-fee-plus-media',
    startingAt: 'From $500/mo + media spend',
    price: '$500/mo + media',
    features: [
      'Programmatic DSP campaign management',
      'No markup on media spend (pay wholesale)',
      'CPM rates: $2-6 vs industry $20-30',
      'Custom audience creation and targeting',
      'Network testing across multiple exchanges',
      'Daily campaign optimization',
      'Budgets as low as $50/day accepted',
      'Cross-channel attribution tracking',
      'Transparent reporting dashboard',
      'Weekly performance reports',
      'Retargeting and lookalike audiences',
      'Competitive conquesting campaigns'
    ],
    useCases: [
      'Businesses wanting transparent ad buying',
      'Companies tired of agency markups',
      'Organizations with $5K+ monthly ad budgets',
      'Brands wanting programmatic efficiency',
      'Performance-focused marketers'
    ],
    notIncluded: [
      'Creative production',
      'Landing page development',
      'Email marketing'
    ],
    cta: 'Get Started',
    ctaLink: '/contact?tier=dsp-management',
    popular: false,
    icon: 'TrendingUp'
  },
  {
    id: 'white-glove',
    name: 'White Glove',
    description: 'Complete done-for-you marketing solution',
    priceModel: 'custom',
    startingAt: 'Custom pricing',
    price: 'Custom',
    features: [
      'Everything in Data Activation',
      'Creative and ad copy creation',
      'Full campaign strategy and execution',
      'Dedicated account management team',
      'Priority 24/7 support with 2-hour SLA',
      'Custom reporting dashboards',
      'Content marketing (4+ pieces/month)',
      'Social media advertising management',
      'SEO and content optimization',
      'Marketing automation workflows',
      'Lead nurturing sequences',
      'Quarterly business reviews',
      'Unlimited data enrichment',
      'Up to $25K/month ad spend included',
      'White-label options available'
    ],
    useCases: [
      'Businesses wanting complete marketing solution',
      'Practices with no marketing team',
      'High-growth companies needing scale',
      'Organizations wanting guaranteed results',
      'Enterprise clients with complex needs'
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact?tier=white-glove',
    popular: false,
    icon: 'Users'
  }
]

// A La Carte Services
export const A_LA_CARTE_SERVICES: ALaCarteService[] = [
  {
    id: 'list-enrichment',
    name: 'List Enrichment',
    description: 'Upload your list, get it enriched with emails, phones, company data, job titles, LinkedIn URLs, addresses',
    priceModel: 'per-record',
    startingAt: 'From $0.03/record',
    icon: 'Database',
    category: 'data'
  },
  {
    id: 'visitor-identification',
    name: 'Site Visitor Identification',
    description: 'Pixel installation + visitor data enrichment with contact details and intent signals',
    priceModel: 'monthly',
    startingAt: 'From $299/month',
    icon: 'Target',
    category: 'tracking'
  },
  {
    id: 'b2b2c-targeting',
    name: 'B2B2C Targeting',
    description: 'Identify all people at a company or list of companies, get consumer-level data for advertising',
    priceModel: 'per-audience',
    startingAt: 'From $500/audience',
    icon: 'Users',
    category: 'data'
  },
  {
    id: 'audience-building',
    name: 'Custom Audience Building',
    description: 'Custom audience creation via Senova Data Intelligence with 600M+ profiles',
    priceModel: 'per-audience',
    startingAt: 'From $500/audience',
    icon: 'UserPlus',
    category: 'data'
  },
  {
    id: 'dsp-setup',
    name: 'DSP Campaign Setup',
    description: 'One-time programmatic campaign configuration and optimization',
    priceModel: 'one-time',
    startingAt: '$500 one-time',
    icon: 'Settings',
    category: 'advertising'
  },
  {
    id: 'landing-page',
    name: 'Landing Page Creation',
    description: 'High-converting landing pages built in Senova CRM with A/B testing',
    priceModel: 'per-page',
    startingAt: 'From $250/page',
    icon: 'Layout',
    category: 'creative'
  },
  {
    id: 'crm-setup',
    name: 'CRM Setup & Onboarding',
    description: 'Complete Senova CRM configuration, training, and onboarding',
    priceModel: 'one-time',
    startingAt: '$500 one-time',
    icon: 'Wrench',
    category: 'setup'
  },
  {
    id: 'email-warmup',
    name: 'Email Warmup Service',
    description: 'Domain warmup and deliverability optimization for cold outreach',
    priceModel: 'monthly',
    startingAt: 'From $199/month',
    icon: 'Mail',
    category: 'email'
  },
  {
    id: 'creative-production',
    name: 'Creative Production',
    description: 'Ad creative, video, and graphic design services',
    priceModel: 'one-time',
    startingAt: 'From $1,500/package',
    icon: 'Palette',
    category: 'creative'
  },
  {
    id: 'competitive-analysis',
    name: 'Competitive Intelligence',
    description: 'In-depth competitor analysis with audience insights',
    priceModel: 'one-time',
    startingAt: 'From $2,500',
    icon: 'BarChart',
    category: 'research'
  }
]

// Helper Functions
export function getTierById(id: string): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.id === id)
}

export function getPopularTier(): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.popular)
}

export function getServiceById(id: string): ALaCarteService | undefined {
  return A_LA_CARTE_SERVICES.find(service => service.id === id)
}

export function getServicesByCategory(category: string): ALaCarteService[] {
  return A_LA_CARTE_SERVICES.filter(service => service.category === category)
}

// Pricing calculator helper
export function calculateDataCost(recordCount: number): number {
  // Tiered pricing for data enrichment
  if (recordCount <= 1000) return recordCount * 0.10
  if (recordCount <= 10000) return recordCount * 0.05
  if (recordCount <= 50000) return recordCount * 0.03
  if (recordCount <= 100000) return recordCount * 0.02
  return recordCount * 0.015 // Enterprise volume
}

// DSP spend calculator
export function calculateDSPFee(monthlySpend: number): number {
  // Tiered management fees
  if (monthlySpend <= 5000) return monthlySpend * 0.25
  if (monthlySpend <= 20000) return monthlySpend * 0.20
  if (monthlySpend <= 50000) return monthlySpend * 0.15
  return monthlySpend * 0.10 // Enterprise volume
}

// Export metadata for SEO
export const PRICING_METADATA = {
  title: 'Senova Pricing - Data Intelligence & Marketing Services',
  description: 'Flexible pricing for data intelligence, audience building, and programmatic advertising. From $500/month with no contracts. Professional consultation available.',
  keywords: [
    'data enrichment pricing',
    'B2B data costs',
    'programmatic advertising rates',
    'marketing automation pricing',
    'audience data pricing',
    'DSP management fees',
    'no contract marketing',
    'wholesale CPM rates'
  ]
}

// Comparison data for feature tables
export const FEATURE_COMPARISON = [
  {
    feature: 'Consumer Profiles',
    rawData: '600M+',
    dataActivation: '600M+',
    dspManagement: '600M+',
    whiteGlove: '600M+',
    enterprise: 'Custom'
  },
  {
    feature: 'Weekly Signals',
    rawData: '250B+',
    dataActivation: '250B+',
    dspManagement: '250B+',
    whiteGlove: '250B+',
    enterprise: 'Custom'
  },
  {
    feature: 'Data Export',
    rawData: true,
    dataActivation: true,
    dspManagement: true,
    whiteGlove: true,
    enterprise: true
  },
  {
    feature: 'Pixel Tracking',
    rawData: false,
    dataActivation: true,
    dspManagement: true,
    whiteGlove: true,
    enterprise: true
  },
  {
    feature: 'CRM Integration',
    rawData: false,
    dataActivation: true,
    dspManagement: true,
    whiteGlove: true,
    enterprise: true
  },
  {
    feature: 'DSP Access',
    rawData: false,
    dataActivation: false,
    dspManagement: true,
    whiteGlove: true,
    enterprise: true
  },
  {
    feature: 'Creative Production',
    rawData: false,
    dataActivation: false,
    dspManagement: false,
    whiteGlove: true,
    enterprise: true
  },
  {
    feature: 'Dedicated Team',
    rawData: false,
    dataActivation: false,
    dspManagement: true,
    whiteGlove: true,
    enterprise: true
  },
  {
    feature: 'Support Level',
    rawData: 'Email',
    dataActivation: 'Priority',
    dspManagement: 'Dedicated',
    whiteGlove: 'White Glove',
    enterprise: '24/7 SLA'
  },
  {
    feature: 'Minimum Commitment',
    rawData: 'None',
    dataActivation: '3 months',
    dspManagement: 'Monthly',
    whiteGlove: 'Annual',
    enterprise: 'Custom'
  }
]

// Volume pricing tiers for display
export const VOLUME_DISCOUNTS = {
  data: [
    { volume: '1,000 - 10,000', price: '$0.10/record', discount: '0%' },
    { volume: '10,001 - 50,000', price: '$0.05/record', discount: '50%' },
    { volume: '50,001 - 100,000', price: '$0.03/record', discount: '70%' },
    { volume: '100,000+', price: '$0.015/record', discount: '85%' }
  ],
  dsp: [
    { spend: '$0 - $5,000', fee: '25%', effective: '$1,250' },
    { spend: '$5,001 - $20,000', fee: '20%', effective: '$1,000 - $4,000' },
    { spend: '$20,001 - $50,000', fee: '15%', effective: '$3,000 - $7,500' },
    { spend: '$50,000+', fee: '10%', effective: '$5,000+' }
  ]
}