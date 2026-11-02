import { request } from './api'
import type { GameInfo, GameReviewsList, GamesList, PageQuery, TagsList } from '@/types/api'

export interface GameSearchQuery extends PageQuery {
  search?: string
  /** true = by title, false = by meaning */
  exact?: boolean
  tags?: string[]
}

function listQuery(q: GameSearchQuery) {
  return {
    page: q.page,
    limit: q.limit,
    search: q.search?.trim() || undefined,
    exact: q.search?.trim() ? (q.exact ?? true) : undefined,
    tags: q.tags?.length ? q.tags.join(',') : undefined,
  }
}

export const gameService = {
  search: (q: GameSearchQuery, signal?: AbortSignal) =>
    request<GamesList>('/games', { query: listQuery(q), signal }),
  popular: (q: PageQuery, signal?: AbortSignal) =>
    request<GamesList>('/games/popular', { query: { ...q }, signal }),
  get: (id: number, signal?: AbortSignal) => request<GameInfo>(`/games/${id}`, { signal }),
  reviews: (id: number, q: PageQuery, signal?: AbortSignal) =>
    request<GameReviewsList>(`/games/${id}/reviews`, { query: { ...q }, signal }),
  suggestTags: (search: string, limit = 10, signal?: AbortSignal) =>
    request<TagsList>('/tags', { query: { search, limit }, signal }),
}
