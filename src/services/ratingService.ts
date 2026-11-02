import { ApiError, request } from './api'
import type { GameRating, GameRatingsList, PageQuery, RateGameRequest } from '@/types/api'

export interface RatingsQuery extends PageQuery {
  /** only entries with more than this many hours */
  minHours?: number
  /** only entries without a recommend value */
  unevaluated?: boolean
}

/** The user's game library ("ratings" in the API). */
export const ratingService = {
  list: (q: RatingsQuery, signal?: AbortSignal) =>
    request<GameRatingsList>('/users/me/ratings', {
      query: { ...q, unevaluated: q.unevaluated || undefined },
      signal,
    }),
  /** null when the game isn't in the library */
  get: async (gameId: number, signal?: AbortSignal): Promise<GameRating | null> => {
    try {
      return await request<GameRating>(`/users/me/ratings/${gameId}`, { signal })
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },
  /** Creates or replaces the entry: send every field, omitted ones are cleared. */
  save: (gameId: number, body: RateGameRequest) =>
    request<GameRating>(`/users/me/ratings/${gameId}`, { method: 'PUT', body }),
  remove: (gameId: number) => request<void>(`/users/me/ratings/${gameId}`, { method: 'DELETE' }),
}

/** The request body for an existing entry with some fields changed (PUT replaces the whole entry). */
export function toRateRequest(
  entry: GameRating,
  patch: Partial<RateGameRequest> = {},
): RateGameRequest {
  return {
    rating: entry.rating,
    recommend: entry.recommend,
    playerHours: entry.playerHours,
    comment: entry.comment,
    ...patch,
  }
}
