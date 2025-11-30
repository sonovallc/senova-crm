import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Senova CRM',
  description: 'Learn how Senova protects and manages your data. Our privacy policy outlines data collection, usage, and your rights.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mb-6 text-sm text-slate-600">Effective Date: January 1, 2024</p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">1. Introduction</h2>
            <p>
              Senova CRM (&quot;Senova,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our customer relationship management platform and related services.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">2. Information We Collect</h2>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Account Information</h3>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Name, email address, phone number</li>
              <li>Practice name and address</li>
              <li>Billing and payment information</li>
              <li>Account credentials</li>
            </ul>

            <h3 className="mb-2 text-xl font-semibold text-slate-800">Usage Data</h3>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Log data and analytics</li>
              <li>Feature usage patterns</li>
              <li>Device and browser information</li>
              <li>IP addresses</li>
            </ul>

            <h3 className="mb-2 text-xl font-semibold text-slate-800">Customer Data</h3>
            <p>
              As a GDPR-compliant platform, we process customer information on behalf of
              businesses. We act as a Data Processor and handle this data according to
              GDPR requirements and our Data Processing Agreement.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Provide and maintain our services</li>
              <li>Process transactions and billing</li>
              <li>Send administrative communications</li>
              <li>Improve and personalize services</li>
              <li>Ensure platform security</li>
              <li>Comply with legal obligations</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">4. Data Sharing</h2>
            <p className="mb-4">We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Service providers who assist in our operations</li>
              <li>Professional advisors (lawyers, accountants)</li>
              <li>Law enforcement when required by law</li>
              <li>Parties involved in business transfers</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">5. Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>256-bit AES encryption for data at rest</li>
              <li>TLS 1.3 encryption for data in transit</li>
              <li>SOC 2 Type II compliant infrastructure</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">6. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">7. Data Retention</h2>
            <p>
              We retain personal information for as long as necessary to provide our services
              and comply with legal obligations. PHI is retained according to HIPAA requirements
              and your retention settings.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">8. International Data Transfers</h2>
            <p>
              Data is primarily stored in the United States. For international transfers,
              we use appropriate safeguards including Standard Contractual Clauses.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">9. Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to individuals under 18. We do not knowingly
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">10. California Privacy Rights</h2>
            <p>
              California residents have additional rights under the CCPA, including the right
              to know, delete, and opt-out of the sale of personal information (we do not sell data).
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">11. Updates to Privacy Policy</h2>
            <p>
              We may update this policy periodically. We will notify you of material changes
              via email or platform notification.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">12. Contact Us</h2>
            <p className="mb-4">For privacy-related questions or to exercise your rights, contact us at:</p>
            <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-6">
              <p className="mb-2"><strong>Senova CRM Privacy Team</strong></p>
              <p className="mb-2">Email: privacy@senovacrm.com</p>
              <p className="mb-2">Phone: 1-800-SENOVA1</p>
              <p>Address: 123 Healthcare Blvd, Suite 100, Austin, TX 78701</p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex gap-4">
              <Link href="/terms-of-service" className="text-red-600 hover:underline">
                Terms of Service
              </Link>
              <Link href="/hipaa" className="text-red-600 hover:underline">
                HIPAA Compliance
              </Link>
              <Link href="/security" className="text-red-600 hover:underline">
                Security
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
