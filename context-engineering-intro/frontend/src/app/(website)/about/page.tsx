import { Metadata } from 'next'
import { AboutSection } from '@/components/website/about-section'

export const metadata: Metadata = {
  title: 'About Us | Senova - Small Business CRM & Marketing Platform',
  description:
    'Learn about Senova, a technology company helping small businesses grow with simple, affordable CRM and advertising tools. No technical expertise needed.',
  keywords: [
    'Senova team',
    'small business CRM',
    'marketing platform',
    'business growth software',
    'affordable advertising',
    'customer management',
  ],
  openGraph: {
    title: 'About Us | Senova',
    description:
      'Learn about Senova, a technology company helping businesses grow with simple, affordable marketing tools.',
    type: 'website',
    url: 'https://senovallc.com/about',
  },
  alternates: {
    canonical: 'https://senovallc.com/about',
  },
}

export default function AboutPage() {
  return (
    <>
      <AboutSection />
    </>
  )
}