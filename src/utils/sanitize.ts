import DOMPurify from 'dompurify'

// Steam descriptions are HTML (with images and videos from the Steam CDN). Keep text formatting and images,
// drop scripts, styles, iframes, forms, event handlers; images load lazily without a referrer; links open in a new tab.

let hooked = false

function installHooks() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'IMG') {
      node.setAttribute('loading', 'lazy')
      node.setAttribute('decoding', 'async')
      node.setAttribute('referrerpolicy', 'no-referrer')
      node.removeAttribute('width')
      node.removeAttribute('height')
    }
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer nofollow')
    }
  })
}

export function sanitizeDescription(html: string): string {
  installHooks()
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'strong',
      'i',
      'em',
      'u',
      'strike',
      's',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'span',
      'div',
      'blockquote',
      'hr',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOWED_URI_REGEXP: /^https:\/\//i,
  })
}
