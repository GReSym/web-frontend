import { createI18n } from 'vue-i18n'
import en from './en'
import ru from './ru'

export type MessageSchema = typeof en
export const LOCALES = ['en', 'ru'] as const
export type AppLocale = (typeof LOCALES)[number]

const STORAGE_KEY = 'gresym-locale'

function initialLocale(): AppLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (LOCALES as readonly string[]).includes(saved)) return saved as AppLocale
  } catch {
    // storage unavailable
  }
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

export const i18n = createI18n<[MessageSchema], AppLocale, false>({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages: { en, ru },
})

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // storage unavailable
  }
}
