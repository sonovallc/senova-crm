import { Metadata } from 'next';
import { Calendar, Clock, CheckCircle, Users, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Book Your Consultation | Senova CRM Solutions',
  description: 'Schedule a personalized consultation to discover how Senova CRM can transform your aesthetic practice. Tailored solutions for your specific needs.',
  openGraph: {
    title: 'Book Your Consultation | Senova CRM',
    description: 'Schedule a personalized consultation to discover how Senova CRM can transform your aesthetic practice.',
    images: ['/images/consultation.jpg'],
  },
};

export default function DemoPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Schedule Your Consultation
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Get personalized guidance on how Senova can transform your aesthetic practice.
                  No generic pitches - just tailored solutions for your specific needs.
                </p>
                <div className="space-y-4">
                  {[
                    '30-minute personalized walkthrough',
                    'See your actual use cases',
                    'ROI calculation for your practice',
                    'Q&A with product experts',
                    'No pressure, no obligations',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consultation Request Form */}
              <div className="bg-white rounded-xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Your Consultation</h2>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Practice Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Practice Type *
                    </label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select your practice type</option>
                      <option value="medical-spa">Medical Spa</option>
                      <option value="dermatology">Dermatology</option>
                      <option value="plastic-surgery">Plastic Surgery</option>
                      <option value="aesthetic-clinic">Aesthetic Clinic</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Locations
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="1">1 Location</option>
                      <option value="2-3">2-3 Locations</option>
                      <option value="4-10">4-10 Locations</option>
                      <option value="10+">10+ Locations</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's your biggest challenge?
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Tell us about your current challenges..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    Schedule Consultation
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    By submitting this form, you agree to our{' '}
                    <a href="/privacy-policy" className="text-senova-electric hover:text-senova-electric-600 hover:underline transition-colors">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              What to Expect in Your Consultation
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: 'Your Practice Profile',
                  desc: "We'll discuss your specific needs, current tools, and growth goals",
                },
                {
                  icon: Calendar,
                  title: 'Live Product Tour',
                  desc: 'See real scenarios for your practice type with actual data examples',
                },
                {
                  icon: ArrowRight,
                  title: 'Clear Next Steps',
                  desc: 'Get pricing, implementation timeline, and ROI projections',
                },
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TODO: Add real testimonial when available */}
    </main>
  );
}