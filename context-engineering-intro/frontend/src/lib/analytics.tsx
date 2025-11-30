'use client'

/**
 * Google Analytics 4 (GA4) Integration
 *
 * Usage:
 * 1. Set NEXT_PUBLIC_GA_MEASUREMENT_ID in .env.local
 * 2. Add <GoogleAnalytics /> to root layout
 * 3. Use analytics functions throughout the app
 */

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

// Analytics Configuration
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

// Type Definitions
type EventParams = {
  [key: string]: string | number | boolean
}

/**
 * Google Analytics Component
 * Add this to the root layout to enable GA tracking
 */
export function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // Track page views
    pageview(url)
  }, [pathname, searchParams])

  if (!GA_MEASUREMENT_ID) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}

/**
 * Facebook Pixel Component
 * Add this to the root layout to enable Facebook Pixel tracking
 */
export function FacebookPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!FB_PIXEL_ID) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // Track page views
    fbPixelPageview()
  }, [pathname, searchParams])

  if (!FB_PIXEL_ID) {
    return null
  }

  return (
    <Script id="facebook-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${FB_PIXEL_ID}');
        fbq('track', 'PageView');
      `}
    </Script>
  )
}

// ========================================
// Event Tracking Functions
// ========================================

/**
 * Track page views
 */
export function pageview(url: string) {
  if (!GA_MEASUREMENT_ID) return

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  })
}

/**
 * Track custom events
 *
 * @example
 * event('button_click', {
 *   category: 'engagement',
 *   label: 'Book Consultation',
 *   value: 1
 * })
 */
export function event(action: string, params: EventParams = {}) {
  if (!GA_MEASUREMENT_ID) return

  window.gtag('event', action, params)
}

// ========================================
// Common Event Helpers
// ========================================

/**
 * Track form submissions
 */
export function trackFormSubmit(formName: string, params: EventParams = {}) {
  event('form_submit', {
    form_name: formName,
    ...params,
  })
}

/**
 * Track button clicks
 */
export function trackButtonClick(buttonName: string, params: EventParams = {}) {
  event('button_click', {
    button_name: buttonName,
    ...params,
  })
}

/**
 * Track service interest
 */
export function trackServiceInterest(service: string, params: EventParams = {}) {
  event('service_interest', {
    service_name: service,
    ...params,
  })
}

/**
 * Track VIP membership selection
 */
export function trackVIPSelection(tier: string, price: number) {
  event('vip_selection', {
    tier,
    price,
    currency: 'USD',
  })
}

/**
 * Track chat widget interactions
 */
export function trackChatInteraction(action: string, params: EventParams = {}) {
  event('chat_interaction', {
    action,
    ...params,
  })
}

/**
 * Track lead generation
 */
export function trackLead(source: string, params: EventParams = {}) {
  event('generate_lead', {
    source,
    ...params,
  })
}

/**
 * Track booking attempts
 */
export function trackBookingAttempt(service: string, params: EventParams = {}) {
  event('booking_attempt', {
    service,
    ...params,
  })
}

// ========================================
// Facebook Pixel Functions
// ========================================

/**
 * Track Facebook Pixel page view
 */
function fbPixelPageview() {
  if (!FB_PIXEL_ID) return

  window.fbq('track', 'PageView')
}

/**
 * Track Facebook Pixel custom event
 */
export function fbPixelEvent(name: string, params: EventParams = {}) {
  if (!FB_PIXEL_ID) return

  window.fbq('track', name, params)
}

/**
 * Track Facebook Pixel lead
 */
export function fbPixelLead(source: string) {
  if (!FB_PIXEL_ID) return

  window.fbq('track', 'Lead', { content_name: source })
}

/**
 * Track Facebook Pixel contact
 */
export function fbPixelContact() {
  if (!FB_PIXEL_ID) return

  window.fbq('track', 'Contact')
}

// ========================================
// Type Declarations for gtag
// ========================================

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void
    fbq: (command: string, ...args: any[]) => void
    dataLayer: any[]
  }
}
