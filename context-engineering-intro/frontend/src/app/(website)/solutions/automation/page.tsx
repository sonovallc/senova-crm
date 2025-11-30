import { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ArrowRight, Cpu, Clock, TrendingUp, Zap, Settings, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Marketing Automation That Saves 20 Hours/Week | Senova',
  description: 'Automate repetitive tasks, workflows, and campaigns while maintaining a personal touch. Save 20+ hours weekly and increase efficiency by 75%.',
  openGraph: {
    title: 'Marketing Automation That Saves 20 Hours/Week | Senova',
    description: 'Automate repetitive tasks, workflows, and campaigns while maintaining a personal touch.',
    images: ['/images/automation.jpg'],
  },
};

const features = [
  {
    title: 'Workflow Automation',
    description: 'Build complex workflows without code',
    icon: Cpu,
    capabilities: [
      'Visual workflow builder',
      'Multi-step automation sequences',
      'Conditional logic and branching',
      'Time-based and event triggers',
      'API integrations and webhooks',
      'Error handling and retries',
    ],
  },
  {
    title: 'Campaign Automation',
    description: 'Set it and forget it marketing',
    icon: Zap,
    capabilities: [
      'Welcome series automation',
      'Abandoned cart recovery',
      'Re-engagement campaigns',
      'Birthday and anniversary',
      'Post-purchase follow-ups',
      'Review request sequences',
    ],
  },
  {
    title: 'Task Automation',
    description: 'Eliminate repetitive manual work',
    icon: Clock,
    capabilities: [
      'Lead assignment rules',
      'Follow-up task creation',
      'Data enrichment automation',
      'Tag and segment updates',
      'Status change triggers',
      'Notification automation',
    ],
  },
  {
    title: 'Intelligence & Optimization',
    description: 'AI-powered automation that learns',
    icon: TrendingUp,
    capabilities: [
      'Predictive send-time optimization',
      'Content personalization AI',
      'Automatic A/B testing',
      'Performance optimization',
      'Anomaly detection alerts',
      'Smart list segmentation',
    ],
  },
];

const automationExamples = [
  {
    title: 'New Customer Onboarding',
    trigger: 'New signup',
    actions: [
      'Send welcome email',
      'Create CRM contact',
      'Assign to sales rep',
      'Schedule follow-up call',
      'Add to nurture sequence',
    ],
    result: '90% activation rate',
  },
  {
    title: 'Lead Qualification',
    trigger: 'Form submission',
    actions: [
      'Score lead based on data',
      'Enrich with company info',
      'Route to right team',
      'Send relevant content',
      'Update CRM status',
    ],
    result: '3X faster response',
  },
  {
    title: 'Customer Win-Back',
    trigger: '90 days inactive',
    actions: [
      'Send personalized offer',
      'Follow-up reminder',
      'Alert account manager',
      'Create support ticket',
      'Track engagement',
    ],
    result: '25% reactivation',
  },
];

const metrics = [
  { value: '20hrs', label: 'Saved weekly', description: 'Per team member' },
  { value: '75%', label: 'More efficient', description: 'Marketing operations' },
  { value: '5X', label: 'Faster workflows', description: 'vs. manual processes' },
  { value: '40%', label: 'Cost reduction', description: 'In operational expenses' },
];

