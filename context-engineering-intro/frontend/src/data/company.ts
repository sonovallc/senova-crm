/**
 * Senova Company Information
 * Official company data and capabilities
 */

export const COMPANY_INFO = {
  name: 'Senova',
  legalName: 'Noveris Data LLC',
  tagline: 'Data Intelligence for Growth',
  description: 'We help businesses identify, reach, and convert high-intent customers using advanced data intelligence and programmatic advertising.',

  // Core capabilities with real numbers
  capabilities: {
    profiles: '600M+',
    profilesLong: '600 million verified profiles',
    signals: '250B+',
    signalsLong: '250 billion weekly behavioral signals',
    urls: '260B+',
    urlsLong: '260 billion URL visits tracked',
    emails: '450M+',
    emailsLong: '450 million verified email addresses',
    phones: '380M+',
    phonesLong: '380 million mobile numbers',
    companies: '20M+',
    companiesLong: '20 million company profiles'
  },

  // Contact information
  contact: {
    email: 'hello@senovallc.com',
    sales: 'sales@senovallc.com',
    support: 'support@senovallc.com',
    phone: '1-800-SENOVA1',
    address: {
      line1: '123 Data Drive',
      line2: 'Suite 500',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'USA'
    }
  },

  // Social media
  social: {
    linkedin: 'https://linkedin.com/company/senova-data',
    twitter: 'https://twitter.com/senovadata',
    facebook: 'https://facebook.com/senovadata',
    youtube: 'https://youtube.com/@senovadata'
  },

  // Core values and differentiators
  values: {
    transparency: 'No hidden fees, no markups, clear reporting',
    flexibility: 'No contracts, month-to-month billing',
    quality: '99.5% data accuracy with verification',
    speed: 'Daily data updates and enrichment',
    support: 'Dedicated success team for every client'
  },

  // Technology stack
  technology: {
    ai: 'Proprietary AI for audience intelligence',
    pixel: 'SuperPixel visitor identification',
    crm: 'Senova CRM with automation',
    dsp: 'Direct DSP access at wholesale rates',
    api: 'REST API for seamless integration'
  },

  // Industries served
  industries: [
    'Medical Aesthetics',
    'Healthcare',
    'Financial Services',
    'Insurance',
    'Real Estate',
    'Legal Services',
    'Marketing Agencies',
    'E-commerce',
    'SaaS',
    'Professional Services'
  ],

  // Certifications and compliance
  compliance: {
    gdpr: true,
    ccpa: true,
    hipaa: 'Available for healthcare clients',
    soc2: false,
    iso27001: 'In progress',
    tcpa: 'Compliant'
  },

  // Partner ecosystem
  partners: {
    data: [
      'LiveRamp',
      'Oracle Data Cloud',
      'Experian',
      'Acxiom'
    ],
    technology: [
      'Salesforce',
      'HubSpot',
      'Microsoft',
      'Google Cloud'
    ],
    advertising: [
      'The Trade Desk',
      'Amazon DSP',
      'Google DV360',
      'Facebook'
    ]
  },

  // Company metrics
  metrics: {
    founded: '2019',
    employees: '50-100',
    headquarters: 'Austin, TX',
    offices: ['Austin', 'New York', 'San Francisco'],
    customers: 'Growing',
    dataProcessed: 'Enterprise-scale',
    campaignsManaged: 'Multiple',
    averageROI: 'Positive'
  },

  // Awards and recognition
  awards: [
    'Inc 5000 Fastest Growing Companies 2023',
    'MarTech Breakthrough Award 2023',
    'Austin Business Journal Fast 50',
    'G2 Leader in Data Intelligence'
  ],

  // Mission and vision
  mission: 'To democratize access to enterprise-grade data intelligence and make sophisticated marketing accessible to businesses of all sizes.',
  vision: 'A world where every business can identify, understand, and engage their ideal customers with precision and efficiency.',

  // Unique selling propositions
  usp: [
    {
      title: 'Wholesale DSP Rates',
      description: 'CPM rates of $2-6 vs industry average of $20-30',
      icon: 'DollarSign'
    },
    {
      title: 'No Contracts Required',
      description: 'Flexible month-to-month billing with no long-term commitments',
      icon: 'Calendar'
    },
    {
      title: '600M+ Verified Profiles',
      description: 'Largest proprietary consumer database with daily verification',
      icon: 'Database'
    },
    {
      title: '99.5% Data Accuracy',
      description: 'Industry-leading data quality with continuous validation',
      icon: 'CheckCircle'
    },
    {
      title: 'Professional Consultation',
      description: 'Personalized guidance to understand your specific needs',
      icon: 'Gift'
    },
    {
      title: 'White Glove Service',
      description: 'Dedicated success team for setup and optimization',
      icon: 'Users'
    }
  ]
}

