import { describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/en'
import ru from '@/i18n/ru'

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object'
      ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

describe('i18n messages', () => {
  it('ru has the same keys as en', () => {
    expect(keys(ru).sort()).toEqual(keys(en).sort())
  })

  it.each(['en', 'ru'] as const)('every %s message compiles', (locale) => {
    const i18n = createI18n({ legacy: false, locale, messages: { en, ru }, missingWarn: true })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const key of keys(en)) {
      const text = i18n.global.t(key, {
        n: 1,
        q: 'q',
        title: 't',
        tag: 't',
        hours: 1,
        mode: 'm',
        id: 1,
        s: 1,
        total: 1,
        shown: 1,
        vectors: 1,
        games: 1,
        saved: 1,
        failed: 1,
        error: 'e',
        reason: 'r',
        key: 'k',
      })
      if (text === key) throw new Error(`missing or broken message: ${key}`)
    }
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    warn.mockRestore()
    error.mockRestore()
  })
})
