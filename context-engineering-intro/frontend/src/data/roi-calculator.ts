/**
 * ROI Calculator Data Schema for Senova
 * Based on real capabilities and industry benchmarks
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ROIInputs {
  // Required inputs
  currentMonthlyAdSpend: number;      // How much they spend on ads now ($500 - $50,000)
  currentCostPerLead: number;         // What they pay per lead ($20 - $500)
  averageCustomerValue: number;       // Lifetime value of a customer ($500 - $50,000)

  // Optional inputs (with defaults)
  monthlyWebsiteVisitors?: number;    // Traffic volume (100 - 100,000)
  currentConversionRate?: number;     // % of leads that convert (1% - 20%)

  // Selection
  industry: IndustryType;
  selectedTier: TierType;
}

export interface ROIResults {
  // Monthly Projections
  projectedMonthlySavings: number;
  projectedNewLeads: number;
  projectedAdditionalRevenue: number;
  projectedROI: number;  // percentage

  // Annual Projections
  projectedAnnualSavings: number;
  projectedAnnualRevenue: number;

  // Comparison Data
  currentState: {
    monthlyAdSpend: number;
    costPerLead: number;
    leadsPerMonth: number;
    monthlyRevenue: number;
  };
  withSenova: {
    monthlyAdSpend: number;
    costPerLead: number;
    leadsPerMonth: number;
    monthlyRevenue: number;
    senovaMonthlyCost: number;
  };

  // Tier-specific benefits
  tierBenefits: string[];

  // Key metrics
  metrics: {
    adSpendReduction: number;      // percentage
    cplReduction: number;           // percentage
    leadIncreaseRate: number;       // percentage
    revenueIncreaseRate: number;    // percentage
    paybackPeriod: number;          // months
  };
}

export type IndustryType =
  | 'medical-aesthetics'
  | 'real-estate'
  | 'insurance'
  | 'legal'
  | 'mortgage'
  | 'other';

export type TierType =
  | 'raw-data'
  | 'data-activation'
  | 'dsp-management'
  | 'white-glove';

// ============================================================================
// CONSTANTS - SENOVA CAPABILITIES (REAL NUMBERS)
// ============================================================================

export const SENOVA_CAPABILITIES = {
  // Visitor Identification
  visitorIdRate: 0.78,              // 78% visitor identification rate
  enrichmentMatchRate: 0.70,         // 70% match rate on data enrichment

  // DSP Performance
  dspCpmRange: {
    min: 2,
    max: 6,
    average: 4,
  },
  industryCpmRange: {
    min: 20,
    max: 30,
    average: 25,
  },

  // Lead Quality
  leadQualityImprovement: 0.30,      // 30% better from intent data

  // Conversion Rate Improvements by Tier
  conversionImprovements: {
    'raw-data': 0.10,               // 10% improvement
    'data-activation': 0.25,        // 25% improvement
    'dsp-management': 0.40,         // 40% improvement
    'white-glove': 0.50,            // 50% improvement
  },

  // CPL Reduction by Tier
  cplReduction: {
    'raw-data': 0.15,               // 15% reduction
    'data-activation': 0.30,        // 30% reduction
    'dsp-management': 0.45,         // 45% reduction
    'white-glove': 0.55,            // 55% reduction
  },
} as const;

// ============================================================================
// INDUSTRY BENCHMARKS
// ============================================================================

export const INDUSTRY_BENCHMARKS = {
  'medical-aesthetics': {
    avgCustomerValue: 3500,
    avgCostPerLead: 150,
    avgConversionRate: 0.12,
    avgMonthlyAdSpend: 5000,
    avgMonthlyVisitors: 2500,
    industryName: 'Medical Aesthetics',
  },
  'real-estate': {
    avgCustomerValue: 8000,
    avgCostPerLead: 100,
    avgConversionRate: 0.08,
    avgMonthlyAdSpend: 3000,
    avgMonthlyVisitors: 3000,
    industryName: 'Real Estate',
  },
  'insurance': {
    avgCustomerValue: 2000,
    avgCostPerLead: 75,
    avgConversionRate: 0.15,
    avgMonthlyAdSpend: 4000,
    avgMonthlyVisitors: 4000,
    industryName: 'Insurance',
  },
  'legal': {
    avgCustomerValue: 5000,
    avgCostPerLead: 200,
    avgConversionRate: 0.10,
    avgMonthlyAdSpend: 6000,
    avgMonthlyVisitors: 2000,
    industryName: 'Legal Services',
  },
  'mortgage': {
    avgCustomerValue: 4000,
    avgCostPerLead: 125,
    avgConversionRate: 0.10,
    avgMonthlyAdSpend: 4500,
    avgMonthlyVisitors: 2800,
    industryName: 'Mortgage Lending',
  },
  'other': {
    avgCustomerValue: 2500,
    avgCostPerLead: 100,
    avgConversionRate: 0.10,
    avgMonthlyAdSpend: 3500,
    avgMonthlyVisitors: 2500,
    industryName: 'General Business',
  },
} as const;

// ============================================================================
// TIER CONFIGURATIONS
// ============================================================================

export const TIER_CONFIG = {
  'raw-data': {
    name: 'Raw Data',
    monthlyPrice: 497,
    features: [
      'Visitor identification data',
      'Basic demographic info',
      'Export to CSV',
      'Weekly data updates',
    ],
    benefits: [
      'Identify 78% of anonymous visitors',
      '70% match rate on data enrichment',
      '15% reduction in cost per lead',
      'Build your own remarketing lists',
    ],
    hasVisitorId: true,
    hasEnrichment: false,
    hasDsp: false,
    hasManagement: false,
  },
  'data-activation': {
    name: 'Data Activation',
    monthlyPrice: 997,
    features: [
      'Everything in Raw Data',
      'Enriched contact data',
      'Intent signals',
      'CRM integration',
      'Daily data updates',
    ],
    benefits: [
      'Full visitor identification & enrichment',
      '30% improvement in lead quality',
      '30% reduction in cost per lead',
      'Automated lead scoring',
      'Direct CRM integration',
    ],
    hasVisitorId: true,
    hasEnrichment: true,
    hasDsp: false,
    hasManagement: false,
  },
  'dsp-management': {
    name: 'DSP Management',
    monthlyPrice: 2497,
    features: [
      'Everything in Data Activation',
      'Managed DSP campaigns',
      '$2-6 CPMs (vs $20-30 industry)',
      'Custom audience creation',
      'Real-time optimization',
    ],
    benefits: [
      '75-85% reduction in CPM costs',
      '45% reduction in overall cost per lead',
      '40% improvement in conversion rates',
      'Professional campaign management',
      'Weekly performance reports',
    ],
    hasVisitorId: true,
    hasEnrichment: true,
    hasDsp: true,
    hasManagement: false,
  },
  'white-glove': {
    name: 'White Glove Service',
    monthlyPrice: 4997,
    features: [
      'Everything in DSP Management',
      'Dedicated account manager',
      'Custom strategy development',
      'A/B testing & optimization',
      'Priority support',
      'Quarterly business reviews',
    ],
    benefits: [
      'Maximum ROI with full-service management',
      '55% reduction in cost per lead',
      '50% improvement in conversion rates',
      'Custom growth strategies',
      'Dedicated success team',
      'Guaranteed performance SLAs',
    ],
    hasVisitorId: true,
    hasEnrichment: true,
    hasDsp: true,
    hasManagement: true,
  },
} as const;

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Main ROI calculation function
 */
