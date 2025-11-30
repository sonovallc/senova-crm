import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Lock, Award, CheckCircle, AlertTriangle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Compliance & Certifications | Senova CRM',
  description: 'Learn about Senova\'s compliance certifications, data protection standards, and industry regulations we adhere to.',
}

const complianceItems = [
  {
    icon: Shield,
    title: 'GDPR Compliant',
    description: 'We comply with all General Data Protection Regulation requirements for EU customer data.',
    details: [
      'Right to data access',
      'Right to erasure',
      'Data portability',
      'Privacy by design'
    ]
  },
  {
    icon: Lock,
    title: 'CCPA Compliant',
    description: 'California Consumer Privacy Act compliance for US customer data protection.',
    details: [
      'Consumer rights management',
      'Data sale opt-out',
      'Transparency requirements',
      'Annual privacy audits'
    ]
  },
  {
    icon: Award,
    title: 'SOC 2 Type II',
    description: 'Annual third-party audits ensure our security controls meet industry standards.',
    details: [
      'Security controls',
      'Availability monitoring',
      'Processing integrity',
      'Confidentiality measures'
    ]
  },
  {
    icon: FileText,
    title: 'CAN-SPAM Compliant',
    description: 'All email communications follow CAN-SPAM Act requirements.',
    details: [
      'Clear opt-out mechanisms',
      'Accurate sender information',
      'Subject line transparency',
      'Physical address included'
    ]
  }
]

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50"></div>
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Compliance & Certifications
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your data security and privacy are our top priorities. We maintain the highest standards of compliance and regularly undergo third-party audits.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance Grid */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {complianceItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Card key={index} className="p-8 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-gray-600 mb-4">{item.description}</p>
                      <ul className="space-y-2">
                        {item.details.map((detail, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Data Protection Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Data Protection Standards</h2>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Encryption Standards
                </h3>
                <p className="text-gray-600">
                  All data is encrypted using AES-256 encryption at rest and TLS 1.3 for data in transit.
                  We use industry-standard encryption libraries and regularly update our security protocols.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Access Controls
                </h3>
                <p className="text-gray-600">
                  Role-based access control (RBAC) ensures that only authorized personnel can access sensitive data.
                  All access is logged and regularly audited for compliance.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  Incident Response
                </h3>
                <p className="text-gray-600">
                  Our incident response team is available 24/7 to handle any security concerns.
                  We maintain detailed incident response procedures and conduct regular drills.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Annual Audits */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Regular Third-Party Audits</h2>
            <p className="text-lg text-gray-600 mb-8">
              We undergo annual security audits by independent third-party auditors to ensure our systems
              and processes meet the highest industry standards.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">Annual</div>
                <div className="text-gray-600">SOC 2 Audits</div>
              </div>
              <div className="p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">Quarterly</div>
                <div className="text-gray-600">Security Scans</div>
              </div>
              <div className="p-6 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 mb-2">Monthly</div>
                <div className="text-gray-600">Compliance Reviews</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-6">Have Questions About Our Compliance?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Our security team is happy to answer any questions about our compliance certifications and data protection practices.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Contact Security Team</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600">
                <Link href="/security">View Security Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}