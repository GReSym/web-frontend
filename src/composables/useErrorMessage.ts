import { useI18n } from 'vue-i18n'
import { ApiError } from '@/services/api'

/** A user-facing message for any error thrown by the services. */
export function useErrorMessage() {
  const { t } = useI18n()

  return function errorMessage(e: unknown): string {
    if (e instanceof ApiError) {
      if (e.status === 0) return t('errors.network')
      if (e.status === 403) return t('errors.forbidden')
      if (e.status === 503) return t('errors.unavailable')
      if (e.status >= 500) return t('errors.server')
      if (e.fieldErrors.length)
        return e.fieldErrors.map((f) => `${f.field}: ${f.message}`).join('; ')
      return e.message || t('errors.unknown')
    }
    if (e instanceof Error) return e.message
    return t('errors.unknown')
  }
}
