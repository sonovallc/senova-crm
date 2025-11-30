import { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, Users, Clock, DollarSign, CheckCircle, ArrowRight, Award, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Case Studies | Real Success Stories | Senova CRM',
  description: 'See how businesses like yours are achieving remarkable results with Senova CRM. Real metrics, real growth.',
  openGraph: {
    title: 'Case Studies | Real Success Stories | Senova CRM',
    description: 'See how businesses like yours are achieving remarkable results with Senova CRM. Real metrics, real growth.',
  },
};

const caseStudies = [
  {
    id: 1,
    title: 'Medical Spa Increases Revenue 40% with Automated Recalls',
    industry: 'Medical Spa',
    location: 'Miami, FL',
    size: '3 locations',
    challenge: 'Low patient retention and inconsistent follow-ups were limiting revenue growth',
    solution: 'Implemented automated recall campaigns based on treatment cycles and patient preferences',
    results: {
      revenue: '+40%',
      retention: '+65%',
      time: '10 hrs/week saved'
    },
    metrics: [
      { label: 'Revenue Increase', value: '40%', icon: DollarSign },
      { label: 'Patient Retention', value: '65%', icon: Users },
      { label: 'Time Saved Weekly', value: '10 hours', icon: Clock },
      { label: 'ROI', value: '852%', icon: TrendingUp }
    ],
    testimonial: {
      quote: "Senova transformed how we engage with our patients. The automated recalls alone paid for the entire system in the first month.",
      author: "Dr. Sarah Mitchell",
      role: "Medical Director",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop"
    },
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop"
  },
  {
    id: 2,
    title: 'Restaurant Chain Boosts Repeat Visits by 65%',
    industry: 'Restaurant',
    location: 'Dallas, TX',
    size: '12 locations',
    challenge: 'Difficulty tracking customer preferences and creating personalized promotions',
    solution: 'Deployed customer intelligence platform to identify visit patterns and automate targeted offers',
    results: {
      visits: '+65%',
      average: '+$18/ticket',
      campaigns: '3x ROI'
    },
    metrics: [
      { label: 'Repeat Visits', value: '65%', icon: Users },
      { label: 'Avg Ticket Size', value: '+$18', icon: DollarSign },
      { label: 'Campaign ROI', value: '3x', icon: TrendingUp },
      { label: 'Customer Database', value: '45K+', icon: Users }
    ],
    testimonial: {
      quote: "We finally understand our customers. Senova showed us patterns we never knew existed, and now we can act on them automatically.",
      author: "Marcus Rodriguez",
      role: "CEO & Founder",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
    },
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop"
  },
  {
    id: 3,
    title: 'Home Services Company Reduces No-Shows by 80%',
    industry: 'Home Services',
    location: 'Phoenix, AZ',
    size: '45 technicians',
    challenge: 'High no-show rates and last-minute cancellations were disrupting operations',
    solution: 'Automated appointment reminders and smart scheduling based on customer behavior',
    results: {
      noShows: '-80%',
      revenue: '+$450K/year',
      rating: '4.9 stars'
    },
    metrics: [
      { label: 'No-Show Reduction', value: '80%', icon: CheckCircle },
      { label: 'Additional Revenue', value: '$450K', icon: DollarSign },
      { label: 'Customer Rating', value: '4.9★', icon: Award },
      { label: 'Efficiency Gain', value: '35%', icon: TrendingUp }
    ],
    testimonial: {
      quote: "The reduction in no-shows alone saved us hundreds of thousands. But the real win is how much our customers love the communication.",
      author: "Jennifer Chen",
      role: "Operations Director",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop"
    },
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop"
  },
  {
    id: 4,
    title: 'Dermatology Practice Saves 10 Hours Weekly',
    industry: 'Healthcare',
    location: 'Boston, MA',
    size: '2 providers',
    challenge: 'Staff spending too much time on manual follow-ups and appointment scheduling',
    solution: 'Automated patient communications and intelligent appointment booking system',
    results: {
      time: '10 hrs/week',
      bookings: '+45%',
      satisfaction: '98%'
    },
    metrics: [
      { label: 'Time Saved', value: '10 hrs/week', icon: Clock },
      { label: 'Online Bookings', value: '+45%', icon: Users },
      { label: 'Patient Satisfaction', value: '98%', icon: Award },
      { label: 'Revenue Growth', value: '28%', icon: DollarSign }
    ],
    testimonial: {
      quote: "My staff can finally focus on patient care instead of phone calls. Senova handles the repetitive tasks better than we ever could manually.",
      author: "Dr. Robert Kim",
      role: "Practice Owner",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop"
    },
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop"
  }
];

const industries = [
  { name: 'Medical & Aesthetics', count: 12 },
  { name: 'Restaurants', count: 8 },
  { name: 'Home Services', count: 6 },
  { name: 'Professional Services', count: 5 },
  { name: 'Retail', count: 4 }
];

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Real Results from Real Businesses
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            See how businesses like yours are transforming their customer relationships and driving growth with Senova CRM.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">852%</div>
              <div className="text-gray-600 mt-2">Average ROI</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">45%</div>
              <div className="text-gray-600 mt-2">Revenue Growth</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">10hrs</div>
              <div className="text-gray-600 mt-2">Saved Weekly</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">98%</div>
              <div className="text-gray-600 mt-2">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <button className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold">
              All Industries
            </button>
            {industries.map((industry) => (
              <button
                key={industry.name}
                className="px-6 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                {industry.name} ({industry.count})
              </button>
            ))}
          </div>

          {/* Case Study Cards */}
          <div className="space-y-20">
            {caseStudies.map((study, index) => (
              <article
                key={study.id}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                      {study.industry}
                    </span>
                    <span className="ml-3 text-gray-500">{study.location} • {study.size}</span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    {study.title}
                  </h2>

                  <div className="space-y-6 mb-8">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Challenge</h3>
                      <p className="text-gray-600">{study.challenge}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Solution</h3>
                      <p className="text-gray-600">{study.solution}</p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {study.metrics.map((metric) => (
                      <div key={metric.label} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex items-center gap-3">
                          <metric.icon className="w-5 h-5 text-orange-600" />
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                            <div className="text-sm text-gray-600">{metric.label}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border-l-4 border-orange-600">
                    <p className="text-gray-700 italic mb-4">"{study.testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={study.testimonial.image}
                        alt={study.testimonial.author}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{study.testimonial.author}</div>
                        <div className="text-sm text-gray-600">{study.testimonial.role}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link
                      href="#"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                    >
                      Read Full Case Study
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      src={study.image}
                      alt={study.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* More Case Studies CTA */}
          <div className="text-center mt-20">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Want to see more success stories?
            </h3>
            <p className="text-gray-600 mb-8">
              We have dozens more case studies across various industries.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                View All Case Studies
              </button>
              <Link
                href="/demo"
                className="px-8 py-3 bg-white text-orange-600 border-2 border-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold"
              >
                Start Your Success Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-orange-600 to-amber-600 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Become Our Next Success Story?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of businesses achieving remarkable results with Senova CRM.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/demo"
              className="px-8 py-4 bg-white text-orange-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg"
            >
              Get Your Free Demo
            </Link>
            <Link
              href="/roi-calculator"
              className="px-8 py-4 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors font-semibold text-lg"
            >
              Calculate Your ROI
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}