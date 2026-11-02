import { request } from './api'
import type {
  CreateRecommendationRequest,
  CreateRecommendationResponse,
  PageQuery,
  Recommendation,
  RecommendationHistory,
} from '@/types/api'

export const recommendationService = {
  /** Starts a calculation (asynchronous): poll `get` until status = completed. */
  create: (body: CreateRecommendationRequest) =>
    request<CreateRecommendationResponse>('/users/me/recommendations', { method: 'POST', body }),
  history: (q: PageQuery, signal?: AbortSignal) =>
    request<RecommendationHistory>('/users/me/recommendations', { query: { ...q }, signal }),
  get: (id: number, signal?: AbortSignal) =>
    request<Recommendation>(`/users/me/recommendations/${id}`, { signal }),
  feedback: (id: number, gameId: number, liked: boolean | null) =>
    request<void>(`/users/me/recommendations/${id}/games/${gameId}/feedback`, {
      method: 'PUT',
      body: { liked },
    }),
}
