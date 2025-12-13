import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exclusive Holiday Offers | Eve Beauty - Premier MedSpa',
  description: 'Claim your exclusive holiday offer at Eve Beauty, Wakefield\'s premier MedSpa. Ultimate Eve Glow Membership $179/month and 10% off all gift cards.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function EveBeautyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
