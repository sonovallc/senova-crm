import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hana Beauty Holiday Special | Exclusive Med Spa Offers',
  description: 'Exclusive holiday offers on mesotherapy, tattoo removal, and weight loss at Hana Beauty Med Spa. Limited appointments available through December 2025.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function HanaBeautyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}