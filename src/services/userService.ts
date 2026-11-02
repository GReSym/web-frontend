import { request } from './api'
import type { RecommendationSettings, UserInfo, UserStats } from '@/types/api'

export const userService = {
  getMe: (signal?: AbortSignal) => request<UserInfo>('/users/me', { signal }),
  updateUsername: (username: string) =>
    request<UserInfo>('/users/me', { method: 'PATCH', body: { username } }),
  getStats: (signal?: AbortSignal) => request<UserStats>('/users/me/stats', { signal }),
  getSettings: (signal?: AbortSignal) =>
    request<RecommendationSettings>('/users/me/settings', { signal }),
  updateSettings: (body: Partial<RecommendationSettings>) =>
    request<RecommendationSettings>('/users/me/settings', { method: 'PATCH', body }),
}
