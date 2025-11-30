'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Calculator, TrendingUp, DollarSign, Clock, Users, ChevronRight, Info, CheckCircle } from 'lucide-react';

export default function ROICalculatorPage() {
  // Form state
  const [formData, setFormData] = useState({
    currentCustomers: 1000,
    avgRevenuePerCustomer: 150,
    monthlyMarketingSpend: 2000,
    currentConversionRate: 2,
    hoursPerWeekOnTasks: 20
  });

  const [showResults, setShowResults] = useState(false);

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Calculate ROI
  const calculateROI = () => {
    setShowResults(true);
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ROI Calculations
  const calculations = {
    // Revenue improvements
    revenueIncrease: Math.round(formData.currentCustomers * formData.avgRevenuePerCustomer * 0.40), // 40% increase
    newCustomersPerMonth: Math.round(formData.currentCustomers * 0.15), // 15% growth
    improvedConversionRate: Math.round(formData.currentConversionRate * 2.5), // 2.5x improvement

    // Cost savings
    timeSavedHours: Math.round(formData.hoursPerWeekOnTasks * 0.65), // 65% time saved
    timeSavedValue: Math.round(formData.hoursPerWeekOnTasks * 0.65 * 50 * 4), // $50/hour * 4 weeks
    marketingEfficiency: Math.round(formData.monthlyMarketingSpend * 0.35), // 35% more efficient

    // Senova costs
    monthlySubscription: 599, // Professional plan

    // Total ROI
    get monthlyBenefit() {
      return this.revenueIncrease + this.timeSavedValue + this.marketingEfficiency;
    },
    get netMonthlyROI() {
      return this.monthlyBenefit - this.monthlySubscription;
    },
    get annualROI() {
      return this.netMonthlyROI * 12;
    },
    get roiPercentage() {
      return Math.round((this.netMonthlyROI / this.monthlySubscription) * 100);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-orange-100 rounded-full">
              <Calculator className="w-12 h-12 text-orange-600" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            ROI Calculator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See your potential return on investment with Senova CRM. Based on real results from thousands of businesses like yours.
          </p>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Tell Us About Your Business
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Current Customers */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  Current Number of Customers
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg z-10">
                      Include all active customers in your database
                    </div>
                  </div>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.currentCustomers}
                    onChange={(e) => handleInputChange('currentCustomers', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Average Revenue */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  Average Revenue per Customer ($)
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg z-10">
                      Average transaction or monthly value per customer
                    </div>
                  </div>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.avgRevenuePerCustomer}
                    onChange={(e) => handleInputChange('avgRevenuePerCustomer', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="150"
                  />
                </div>
              </div>

              {/* Marketing Spend */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  Monthly Marketing Spend ($)
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg z-10">
                      Total spend on ads, email, and other marketing
                    </div>
                  </div>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.monthlyMarketingSpend}
                    onChange={(e) => handleInputChange('monthlyMarketingSpend', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="2000"
                  />
                </div>
              </div>

              {/* Conversion Rate */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  Current Conversion Rate (%)
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg z-10">
                      Percentage of leads that become customers
                    </div>
                  </div>
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.currentConversionRate}
                    onChange={(e) => handleInputChange('currentConversionRate', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="2"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Time on Tasks */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  Hours per Week on Manual Tasks
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 top-6 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg z-10">
                      Time spent on follow-ups, data entry, campaign creation, etc.
                    </div>
                  </div>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.hoursPerWeekOnTasks}
                    onChange={(e) => handleInputChange('hoursPerWeekOnTasks', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="20"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={calculateROI}
              className="w-full md:w-auto mt-8 px-12 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
            >
              Calculate My ROI
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Results Section */}
          {showResults && (
            <div id="results" className="mt-12 space-y-8">
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl shadow-xl p-8 md:p-12 text-white">
                <h2 className="text-3xl font-bold mb-8">Your Estimated ROI with Senova</h2>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">
                      ${calculations.annualROI.toLocaleString()}
                    </div>
                    <div className="text-white/90">Annual Net Return</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">
                      {calculations.roiPercentage}%
                    </div>
                    <div className="text-white/90">ROI Percentage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">
                      3 mo
                    </div>
                    <div className="text-white/90">Payback Period</div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Detailed Breakdown</h3>

                <div className="space-y-6">
                  {/* Revenue Gains */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Revenue Improvements
                    </h4>
                    <div className="space-y-3 pl-7">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">40% Revenue Increase from Automation</span>
                        <span className="font-semibold text-green-600">
                          +${calculations.revenueIncrease.toLocaleString()}/mo
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">New Customers from Better Targeting</span>
                        <span className="font-semibold text-green-600">
                          +{calculations.newCustomersPerMonth}/mo
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Improved Conversion Rate</span>
                        <span className="font-semibold text-green-600">
                          {calculations.improvedConversionRate}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Savings */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Time & Cost Savings
                    </h4>
                    <div className="space-y-3 pl-7">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Hours Saved on Manual Tasks</span>
                        <span className="font-semibold text-blue-600">
                          {calculations.timeSavedHours} hrs/week
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Value of Time Saved</span>
                        <span className="font-semibold text-blue-600">
                          +${calculations.timeSavedValue.toLocaleString()}/mo
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Marketing Efficiency Gains</span>
                        <span className="font-semibold text-blue-600">
                          +${calculations.marketingEfficiency.toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Investment */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                      Your Investment
                    </h4>
                    <div className="space-y-3 pl-7">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Senova Professional Plan</span>
                        <span className="font-semibold text-orange-600">
                          ${calculations.monthlySubscription}/mo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Result */}
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold text-gray-900">Net Monthly ROI</span>
                      <span className="font-bold text-green-600 text-2xl">
                        +${calculations.netMonthlyROI.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">What's Included in Your Senova Investment</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    'Complete CRM with unlimited contacts',
                    'Website visitor identification',
                    'Automated email & text campaigns',
                    'Smart customer segmentation',
                    'Direct advertising at wholesale rates',
                    'AI-powered insights & recommendations',
                    'Appointment scheduling & reminders',
                    'Review management & reputation tools',
                    'Custom reporting & analytics',
                    'Unlimited team members',
                    'Priority support & training',
                    'All features, no hidden costs'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Start Growing Your Business?
                </h3>
                <p className="text-gray-600 mb-8">
                  Join thousands of businesses achieving these results with Senova CRM.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/demo"
                    className="px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg"
                  >
                    Get Your Free Demo
                  </Link>
                  <Link
                    href="/pricing"
                    className="px-8 py-4 bg-white text-orange-600 border-2 border-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold text-lg"
                  >
                    View Pricing Plans
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-6">
                  No credit card required • 14-day free trial • Cancel anytime
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900">5,000+</div>
                <div className="text-gray-600 mt-1">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">852%</div>
                <div className="text-gray-600 mt-1">Average ROI</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">4.9/5</div>
                <div className="text-gray-600 mt-1">Customer Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-gray-600 mt-1">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}