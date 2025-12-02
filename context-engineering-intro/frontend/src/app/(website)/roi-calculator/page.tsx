"use client"

import { useState, useEffect } from 'react'
import {
  calculateROI,
  formatCurrency,
  formatPercentage,
  formatNumber,
  getDefaultValues,
  getRecommendedTier,
  INDUSTRY_BENCHMARKS,
  TIER_CONFIG,
  type ROIInputs,
  type IndustryType,
  type TierType
} from '@/data/roi-calculator'
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Building2,
  ChevronDown,
  Info,
  Sparkles,
  ArrowRight,
  ChartBar,
  Target,
  Zap
} from 'lucide-react'

export default function ROICalculatorPage() {
  // Initialize with default values for medical-aesthetics industry
  const [inputs, setInputs] = useState<ROIInputs>({
    industry: 'medical-aesthetics',
    currentMonthlyAdSpend: 5000,
    currentCostPerLead: 150,
    averageCustomerValue: 3500,
    monthlyWebsiteVisitors: 5000,
    selectedTier: 'data-activation'
  })

  const [results, setResults] = useState<ReturnType<typeof calculateROI> | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Calculate results whenever inputs change
  useEffect(() => {
    const calculated = calculateROI(inputs)
    setResults(calculated)
  }, [inputs])

  // Update defaults when industry changes
  const handleIndustryChange = (industry: IndustryType) => {
    const defaults = getDefaultValues(industry)
    setInputs(prev => ({
      ...prev,
      industry,
      ...defaults
    }))
  }

  // Get recommended tier based on ad spend
  useEffect(() => {
    const recommended = getRecommendedTier(inputs)
    setInputs(prev => ({ ...prev, selectedTier: recommended }))
  }, [inputs.currentMonthlyAdSpend])

  const handleCalculate = () => {
    setShowResults(true)
    // Smooth scroll to results
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-violet-600/20 blur-3xl"></div>

        <div className="relative container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-2xl">
              <Calculator className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              ROI Calculator
            </h1>

            <p className="text-xl text-slate-300 mb-8">
              Discover how much you can save with Senova's data intelligence platform
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">15-20%</div>
                <div className="text-slate-300 text-sm">Visitor Identification</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">$2-6</div>
                <div className="text-slate-300 text-sm">CPM vs $20-30 Industry</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">45-55%</div>
                <div className="text-slate-300 text-sm">Lower Cost Per Lead</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Form */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-8">Enter Your Business Details</h2>

            <div className="space-y-8">
              {/* Industry Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Select Your Industry
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(INDUSTRY_BENCHMARKS).map(([key, data]) => (
                    <button
                      key={key}
                      onClick={() => handleIndustryChange(key as IndustryType)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        inputs.industry === key
                          ? 'bg-gradient-to-r from-blue-500 to-violet-600 border-transparent text-white shadow-lg'
                          : 'bg-white/5 border-white/20 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-semibold">{data.industryName}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Ad Spend */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-300">
                    Current Monthly Ad Spend
                  </label>
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(inputs.currentMonthlyAdSpend)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={inputs.currentMonthlyAdSpend}
                  onChange={(e) => setInputs(prev => ({
                    ...prev,
                    currentMonthlyAdSpend: parseInt(e.target.value)
                  }))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>$500</span>
                  <span>$50,000</span>
                </div>
              </div>

              {/* Cost Per Lead */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-300">
                    Current Cost Per Lead
                  </label>
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(inputs.currentCostPerLead)}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={inputs.currentCostPerLead}
                  onChange={(e) => setInputs(prev => ({
                    ...prev,
                    currentCostPerLead: parseInt(e.target.value)
                  }))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>$20</span>
                  <span>$500</span>
                </div>
              </div>

              {/* Average Customer Value */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-300">
                    Average Customer Value
                  </label>
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(inputs.averageCustomerValue)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={inputs.averageCustomerValue}
                  onChange={(e) => setInputs(prev => ({
                    ...prev,
                    averageCustomerValue: parseInt(e.target.value)
                  }))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>$500</span>
                  <span>$50,000</span>
                </div>
              </div>

              {/* Monthly Website Visitors */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-300">
                    Monthly Website Visitors (Optional)
                  </label>
                  <span className="text-2xl font-bold text-white">
                    {formatNumber(inputs.monthlyWebsiteVisitors || 0)}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="100"
                  value={inputs.monthlyWebsiteVisitors || 5000}
                  onChange={(e) => setInputs(prev => ({
                    ...prev,
                    monthlyWebsiteVisitors: parseInt(e.target.value)
                  }))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>100</span>
                  <span>100,000</span>
                </div>
              </div>

              {/* Service Tier Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Select Service Tier
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(TIER_CONFIG).map(([key, tier]) => (
                    <button
                      key={key}
                      onClick={() => setInputs(prev => ({
                        ...prev,
                        selectedTier: key as TierType
                      }))}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        inputs.selectedTier === key
                          ? 'bg-gradient-to-r from-blue-500 to-violet-600 border-transparent text-white shadow-lg'
                          : 'bg-white/5 border-white/20 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-bold text-lg mb-2">{tier.name}</div>
                      <div className="text-2xl font-bold mb-2">
                        {formatCurrency(tier.monthlyPrice)}/mo
                      </div>
                      <div className="text-sm opacity-90">
                        {tier.benefits[0]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                Calculate My ROI
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {showResults && results && (
        <section id="results-section" className="container mx-auto px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Your Projected Results with Senova
            </h2>

            {/* Big Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
                <div className="text-sm font-medium text-green-300 mb-2">Monthly Savings</div>
                <div className="text-4xl font-bold text-white mb-2">
                  {formatCurrency(results.projectedMonthlySavings)}
                </div>
                <div className="text-sm text-green-300">
                  {formatCurrency(results.projectedAnnualSavings)} annually
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30">
                <div className="text-sm font-medium text-purple-300 mb-2">New Leads/Month</div>
                <div className="text-4xl font-bold text-white mb-2">
                  +{results.projectedNewLeads}
                </div>
                <div className="text-sm text-purple-300">
                  {formatPercentage(results.metrics.leadIncreaseRate)} increase
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30">
                <div className="text-sm font-medium text-blue-300 mb-2">Projected ROI</div>
                <div className="text-4xl font-bold text-white mb-2">
                  {formatPercentage(results.projectedROI, false)}
                </div>
                <div className="text-sm text-blue-300">
                  {results.metrics.paybackPeriod} month payback
                </div>
              </div>
            </div>

            {/* Before vs After Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Current State */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-red-400">Before</span> Senova
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Monthly Ad Spend</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(results.currentState.monthlyAdSpend)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Cost Per Lead</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(results.currentState.costPerLead)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Leads Per Month</span>
                    <span className="text-white font-semibold">
                      {results.currentState.leadsPerMonth}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Monthly Revenue</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(results.currentState.monthlyRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* With Senova */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-green-400">With</span> Senova
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-green-100">Monthly Ad Spend</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(results.withSenova.monthlyAdSpend)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-100">Cost Per Lead</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(results.withSenova.costPerLead)}
                      <span className="text-green-400 text-sm ml-2">
                        -{results.metrics.cplReduction}%
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-100">Leads Per Month</span>
                    <span className="text-white font-semibold">
                      {results.withSenova.leadsPerMonth}
                      <span className="text-green-400 text-sm ml-2">
                        +{results.projectedNewLeads}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-100">Monthly Revenue</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(results.withSenova.monthlyRevenue)}
                      <span className="text-green-400 text-sm ml-2">
                        +{results.metrics.revenueIncreaseRate}%
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-green-400/30">
                    <span className="text-green-100">Senova Monthly Cost</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(results.withSenova.senovaMonthlyCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Benefits */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-12">
              <h3 className="text-xl font-bold text-white mb-6">
                Your {TIER_CONFIG[inputs.selectedTier].name} Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.tierBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-violet-600 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Ready to Save {formatCurrency(results.projectedMonthlySavings)}/month?
                </h3>
                <p className="text-blue-100 mb-6">
                  Start capturing these savings with Senova's data intelligence platform
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Book Consultation
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                  <a
                    href="/pricing"
                    className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors border border-blue-400"
                  >
                    View Pricing
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How Senova Delivers ROI
          </h2>

          <div className="grid gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    78% Visitor Identification
                  </h3>
                  <p className="text-slate-300">
                    Identify anonymous website visitors and turn them into qualified leads with our advanced tracking technology.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    $2-6 CPM vs $20-30 Industry Average
                  </h3>
                  <p className="text-slate-300">
                    Access wholesale DSP rates that are 75-85% lower than traditional advertising platforms.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    30-55% Reduction in Cost Per Lead
                  </h3>
                  <p className="text-slate-300">
                    Combine better targeting with lower costs to dramatically reduce your cost per acquisition.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}