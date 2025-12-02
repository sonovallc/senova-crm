import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Server, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security & Data Protection | Enterprise Security | Senova',
  description: 'Bank-level security with 256-bit encryption, enterprise-grade compliance, and 99.99% uptime. Learn about our security infrastructure.',
  openGraph: {
    title: 'Security & Data Protection | Senova',
    description: 'Bank-level security with 256-bit encryption, enterprise security standards.',
    images: ['/images/security.jpg'],
  },
};

export default function SecurityPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Lock className="w-20 h-20 text-slate-700 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Bank-Level Security for Your Practice
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your data is protected by military-grade encryption, continuous monitoring,
              and comprehensive security protocols that exceed industry standards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary">
                Request Security Audit
              </Link>
              <Link href="/hipaa" className="btn-secondary">
                HIPAA Compliance
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure Security */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Enterprise-Grade Infrastructure
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Server,
                  title: 'Cloud Infrastructure',
                  points: ['Multiple availability zones', '99.99% uptime SLA', 'Auto-scaling', 'DDoS protection'],
                },
                {
                  icon: Shield,
                  title: 'Data Protection',
                  points: ['256-bit AES encryption', 'TLS 1.3 in transit', 'Encrypted backups', 'Data residency options'],
                },
                {
                  icon: Eye,
                  title: '24/7 Monitoring',
                  points: ['Real-time threat detection', 'Intrusion prevention', 'Security incident response', 'Continuous scanning'],
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-8">
                  <item.icon className="w-12 h-12 text-slate-700 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <ul className="space-y-2">
                    {item.points.map((point, pointIdx) => (
                      <li key={pointIdx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600 text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Comprehensive Security Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Access Management',
                  features: ['Single Sign-On (SSO)', 'Multi-factor authentication', 'Role-based permissions', 'IP restrictions'],
                },
                {
                  title: 'Data Security',
                  features: ['End-to-end encryption', 'Field-level encryption', 'Secure key management', 'Data masking'],
                },
                {
                  title: 'Network Security',
                  features: ['Web Application Firewall', 'DDoS mitigation', 'Private networks', 'VPN support'],
                },
                {
                  title: 'Compliance',
                  features: ['HIPAA compliant', 'GDPR ready', 'CCPA compliant'],
                },
                {
                  title: 'Backup & Recovery',
                  features: ['Daily backups', 'Point-in-time recovery', 'Geo-redundant storage', 'Disaster recovery'],
                },
                {
                  title: 'Audit & Monitoring',
                  features: ['Activity logging', 'Access audits', 'Change tracking', 'Compliance reporting'],
                },
              ].map((category, idx) => (
                <div key={idx} className="bg-white rounded-lg p-6 shadow-md">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{category.title}</h3>
                  <ul className="space-y-2">
                    {category.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-center gap-2 text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-slate-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">Compliant & Verified Security</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { cert: 'HIPAA', desc: 'Full compliance' },
                { cert: 'ISO 27001', desc: 'In progress' },
                { cert: 'PCI DSS', desc: 'Level 1' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="text-2xl font-bold mb-2">{item.cert}</div>
                  <div className="text-slate-400 text-sm">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 rounded-xl p-8 border border-red-100">
              <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Incident Response</h2>
              <p className="text-gray-600 mb-6">
                In the unlikely event of a security incident, our response team is ready 24/7:
              </p>
              <ul className="space-y-3">
                {[
                  '15-minute response time for critical incidents',
                  'Dedicated incident response team',
                  'Transparent communication protocols',
                  'Full forensic capabilities',
                  'Breach notification within 60 days (HIPAA requirement)',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Security Questions?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Our security team is here to answer your questions and provide documentation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary">
                Contact Security Team
              </Link>
              <Link href="/contact" className="btn-secondary">
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}