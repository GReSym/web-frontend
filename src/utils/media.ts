// Game images: a reference from the API is either an absolute Steam CDN URL (not migrated yet) or a path in the
// self-hosted media store ("games/10/header.jpg"), served by Openinary through the media gateway at
// `${mediaBaseUrl}/t/<preset>/<path>`. The admin sets the base URL (GET /api/config).
import { screenshotThumb } from './steam'

/**
 * Openinary transformations per place. The media gateway (deploy/media/presets.conf) lets only these through and the
 * backend prewarms them on upload (Media:*Presets in appsettings): change all three together.
 */
export const MEDIA_PRESETS = {
  /** Cards, search, game page cover (Steam headers are 460×215). */
  header: 'w_460,f_webp',
  /** Screenshot thumbnails, like Steam's .600x338.jpg. */
  thumb: 'w_600,h_338,c_fill,f_webp',
  /** A screenshot in the lightbox. */
  full: 'f_webp,q_90',
} as const

export type MediaPreset = keyof typeof MEDIA_PRESETS

export function isExternal(reference: string): boolean {
  return /^https?:\/\//i.test(reference)
}

/**
 * The URL to load, or null when there is nothing to show (no reference, or a stored path while no media base URL is
 * configured). Steam URLs keep working as before: thumbnails use Steam's own 600×338 variant.
 */
export function mediaUrl(
  reference: string | null | undefined,
  preset: MediaPreset,
  baseUrl: string,
): string | null {
  if (!reference) return null
  if (isExternal(reference)) return preset === 'thumb' ? screenshotThumb(reference) : reference
  if (!baseUrl) return null
  const path = reference.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')
  return `${baseUrl.replace(/\/+$/, '')}/t/${MEDIA_PRESETS[preset]}/${path}`
}
