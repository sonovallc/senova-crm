/**
 * HTML Sanitization Utility
 *
 * Provides XSS protection by sanitizing HTML content before rendering
 * Uses DOMPurify to prevent Cross-Site Scripting (XSS) attacks
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param html - The HTML string to sanitize
 * @param options - Optional configuration for allowed tags/attributes
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(html: string, options?: {
  allowedTags?: string[];
  allowedAttributes?: string[];
}): string {
  // Server-side rendering check - DOMPurify requires DOM
  if (typeof window === 'undefined') {
    // On server, return as-is (Next.js SSR)
    // Note: Content should be sanitized on the server before storage
    return html;
  }

  // Default allowed tags for basic formatting
  const defaultAllowedTags = [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'td', 'th', 'span', 'div'
  ];

  // Default allowed attributes
  const defaultAllowedAttributes = ['href', 'target', 'rel', 'class', 'id'];

  // Configure DOMPurify
  const config = {
    ALLOWED_TAGS: options?.allowedTags || defaultAllowedTags,
    ALLOWED_ATTR: options?.allowedAttributes || defaultAllowedAttributes,
    // Additional security settings
    ALLOW_DATA_ATTR: false, // Disallow data-* attributes
    ALLOW_ARIA_ATTR: false, // Disallow ARIA attributes
    ALLOW_UNKNOWN_PROTOCOLS: false, // Only allow http, https, mailto
    SAFE_FOR_TEMPLATES: true, // Remove dangerous tags for templates
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
    // Force links to open in new window with noopener
    ADD_ATTR: ['target', 'rel'],
    ADD_TAGS: [],
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  };

  // Sanitize the HTML
  const clean = DOMPurify.sanitize(html, config);

  // Additional processing for links
  if (typeof document !== 'undefined' && clean.includes('<a ')) {
    const temp = document.createElement('div');
    temp.innerHTML = clean;

    // Ensure all links open safely
    temp.querySelectorAll('a').forEach(link => {
      if (link.target === '_blank') {
        link.rel = 'noopener noreferrer';
      }
    });

    return temp.innerHTML;
  }

  return clean;
}

/**
 * Sanitize plain text (strips all HTML)
 *
 * @param text - The text to sanitize
 * @returns Plain text with no HTML
 */
export function sanitizeText(text: string): string {
  if (typeof window === 'undefined') {
    // Basic server-side HTML stripping
    return text.replace(/<[^>]*>/g, '');
  }

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

/**
 * Sanitize email content (allows more formatting)
 *
 * @param html - Email HTML content
 * @returns Sanitized HTML suitable for email display
 */
export function sanitizeEmailHtml(html: string): string {
  // Email content may have more complex HTML
  return sanitizeHtml(html, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'td', 'th', 'span', 'div',
      'img', 'hr', 'small', 'sub', 'sup', 'u', 's', 'del', 'ins'
    ],
    allowedAttributes: [
      'href', 'target', 'rel', 'class', 'id', 'src', 'alt', 'title',
      'width', 'height', 'align', 'valign', 'bgcolor', 'border',
      'cellpadding', 'cellspacing', 'style'
    ]
  });
}

/**
 * Example usage note for other files:
 *
 * Replace:
 *   dangerouslySetInnerHTML={{ __html: content }}
 *
 * With:
 *   dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
 *
 * Or for email content:
 *   dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(emailBody) }}
 *
 * This should be applied to ALL instances of dangerouslySetInnerHTML
 * throughout the application to ensure XSS protection.
 */