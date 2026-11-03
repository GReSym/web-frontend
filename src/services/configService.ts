import { request } from './api'
import type { PublicConfig } from '@/types/api'

export const configService = {
  get: (signal?: AbortSignal) => request<PublicConfig>('/config', { signal }),
}
