import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MODA Aesthetics + Wellness - Exclusive Winter Offers',
  description: 'Transform your beauty this winter season with exclusive wellness packages from MODA Aesthetics + Wellness.',
  robots: 'noindex, nofollow',
}

export default function ModaBeautyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