export default function AutomationPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Automate Everything.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                Focus on Growth.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Stop wasting time on repetitive tasks. Build powerful automation workflows that run 24/7,
              so you can focus on strategy and growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo" className="btn-primary">
                See Automation Demo
              </Link>
              <Link href="#workflows" className="btn-secondary">
                View Workflows
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Manual Tasks Killing Your Productivity
              </h2>
              <ul className="space-y-4">
                {[
                  'Hours spent on data entry',
                  'Delayed follow-ups and responses',
                  'Inconsistent customer experiences',
                  'Human errors in repetitive tasks',
                  'Team burnout from mundane work',
                ].map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                The Automation Advantage
              </h2>
              <ul className="space-y-4">
                {[
                  'Instant automated data sync',
                  'Immediate response to triggers',
                  'Consistent execution every time',
                  'Zero errors in automated tasks',
                  'Team focused on high-value work',
                ].map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Examples */}
      <section id="workflows" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Automation in Action</h2>
              <p className="text-xl text-gray-600">Real workflows that save real time</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {automationExamples.map((example, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{example.title}</h3>
                  <div className="mb-4">
                    <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Trigger: {example.trigger}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-gray-700">Automated Actions:</p>
                    {example.actions.map((action, actionIdx) => (
                      <div key={actionIdx} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{action}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <span className="text-green-600 font-semibold">Result: {example.result}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Automation Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to automate your business processes
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-8 border-2 border-gray-100 hover:border-orange-200 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <feature.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-16">
                  {feature.capabilities.map((cap, capIdx) => (
                    <li key={capIdx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Metrics */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">ROI That Speaks for Itself</h2>
            <p className="text-xl text-amber-100">Average results from automation implementation</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl font-bold mb-2">{metric.value}</div>
                <div className="text-lg font-semibold mb-2">{metric.label}</div>
                <div className="text-sm text-orange-200">{metric.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Workflow Builder */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Visual Workflow Builder</h2>
              <p className="text-xl text-gray-600">Create powerful automations with drag-and-drop simplicity</p>
            </div>
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Start Node */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <span className="font-semibold text-gray-900">Trigger</span>
                  </div>
                  <p className="text-sm text-gray-600">New form submission</p>
                </div>

                {/* Action Nodes */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <span className="font-semibold text-gray-900">Action</span>
                  </div>
                  <p className="text-sm text-gray-600">Score & qualify lead</p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <span className="font-semibold text-gray-900">Decision</span>
                  </div>
                  <p className="text-sm text-gray-600">If score &gt; 70</p>
                </div>

                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">4a</span>
                    </div>
                    <span className="font-semibold text-gray-900">Hot Lead</span>
                  </div>
                  <p className="text-sm text-gray-600">Alert sales + call in 5min</p>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">4b</span>
                    </div>
                    <span className="font-semibold text-gray-900">Warm Lead</span>
                  </div>
                  <p className="text-sm text-gray-600">Add to nurture sequence</p>
                </div>

                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">5</span>
                    </div>
                    <span className="font-semibold text-gray-900">Complete</span>
                  </div>
                  <p className="text-sm text-gray-600">Log activity + update CRM</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Build complex workflows with 100+ triggers, 200+ actions, and unlimited conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Connects with Everything</h2>
            <p className="text-xl text-gray-600">Automate across your entire tech stack</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {['Salesforce', 'HubSpot', 'Slack', 'Google Workspace', 'Microsoft 365', 'Zapier', 'Stripe', 'Shopify'].map((tool, idx) => (
                <div key={idx} className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Settings className="w-8 h-8 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-700">{tool}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <p className="text-gray-600">+ 1000s more via API and webhooks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <blockquote className="text-2xl text-gray-700 italic mb-6">
              "Senova's automation saved our team 20 hours per week. We've automated 80% of our
              marketing operations and increased our capacity by 5X without adding headcount."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div>
                <div className="font-semibold text-gray-900">Jennifer Lee</div>
                <div className="text-gray-600">Director of Operations, Growth Co • San Francisco, CA</div>
              </div>
            </div>
            <div className="mt-4 text-orange-600 font-semibold">20 hours saved weekly per team member</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Automate Your Success?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start saving 20+ hours per week with intelligent automation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/demo" className="btn-primary">
                Get Automation Demo
              </Link>
              <Link href="/pricing" className="btn-secondary">
                See Pricing
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['14-day free trial', 'No code required', 'Pre-built templates', 'Expert support'].map((item, idx) => (
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