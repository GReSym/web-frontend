// Steam CDN helpers. Images are loaded straight from Steam's CDN, so the UI keeps their number and size down:
// lazy loading everywhere, small thumbnails in lists, full-size screenshots only when the user opens one.

const SIZE_SUFFIX = /\.(\d{3,4})x(\d{3,4})\.jpg/i

/**
 * Screenshot URLs in the DB are the full 1920×1080 files (`…/ss_x.1920x1080.jpg?t=…`); Steam also serves a
 * 600×338 variant of each. Other URL formats are returned unchanged.
 */
export function screenshotThumb(url: string): string {
  return url.replace(SIZE_SUFFIX, '.600x338.jpg')
}

export function screenshotFull(url: string): string {
  return url
}

export function steamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}/`
}
