import { Metadata } from 'next'
import { ContactSection } from '@/components/website/contact-section'

export const metadata: Metadata = {
  title: 'Contact Us | Senova CRM - Get in Touch',
  description:
    'Contact Senova CRM for sales inquiries, support, or to schedule a demo. Email us at info@senovallc.com or support@senovallc.com.',
  keywords: [
    'contact Senova',
    'Senova CRM support',
    'schedule demo',
    'sales inquiry',
    'customer support',
  ],
  openGraph: {
    title: 'Contact Us | Senova CRM',
    description:
      'Get in touch with Senova CRM for sales, support, or to schedule a demo.',
    type: 'website',
    url: 'https://senovallc.com/contact',
  },
  alternates: {
    canonical: 'https://senovallc.com/contact',
  },
}

export default function ContactPage() {
  return (
    <>
      <ContactSection />
    </>
  )
}
