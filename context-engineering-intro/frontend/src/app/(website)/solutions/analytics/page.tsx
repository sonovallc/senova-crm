import { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, TrendingUp, DollarSign, Users, Target, PieChart, Activity, Eye, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Prove Every Dollar of Marketing ROI | Business Analytics',
  description: 'Track customer acquisition costs, lifetime value, and revenue by campaign. See which marketing actually drives sales. Real-time dashboards.',
  openGraph: {
    title: 'Prove Every Dollar of Marketing ROI | Business Analytics',
    description: 'Track customer acquisition costs, lifetime value, and revenue by campaign.',
    images: ['/images/analytics-dashboard.jpg'],
  },
};

const keyMetrics = [
  { label: 'Avg CAC Reduction', value: '47%' },
  { label: 'ROI Visibility', value: '100%' },
  { label: 'Time to Insights', value: 'Real-time' },
];

const painPoints = [
  {
    issue: 'No idea which ads actually drive sales',
    cost: 'Wasting $5,000+/month on ineffective campaigns',
  },
  {
    issue: 'Can\'t calculate true customer acquisition cost',
    cost: 'Overspending by 40-60% on customer acquisition',
  },
  {
    issue: 'Don\'t know customer lifetime value',
    cost: 'Underinvesting in high-value customer segments',
  },
  {
    issue: 'Attributing revenue is just guesswork',
    cost: 'Missing opportunities to scale winning campaigns',
  },
];

const acquisitionMetrics = [
  { metric: 'Cost Per Lead (CPL)', description: 'Track costs across all channels', benchmark: 'Industry avg: $45' },
  { metric: 'Cost Per Acquisition (CPA)', description: 'True cost to acquire each customer', benchmark: 'Industry avg: $185' },
  { metric: 'Lead to Customer Rate', description: 'Conversion from inquiry to purchase', benchmark: 'Industry avg: 25%' },
  { metric: 'Channel Performance', description: 'ROI by marketing channel', benchmark: 'Best: Email 4.2X' },
];

const valueMetrics = [
  { metric: 'Average Order Value', description: 'Revenue per transaction', benchmark: 'Industry avg: $385' },
  { metric: 'Lifetime Value (LTV)', description: 'Total revenue per customer', benchmark: 'Industry avg: $2,400' },
  { metric: 'Purchase Frequency', description: 'Transactions per year', benchmark: 'Industry avg: 3.2' },
  { metric: 'Retention Rate', description: 'Customers returning within 12 months', benchmark: 'Industry avg: 45%' },
];

const dashboards = [
  {
    role: 'Business Owner',
    focus: 'High-level business metrics',
    widgets: ['Monthly revenue trends', 'Customer acquisition costs', 'Marketing ROI summary', 'Team productivity', 'YoY growth metrics'],
  },
  {
    role: 'Marketing Manager',
    focus: 'Campaign performance details',
    widgets: ['Campaign ROI breakdown', 'Channel performance', 'Conversion funnels', 'A/B test results', 'Budget optimization'],
  },
  {
    role: 'Sales Team',
    focus: 'Daily operational metrics',
    widgets: ['Today\'s sales', 'Pipeline tracking', 'Lead response times', 'Conversion rates', 'Daily revenue'],
  },
];

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Finally Know Which Marketing{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                Actually Works
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Track every customer from first click to lifetime value. Prove ROI, optimize spending,
              and grow with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/demo" className="btn-primary">
                See Your ROI Dashboard
              </Link>
              <Link href="/roi-calculator" className="btn-secondary">
                Calculate Your Metrics
              </Link>
            </div>
            <div className="flex justify-center gap-12">
              {keyMetrics.map((metric, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{metric.value}</div>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Flying Blind Costs You Thousands Monthly
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {painPoints.map((point, idx) => (
                <div key={idx} className="bg-red-50 rounded-lg p-6 border border-red-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{point.issue}</h3>
                  <p className="text-red-600 font-medium">{point.cost}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Tracked */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              Every Metric That Matters, Automated
            </h2>
            <p className="text-xl text-gray-600 mb-12 text-center">
              Stop guessing and start knowing with real-time analytics
            </p>

            {/* Acquisition Metrics */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-orange-600" />
                <h3 className="text-2xl font-bold text-gray-900">Acquisition Metrics</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {acquisitionMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-6 shadow-md">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{metric.metric}</h4>
                    <p className="text-gray-600 text-sm mb-2">{metric.description}</p>
                    <p className="text-orange-600 text-sm font-medium">{metric.benchmark}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Value Metrics */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-8 h-8 text-orange-600" />
                <h3 className="text-2xl font-bold text-gray-900">Customer Value Metrics</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {valueMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-6 shadow-md">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{metric.metric}</h4>
                    <p className="text-gray-600 text-sm mb-2">{metric.description}</p>
                    <p className="text-orange-600 text-sm font-medium">{metric.benchmark}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Attribution */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <PieChart className="w-8 h-8 text-orange-600" />
                <h3 className="text-2xl font-bold text-gray-900">Revenue Attribution</h3>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { title: 'First Touch', desc: 'Initial marketing touchpoint', use: 'Budget allocation' },
                    { title: 'Last Touch', desc: 'Final conversion trigger', use: 'Campaign optimization' },
                    { title: 'Multi-Touch', desc: 'Full customer journey credit', use: 'Holistic strategy' },
                  ].map((attr, idx) => (
                    <div key={idx} className="text-center">
                      <Activity className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-900 mb-1">{attr.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{attr.desc}</p>
                      <p className="text-xs text-orange-600 font-medium">Use: {attr.use}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Dashboards */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Custom Dashboards for Every Role
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {dashboards.map((dash, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-6">
                  <Eye className="w-10 h-10 text-orange-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{dash.role}</h3>
                  <p className="text-gray-600 mb-4">{dash.focus}</p>
                  <ul className="space-y-2">
                    {dash.widgets.map((widget, widgetIdx) => (
                      <li key={widgetIdx} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>{widget}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROI Proof Section */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Analytics That Pay for Themselves</h2>
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {[
                { metric: '$47K', desc: 'Saved monthly on ads' },
                { metric: '3.2X', desc: 'Average ROI increase' },
                { metric: '62%', desc: 'Better customer targeting' },
                { metric: '2 hrs', desc: 'Saved on reporting daily' },
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-3xl font-bold mb-1">{stat.metric}</div>
                  <div className="text-orange-200 text-sm">{stat.desc}</div>
                </div>
              ))}
            </div>
            <blockquote className="text-xl italic text-amber-100 mb-4">
              "We cut our marketing spend by 40% while increasing bookings by 25%.
              The analytics showed us exactly where we were wasting money."
            </blockquote>
            <p className="text-orange-200">- Dr. Robert Chen, Aesthetic Institute of Beverly Hills</p>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Connects to Everything You Already Use
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Automatic data sync from all your marketing and practice management tools
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Google Ads', 'Facebook Ads', 'Instagram', 'Email Platforms', 'Practice Management', 'Payment Systems', 'Booking Tools', 'Phone Systems'].map((tool, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-700">{tool}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Stop Guessing. Start Growing.
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get complete visibility into your marketing ROI and business metrics
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/demo" className="btn-primary">
                See Live Dashboard Demo
              </Link>
              <Link href="/roi-calculator" className="btn-secondary">
                Calculate Your ROI
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['Setup in 24 hours', 'Historical data import', 'Custom dashboards', 'Training included'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}