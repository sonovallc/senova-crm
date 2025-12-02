import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Senova CRM',
  description: 'Terms of Service for using Senova CRM platform. Learn about your rights, responsibilities, and our service agreement.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mb-6 text-sm text-slate-600">Effective Date: January 1, 2024</p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Senova CRM&apos;s platform and services, you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">2. Service Description</h2>
            <p className="mb-4">
              Senova CRM provides a customer relationship management platform designed for growing businesses, including:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Customer management and CRM capabilities</li>
              <li>Marketing automation and campaign tools</li>
              <li>Audience intelligence and targeting</li>
              <li>Analytics and reporting</li>
              <li>GDPR-compliant data storage and processing</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">3. Account Terms</h2>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Registration</h3>
            <p className="mb-4">
              You must provide accurate, complete, and current information during registration. You are responsible for
              maintaining the security of your account credentials.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Authorized Users</h3>
            <p className="mb-4">
              You are responsible for all activities under your account and for ensuring all users comply with these Terms.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Restrictions</h3>
            <p>
              You may not use the service for illegal purposes, to violate HIPAA or other regulations, or to harm others.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">4. Subscription and Payment</h2>
            <p className="mb-4">Subscription terms:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Subscriptions are billed monthly or annually in advance</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>We may change pricing with 30 days notice</li>
              <li>Failure to pay may result in service suspension</li>
              <li>Professional consultation available to discuss your needs</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">5. Data and Privacy</h2>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Your Data</h3>
            <p className="mb-4">
              You retain all rights to your data. We will not access your data except as necessary to provide services,
              prevent problems, or as required by law.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">HIPAA Compliance</h3>
            <p className="mb-4">
              We will provide appropriate HIPAA compliance documentation and comply with HIPAA requirements for handling PHI.
            </p>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Data Portability</h3>
            <p>
              You can export your data at any time through our platform tools.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">6. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malware or harmful code</li>
              <li>Attempt to gain unauthorized access</li>
              <li>Use the service to send spam</li>
              <li>Resell or redistribute the service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">7. Service Level Agreement</h2>
            <p className="mb-4">
              We strive for maximum uptime. Scheduled maintenance will be communicated in advance.
              Credits may be available for extended downtime per our SLA policy.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">8. Intellectual Property</h2>
            <p>
              We retain all rights to the Senova CRM platform, including all software, designs, and content.
              You grant us a license to use your feedback and suggestions to improve our service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">9. Warranties and Disclaimers</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES,
              EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SENOVA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT
              PAID BY YOU IN THE TWELVE MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Senova from any claims arising from your use of the service,
              violation of these Terms, or infringement of any rights.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">12. Termination</h2>
            <p className="mb-4">
              Either party may terminate these Terms with 30 days written notice. We may suspend or terminate
              immediately for violation of these Terms. Upon termination, you may export your data for 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">13. Modifications</h2>
            <p>
              We may modify these Terms with 30 days notice for material changes. Continued use after changes
              constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">14. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Texas, USA. Any disputes shall be resolved through
              binding arbitration in Austin, Texas.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">15. Contact Information</h2>
            <p className="mb-4">For questions about these Terms of Service, please contact us:</p>
            <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-6">
              <p className="mb-2"><strong>Senova CRM Legal Team</strong></p>
              <p className="mb-2">Email: legal@senovacrm.com</p>
              <p className="mb-2">Phone: 1-800-SENOVA1</p>
              <p>Address: 123 Healthcare Blvd, Suite 100, Austin, TX 78701</p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="text-orange-600 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/hipaa" className="text-orange-600 hover:underline">
                HIPAA Compliance
              </Link>
              <Link href="/security" className="text-orange-600 hover:underline">
                Security
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}