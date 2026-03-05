/**
 * HTML sanitization for rendered markdown content.
 *
 * All markdown → HTML rendering passes through DOMPurify before
 * being used with dangerouslySetInnerHTML. This prevents XSS from
 * any source: Claude API responses, CRM data, user input.
 */
import DOMPurify from 'dompurify';

/** Allowed tags and attributes for rendered markdown */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'b', 'i', 'u', 's', 'code', 'pre',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
    'blockquote',
    'a',
  ],
  ALLOWED_ATTR: [
    'class', 'style', 'href', 'target', 'rel',
    'data-chart',
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Sanitize HTML string — removes XSS vectors while preserving
 * safe markdown-rendered content (tables, bold, headers, etc.)
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG) as string;
}
