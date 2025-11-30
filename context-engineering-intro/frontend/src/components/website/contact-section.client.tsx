'use client'

import dynamic from 'next/dynamic'

export const ContactSectionClient = dynamic(async () => {
  const imported = await import('./contact-section')
  return { default: imported.ContactSection }
}, { ssr: false })
