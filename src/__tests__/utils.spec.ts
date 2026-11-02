import { describe, expect, it } from 'vitest'
import { screenshotThumb } from '@/utils/steam'
import { developerLine, formatDate, isPlaceholderDate, minutesToHours } from '@/utils/format'
import { flattenMetrics } from '@/utils/metrics'
import { sanitizeDescription } from '@/utils/sanitize'

describe('screenshotThumb', () => {
  it('uses the 600x338 variant of Steam screenshots', () => {
    expect(
      screenshotThumb(
        'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/ss_ab.1920x1080.jpg?t=1',
      ),
    ).toBe(
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/ss_ab.600x338.jpg?t=1',
    )
  })
  it('leaves other URLs unchanged', () => {
    expect(screenshotThumb('https://example.com/a.png')).toBe('https://example.com/a.png')
  })
})

describe('format', () => {
  it('treats 1970-01-01 as unknown', () => {
    expect(isPlaceholderDate('1970-01-01')).toBe(true)
    expect(formatDate('1970-01-01', 'en')).toBeNull()
    expect(formatDate('2020-05-01', 'en')).toContain('2020')
  })
  it('joins developer and publisher', () => {
    expect(developerLine('A', 'B')).toBe('A / B')
    expect(developerLine('A', 'A')).toBe('A')
    expect(developerLine('', 'B')).toBe('B')
  })
  it('converts minutes to hours', () => {
    expect(minutesToHours(90)).toBe(1.5)
    expect(minutesToHours(6000)).toBe(100)
  })
})

describe('flattenMetrics', () => {
  it('handles dynamic strategies and Ks', () => {
    const flat = flattenMetrics({
      strategies: {
        gresym: {
          '5': { precision: 0.2, recall: 0.1, hitRate: 0.5, ndcg: 0.3 },
          '10': { precision: 0.1, recall: 0.2, hitRate: 0.6, ndcg: 0.35 },
          mrr: 0.4,
          coverage: 0.01,
        },
        popular: {
          '5': { precision: 0.3, recall: 0.05, hitRate: 0.4, ndcg: 0.2 },
          mrr: 0.2,
          coverage: 0.001,
        },
        random: {},
      },
    })
    expect(flat.strategies).toEqual(['gresym', 'popular', 'random'])
    expect(flat.ks).toEqual([5, 10])
    expect(flat.atK.map((r) => `${r.k}:${r.strategy}`)).toEqual([
      '5:gresym',
      '5:popular',
      '10:gresym',
    ])
    expect(flat.strategyMetrics).toEqual(['mrr', 'coverage'])
    expect(flat.best['5:precision']).toBe(0.3)
    expect(flat.best.mrr).toBe(0.4)
  })
  it('returns empty tables without results', () => {
    expect(flattenMetrics(null).atK).toEqual([])
  })
})

describe('sanitizeDescription', () => {
  it('removes scripts and handlers, makes images lazy', () => {
    const html = sanitizeDescription(
      '<p onclick="x()">Hi<script>alert(1)</script><img src="https://cdn.example/a.gif" width="600"></p>',
    )
    expect(html).not.toContain('script')
    expect(html).not.toContain('onclick')
    expect(html).toContain('loading="lazy"')
    expect(html).not.toContain('width=')
  })
})
