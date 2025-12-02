import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, FileText, Users, AlertCircle, CheckCircle, Key, Eye, Server, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'HIPAA Compliance | Healthcare Data Security | Senova',
  description: 'Complete HIPAA compliance for healthcare practices. HIPAA compliance support, encrypted PHI storage, audit trails, and full administrative, physical, and technical safeguards.',
  openGraph: {
    title: 'HIPAA Compliance | Healthcare Data Security',
    description: 'Complete HIPAA compliance support. Protect patient data with enterprise-grade security.',
    images: ['/images/hipaa-compliance.jpg'],
  },
};

const safeguards = {
  administrative: [
    'Security Officer designation',
    'Workforce training programs',
    'Access management procedures',
    'Security incident procedures',
    'HIPAA compliance documentation',
    'Risk assessment protocols',
  ],
  physical: [
    'Facility access controls',
    'Workstation security',
    'Device and media controls',
    'Equipment disposal procedures',
    'Data center security',
    'Environmental controls',
  ],
  technical: [
    '256-bit AES encryption',
    'Access control systems',
    'Audit logs and controls',
    'Integrity controls',
    'Transmission security',
    'Automatic logoff',
  ],
};

const requirements = [
  {
    icon: FileText,
    title: 'Privacy Rule Compliance',
    description: 'Complete adherence to HIPAA Privacy Rule requirements',
    features: [
      'Patient consent management',
      'Minimum necessary standard',
      'PHI disclosure tracking',
      'Patient access rights',
    ],
  },
  {
    icon: Shield,
    title: 'Security Rule Compliance',
    description: 'Full implementation of required security measures',
    features: [
      'Risk assessments',
      'Vulnerability testing',
      'Security training',
      'Incident response',
    ],
  },
  {
    icon: AlertCircle,
    title: 'Breach Notification',
    description: 'Comprehensive breach detection and notification system',
    features: [
      '60-day notification compliance',
      'Breach risk assessment',
      'Documentation requirements',
      'Media notification protocols',
    ],
  },
  {
    icon: Users,
    title: 'Business Associates',
    description: 'Complete HIPAA compliance management',
    features: [
      'Compliance documentation support',
      'Subcontractor management',
      'Compliance verification',
      'Annual reviews',
    ],
  },
];

const features = [
  {
    title: 'Encryption Everywhere',
    description: 'Military-grade encryption for all PHI',
    details: ['256-bit AES at rest', 'TLS 1.3 in transit', 'End-to-end encryption', 'Key management system'],
  },
  {
    title: 'Access Controls',
    description: 'Granular permission management',
    details: ['Role-based access', 'Multi-factor authentication', 'Single sign-on', 'IP restrictions'],
  },
  {
    title: 'Audit Trails',
    description: 'Complete activity logging',
    details: ['Every PHI access logged', 'User activity tracking', 'Export capabilities', '7-year retention'],
  },
  {
    title: 'Data Backup',
    description: 'Secure backup and recovery',
    details: ['Daily automated backups', 'Geo-redundant storage', 'Point-in-time recovery', 'Disaster recovery plan'],
  },
];

const timeline = [
  { phase: 'Assessment', duration: 'Week 1', activities: ['Risk analysis', 'Gap identification', 'Compliance review'] },
  { phase: 'Implementation', duration: 'Weeks 2-3', activities: ['Security controls', 'Policy creation', 'Training setup'] },
  { phase: 'Validation', duration: 'Week 4', activities: ['Testing', 'Documentation', 'Certification'] },
  { phase: 'Ongoing', duration: 'Continuous', activities: ['Monitoring', 'Updates', 'Annual reviews'] },
];