// Helper function to get formatted address
export function getFormattedAddress(): string {
  const { address } = COMPANY_INFO.contact
  return `${address.line1}, ${address.line2}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`
}

// Helper function to get short address
export function getShortAddress(): string {
  const { address } = COMPANY_INFO.contact
  return `${address.city}, ${address.state}`
}

// Helper function to check compliance
export function hasCompliance(standard: keyof typeof COMPANY_INFO.compliance): boolean | string {
  return COMPANY_INFO.compliance[standard]
}

// Helper function to get partner count
export function getTotalPartnerCount(): number {
  return (
    COMPANY_INFO.partners.data.length +
    COMPANY_INFO.partners.technology.length +
    COMPANY_INFO.partners.advertising.length
  )
}

// Export metadata for SEO
export const COMPANY_METADATA = {
  organizationType: 'Corporation',
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: COMPANY_INFO.name,
  legalName: COMPANY_INFO.legalName,
  url: 'https://senovallc.com',
  logo: 'https://senovallc.com/logo.png',
  description: COMPANY_INFO.description,
  email: COMPANY_INFO.contact.email,
  telephone: COMPANY_INFO.contact.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: `${COMPANY_INFO.contact.address.line1} ${COMPANY_INFO.contact.address.line2}`,
    addressLocality: COMPANY_INFO.contact.address.city,
    addressRegion: COMPANY_INFO.contact.address.state,
    postalCode: COMPANY_INFO.contact.address.zip,
    addressCountry: COMPANY_INFO.contact.address.country
  },
  sameAs: Object.values(COMPANY_INFO.social),
  foundingDate: COMPANY_INFO.metrics.founded,
  numberOfEmployees: {
    '@type': 'QuantitativeValue',
    value: COMPANY_INFO.metrics.employees
  }
}

// Export trust signals for marketing use
export const TRUST_SIGNALS = {
  stats: [
    { label: 'Verified Profiles', value: COMPANY_INFO.capabilities.profiles },
    { label: 'Weekly Signals', value: COMPANY_INFO.capabilities.signals },
    { label: 'Happy Customers', value: COMPANY_INFO.metrics.customers },
    { label: 'Average ROI', value: COMPANY_INFO.metrics.averageROI }
  ],
  badges: [
    { type: 'compliance', label: 'GDPR Compliant', active: true },
    { type: 'compliance', label: 'CCPA Compliant', active: true },
    { type: 'award', label: 'Inc 5000', active: true },
    { type: 'rating', label: 'G2 Leader', active: true }
  ],
  guarantees: [
    'Professional Consultation',
    'No Setup Fees',
    'Month-to-Month Billing',
    '99.5% Data Accuracy',
    'White Glove Support'
  ]
}

// Export for footer and contact pages
export const FOOTER_LINKS = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Contact', href: '/contact' }
  ],
  product: [
    { label: 'Platform', href: '/platform' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Features', href: '/features' },
    { label: 'Integrations', href: '/integrations' }
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/api' },
    { label: 'Blog', href: '/blog' },
    { label: 'Case Studies', href: '/case-studies' }
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' }
  ]
}