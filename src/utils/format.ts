/** Steam placeholder for an unknown release date (many games have it). */
export function isPlaceholderDate(date: string | null | undefined): boolean {
  return !date || date.startsWith('1970-01-01')
}

/** A release date (yyyy-mm-dd) or timestamp in the UI locale; null for missing/placeholder dates. */
export function formatDate(date: string | null | undefined, locale: string): string | null {
  if (isPlaceholderDate(date)) return null
  // Date-only values are parsed as UTC midnight: format them in UTC so the day doesn't shift
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date!)
  const d = new Date(date!)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: dateOnly ? 'UTC' : undefined,
  })
}

export function formatDateTime(date: string | null | undefined, locale: string): string | null {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatNumber(value: number, locale: string, maxFractionDigits = 0): string {
  return value.toLocaleString(locale, { maximumFractionDigits: maxFractionDigits })
}

/** Minutes → hours with one decimal below 10 h. */
export function minutesToHours(minutes: number): number {
  const hours = minutes / 60
  return hours < 10 ? Math.round(hours * 10) / 10 : Math.round(hours)
}

/** "Developer / Publisher", or one of them when they're equal or one is missing. */
export function developerLine(developer?: string | null, publisher?: string | null): string {
  const dev = developer?.trim()
  const pub = publisher?.trim()
  if (dev && pub && dev !== pub) return `${dev} / ${pub}`
  return dev || pub || ''
}