export default function HIPAAPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-semibold">HIPAA Compliant Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Complete HIPAA Compliance
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 block">
                Built Into Every Feature
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Protect patient data with enterprise-grade security, comprehensive audit trails, and full HIPAA compliance. HIPAA compliance support available with every account.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all">
                Request Compliance Audit
              </Link>
              <Link href="/security" className="inline-flex items-center justify-center px-6 py-3 border-2 border-blue-600 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-all">
                View Security Details
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
              {['HIPAA Support', 'Security Audits', 'Annual Reviews', 'Enterprise-grade uptime'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HIPAA Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  What HIPAA Compliance Means for Your Practice
                </h2>
                <p className="text-gray-600 mb-6">
                  The Health Insurance Portability and Accountability Act (HIPAA) sets national standards for protecting patient health information. Non-compliance can result in fines ranging from $100 to $50,000 per violation, with annual maximums reaching $1.5 million.
                </p>
                <p className="text-gray-600 mb-6">
                  Senova CRM provides complete HIPAA compliance out of the box, protecting your practice from violations while streamlining your operations.
                </p>
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Your Compliance Partner</h3>
                  <ul className="space-y-2">
                    {[
                      'HIPAA compliance documentation available',
                      'Annual compliance audits',
                      'Security risk assessments',
                      'Incident response support',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Cost of Non-Compliance
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-red-600">$1.5M</div>
                    <div className="text-sm text-gray-600">Maximum annual penalty</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-600">Most</div>
                    <div className="text-sm text-gray-600">Healthcare breaches involve email</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-600">Many</div>
                    <div className="text-sm text-gray-600">Practices face HIPAA violations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Safeguards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Complete HIPAA Safeguards Implementation
              </h2>
              <p className="text-xl text-gray-600">
                Full compliance with all required administrative, physical, and technical safeguards
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <Users className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">Administrative Safeguards</h3>
                <ul className="space-y-2">
                  {safeguards.administrative.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <Server className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">Physical Safeguards</h3>
                <ul className="space-y-2">
                  {safeguards.physical.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <Lock className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">Technical Safeguards</h3>
                <ul className="space-y-2">
                  {safeguards.technical.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Requirements */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Meeting Every HIPAA Requirement
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {requirements.map((req, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <req.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{req.title}</h3>
                      <p className="text-gray-600">{req.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 ml-16">
                    {req.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
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

      {/* Security Features */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Enterprise-Grade Security Features
              </h2>
              <p className="text-xl text-blue-200">
                Protecting PHI with multiple layers of security
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="bg-blue-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-blue-200 text-sm mb-4">{feature.description}</p>
                  <ul className="space-y-1">
                    {feature.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-center gap-2 text-sm text-blue-100">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Audit & Compliance */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Eye className="w-12 h-12 text-blue-600 mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Comprehensive Audit Trails
                </h2>
                <p className="text-gray-600 mb-6">
                  Every access to PHI is logged and monitored. Our audit trail system exceeds HIPAA requirements and provides complete visibility into data access.
                </p>
                <ul className="space-y-3">
                  {[
                    'Every PHI access logged with timestamp',
                    'User identification and location tracking',
                    'Action performed and data viewed',
                    'Automatic anomaly detection',
                    'Export for compliance reporting',
                    '7-year retention standard',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Sample Audit Log Entry
                </h3>
                <div className="bg-white rounded-lg p-4 font-mono text-sm space-y-2 border border-gray-200">
                  <div><span className="text-gray-500">Timestamp:</span> 2024-01-15 14:32:18</div>
                  <div><span className="text-gray-500">User:</span> dr.smith@clinic.com</div>
                  <div><span className="text-gray-500">Action:</span> VIEW_PATIENT_RECORD</div>
                  <div><span className="text-gray-500">Patient ID:</span> PHI_REDACTED</div>
                  <div><span className="text-gray-500">IP Address:</span> 192.168.1.100</div>
                  <div><span className="text-gray-500">Location:</span> Main Clinic</div>
                  <div><span className="text-gray-500">Duration:</span> 3 min 42 sec</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Quick Path to Compliance
              </h2>
              <p className="text-xl text-gray-600">
                Achieve full HIPAA compliance in 30 days
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {timeline.map((phase, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-600">{phase.duration}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{phase.phase}</h3>
                    <ul className="space-y-1">
                      {phase.activities.map((activity, aIdx) => (
                        <li key={aIdx} className="text-sm text-gray-600">• {activity}</li>
                      ))}
                    </ul>
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 text-gray-400">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HIPAA Compliance Section */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
              <FileText className="w-12 h-12 text-blue-600 mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                HIPAA Compliance Support
              </h2>
              <p className="text-gray-600 mb-6">
                Senova provides HIPAA compliance support at no additional cost. Our compliance documentation covers:
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <ul className="space-y-3">
                  {[
                    'PHI safeguarding obligations',
                    'Permitted uses and disclosures',
                    'Breach notification procedures',
                    'Subcontractor requirements',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-3">
                  {[
                    'Compliance with HIPAA rules',
                    'Return/destruction of PHI',
                    'Security incident reporting',
                    'Annual compliance reviews',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Our compliance documentation is regularly updated to reflect current regulations and best practices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              HIPAA Compliance Support
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Our compliance team is here to answer your questions
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <Key className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Security Team</h3>
                <p className="text-sm text-gray-600">security@senovallc.com</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Compliance Office</h3>
                <p className="text-sm text-gray-600">compliance@senovallc.com</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Legal/Compliance</h3>
                <p className="text-sm text-gray-600">legal@senovallc.com</p>
              </div>
            </div>
            <p className="text-gray-600 mb-2">
              <strong>Noveris Data, LLC (dba Senova)</strong>
            </p>
            <p className="text-gray-600">
              8 The Green #21994, Dover, DE 19901
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ensure Your Practice is HIPAA Compliant
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get a free compliance assessment and see how Senova protects your practice
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all">
                Get Compliance Assessment
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-blue-600 text-lg font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-all">
                Talk to Compliance Expert
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              HIPAA support • Annual audits • 24/7 support • Full training provided
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}