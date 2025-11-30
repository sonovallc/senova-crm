/**
 * Sentry Error Monitoring Configuration for Frontend
 *
 * This file initializes Sentry for error tracking and performance monitoring
 * in the Next.js frontend application.
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT || 'development'
const TRACES_SAMPLE_RATE = parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '1.0')

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not found - error monitoring disabled')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Performance Monitoring
    tracesSampleRate: TRACES_SAMPLE_RATE,

    // Session Replay (optional)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Filter events before sending
    beforeSend(event, hint) {
      // Filter out development errors
      if (ENVIRONMENT === 'development') {
        console.log('Sentry Event (dev):', event)
        return null // Don't send in development
      }

      // Filter out certain errors
      if (event.exception) {
        const error = hint.originalException

        // Don't send network errors
        if (error instanceof Error && error.message.includes('NetworkError')) {
          return null
        }
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'ChunkLoadError',
      'Loading chunk',
    ],
  })

  console.log(`✅ Sentry initialized - Environment: ${ENVIRONMENT}`)
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level)
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id?: string; email?: string; username?: string } | null) {
  Sentry.setUser(user)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}

/**
 * Set custom context
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context)
}