export function calculateROI(inputs: ROIInputs): ROIResults {
  // Get defaults if not provided
  const monthlyVisitors = inputs.monthlyWebsiteVisitors ||
    INDUSTRY_BENCHMARKS[inputs.industry].avgMonthlyVisitors;

  const conversionRate = inputs.currentConversionRate ||
    INDUSTRY_BENCHMARKS[inputs.industry].avgConversionRate;

  const tierConfig = TIER_CONFIG[inputs.selectedTier];
  const senovaMonthlyPrice = tierConfig.monthlyPrice;

  // Calculate current state
  const currentLeadsPerMonth = Math.round(inputs.currentMonthlyAdSpend / inputs.currentCostPerLead);
  const currentMonthlyRevenue = currentLeadsPerMonth * conversionRate * inputs.averageCustomerValue;

  // Calculate improvements based on tier
  const newMonthlyAdSpend = inputs.currentMonthlyAdSpend;
  let additionalLeads = 0;
  let newCostPerLead = inputs.currentCostPerLead;
  let newConversionRate = conversionRate;

  // 1. Visitor ID leads (if tier includes it)
  if (tierConfig.hasVisitorId) {
    const identifiedVisitors = monthlyVisitors * SENOVA_CAPABILITIES.visitorIdRate;
    const matchedVisitors = tierConfig.hasEnrichment ?
      identifiedVisitors * SENOVA_CAPABILITIES.enrichmentMatchRate :
      identifiedVisitors * 0.5; // Lower match without enrichment
    additionalLeads += Math.round(matchedVisitors * 0.1); // 10% convert to leads
  }

  // 2. DSP Savings (if tier includes it)
  if (tierConfig.hasDsp) {
    const currentCpm = SENOVA_CAPABILITIES.industryCpmRange.average;
    const newCpm = SENOVA_CAPABILITIES.dspCpmRange.average;
    const cpmSavingsRate = (currentCpm - newCpm) / currentCpm;

    // Can either save money OR get more impressions for same spend
    // We'll calculate as getting more leads for same spend
    const impressionMultiplier = currentCpm / newCpm;
    additionalLeads += Math.round(currentLeadsPerMonth * (impressionMultiplier - 1));
  }

  // 3. Apply CPL reduction
  const cplReductionRate = SENOVA_CAPABILITIES.cplReduction[inputs.selectedTier];
  newCostPerLead = inputs.currentCostPerLead * (1 - cplReductionRate);

  // 4. Apply conversion rate improvement
  const conversionImprovement = SENOVA_CAPABILITIES.conversionImprovements[inputs.selectedTier];
  newConversionRate = conversionRate * (1 + conversionImprovement);

  // Calculate new totals
  const totalNewLeads = currentLeadsPerMonth + additionalLeads;
  const newMonthlyRevenue = totalNewLeads * newConversionRate * inputs.averageCustomerValue;
  const additionalMonthlyRevenue = newMonthlyRevenue - currentMonthlyRevenue;

  // Calculate savings (reduced CPL means same spend gets more leads)
  const effectiveMonthlySpendSavings = inputs.currentMonthlyAdSpend * cplReductionRate;

  // Calculate total monthly benefit
  const totalMonthlyBenefit = effectiveMonthlySpendSavings + additionalMonthlyRevenue;

  // Calculate ROI
  const monthlyROI = ((totalMonthlyBenefit - senovaMonthlyPrice) / senovaMonthlyPrice) * 100;

  // Calculate payback period
  const paybackPeriod = senovaMonthlyPrice / totalMonthlyBenefit;

  // Build results
  const results: ROIResults = {
    // Monthly Projections
    projectedMonthlySavings: Math.round(effectiveMonthlySpendSavings),
    projectedNewLeads: additionalLeads,
    projectedAdditionalRevenue: Math.round(additionalMonthlyRevenue),
    projectedROI: Math.round(monthlyROI),

    // Annual Projections
    projectedAnnualSavings: Math.round(effectiveMonthlySpendSavings * 12),
    projectedAnnualRevenue: Math.round(additionalMonthlyRevenue * 12),

    // Comparison Data
    currentState: {
      monthlyAdSpend: inputs.currentMonthlyAdSpend,
      costPerLead: inputs.currentCostPerLead,
      leadsPerMonth: currentLeadsPerMonth,
      monthlyRevenue: Math.round(currentMonthlyRevenue),
    },
    withSenova: {
      monthlyAdSpend: newMonthlyAdSpend,
      costPerLead: Math.round(newCostPerLead),
      leadsPerMonth: totalNewLeads,
      monthlyRevenue: Math.round(newMonthlyRevenue),
      senovaMonthlyCost: senovaMonthlyPrice,
    },

    // Tier benefits
    tierBenefits: [...tierConfig.benefits],

    // Key metrics
    metrics: {
      adSpendReduction: Math.round(cplReductionRate * 100),
      cplReduction: Math.round(cplReductionRate * 100),
      leadIncreaseRate: Math.round((additionalLeads / currentLeadsPerMonth) * 100),
      revenueIncreaseRate: Math.round((additionalMonthlyRevenue / currentMonthlyRevenue) * 100),
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
    },
  };

  return results;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, includeDecimals = false): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });
  return formatter.format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, includeSign = true): string {
  const formatted = `${Math.round(value)}%`;
  return includeSign && value > 0 ? `+${formatted}` : formatted;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

/**
 * Get default values for optional inputs based on industry
 */
export function getDefaultValues(industry: IndustryType): Partial<ROIInputs> {
  const benchmark = INDUSTRY_BENCHMARKS[industry];
  return {
    currentMonthlyAdSpend: benchmark.avgMonthlyAdSpend,
    currentCostPerLead: benchmark.avgCostPerLead,
    averageCustomerValue: benchmark.avgCustomerValue,
    monthlyWebsiteVisitors: benchmark.avgMonthlyVisitors,
    currentConversionRate: benchmark.avgConversionRate,
  };
}

/**
 * Validate input values
 */
export function validateInputs(inputs: Partial<ROIInputs>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!inputs.currentMonthlyAdSpend || inputs.currentMonthlyAdSpend < 500 || inputs.currentMonthlyAdSpend > 50000) {
    errors.push('Monthly ad spend must be between $500 and $50,000');
  }

  if (!inputs.currentCostPerLead || inputs.currentCostPerLead < 20 || inputs.currentCostPerLead > 500) {
    errors.push('Cost per lead must be between $20 and $500');
  }

  if (!inputs.averageCustomerValue || inputs.averageCustomerValue < 500 || inputs.averageCustomerValue > 50000) {
    errors.push('Average customer value must be between $500 and $50,000');
  }

  if (inputs.monthlyWebsiteVisitors && (inputs.monthlyWebsiteVisitors < 100 || inputs.monthlyWebsiteVisitors > 100000)) {
    errors.push('Monthly website visitors must be between 100 and 100,000');
  }

  if (inputs.currentConversionRate && (inputs.currentConversionRate < 0.01 || inputs.currentConversionRate > 0.20)) {
    errors.push('Conversion rate must be between 1% and 20%');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate comparison chart data
 */
export function getComparisonChartData(results: ROIResults) {
  return {
    labels: ['Current', 'With Senova'],
    datasets: [
      {
        label: 'Monthly Leads',
        data: [
          results.currentState.leadsPerMonth,
          results.withSenova.leadsPerMonth,
        ],
      },
      {
        label: 'Cost Per Lead',
        data: [
          results.currentState.costPerLead,
          results.withSenova.costPerLead,
        ],
      },
      {
        label: 'Monthly Revenue',
        data: [
          results.currentState.monthlyRevenue,
          results.withSenova.monthlyRevenue,
        ],
      },
    ],
  };
}

/**
 * Get ROI tier recommendation based on inputs
 */
export function getRecommendedTier(inputs: Partial<ROIInputs>): TierType {
  const monthlySpend = inputs.currentMonthlyAdSpend || 0;

  if (monthlySpend >= 10000) {
    return 'white-glove';
  } else if (monthlySpend >= 5000) {
    return 'dsp-management';
  } else if (monthlySpend >= 2000) {
    return 'data-activation';
  } else {
    return 'raw-data';
  }
}

/**
 * Get savings timeline projection
 */
export function getSavingsTimeline(results: ROIResults, months = 12) {
  const timeline = [];
  for (let i = 1; i <= months; i++) {
    timeline.push({
      month: i,
      cumulativeSavings: results.projectedMonthlySavings * i,
      cumulativeRevenue: results.projectedAdditionalRevenue * i,
      cumulativeROI: ((results.projectedMonthlySavings + results.projectedAdditionalRevenue) * i) -
        (results.withSenova.senovaMonthlyCost * i),
    });
  }
  return timeline;
}

// ============================================================================
// SAMPLE SCENARIOS
// ============================================================================

export const SAMPLE_SCENARIOS = {
  'medical-spa-growth': {
    name: 'Medical Spa Growth',
    description: 'Mid-sized medical spa looking to increase patient volume',
    inputs: {
      currentMonthlyAdSpend: 5000,
      currentCostPerLead: 150,
      averageCustomerValue: 3500,
      monthlyWebsiteVisitors: 2500,
      currentConversionRate: 0.12,
      industry: 'medical-aesthetics' as IndustryType,
      selectedTier: 'dsp-management' as TierType,
    },
  },
  'real-estate-efficiency': {
    name: 'Real Estate Efficiency',
    description: 'Real estate agency optimizing lead generation costs',
    inputs: {
      currentMonthlyAdSpend: 3000,
      currentCostPerLead: 100,
      averageCustomerValue: 8000,
      monthlyWebsiteVisitors: 3000,
      currentConversionRate: 0.08,
      industry: 'real-estate' as IndustryType,
      selectedTier: 'data-activation' as TierType,
    },
  },
  'insurance-scale': {
    name: 'Insurance Scale',
    description: 'Insurance company ready to scale with better data',
    inputs: {
      currentMonthlyAdSpend: 10000,
      currentCostPerLead: 75,
      averageCustomerValue: 2000,
      monthlyWebsiteVisitors: 8000,
      currentConversionRate: 0.15,
      industry: 'insurance' as IndustryType,
      selectedTier: 'white-glove' as TierType,
    },
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

const roiCalculatorExports = {
  calculateROI,
  formatCurrency,
  formatPercentage,
  formatNumber,
  getDefaultValues,
  validateInputs,
  getComparisonChartData,
  getRecommendedTier,
  getSavingsTimeline,
  SENOVA_CAPABILITIES,
  INDUSTRY_BENCHMARKS,
  TIER_CONFIG,
  SAMPLE_SCENARIOS,
};

export default roiCalculatorExports;