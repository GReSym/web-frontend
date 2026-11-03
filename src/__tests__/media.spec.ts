import { describe, expect, it } from 'vitest'
import { MEDIA_PRESETS, mediaUrl } from '@/utils/media'

const STEAM =
  'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/ss_ab.1920x1080.jpg?t=1'

describe('mediaUrl', () => {
  it('keeps Steam URLs, with Steam thumbnails for the thumb preset', () => {
    expect(mediaUrl(STEAM, 'full', 'http://cdn')).toBe(STEAM)
    expect(mediaUrl(STEAM, 'thumb', '')).toBe(STEAM.replace('1920x1080', '600x338'))
  })
  it('builds gateway URLs for stored paths', () => {
    expect(mediaUrl('games/10/header.jpg', 'header', 'https://example.com/cdn/')).toBe(
      `https://example.com/cdn/t/${MEDIA_PRESETS.header}/games/10/header.jpg`,
    )
    expect(mediaUrl('games/10/ss-5.jpg', 'thumb', '/cdn')).toBe(
      `/cdn/t/${MEDIA_PRESETS.thumb}/games/10/ss-5.jpg`,
    )
  })
  it('returns null without a reference or base URL', () => {
    expect(mediaUrl(null, 'header', 'http://cdn')).toBeNull()
    expect(mediaUrl('', 'header', 'http://cdn')).toBeNull()
    expect(mediaUrl('games/10/header.jpg', 'header', '')).toBeNull()
  })
})
