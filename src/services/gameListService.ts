import { ApiError, request } from './api'
import type { GameListEntry, GameListPage, GameListStatus, PageQuery } from '@/types/api'

/** The user's planned / rejected games. Liking / disliking a recommendation fills them too. */
export const gameListService = {
  list: (status: GameListStatus, q: PageQuery, signal?: AbortSignal) =>
    request<GameListPage>('/users/me/game-lists', { query: { status, ...q }, signal }),
  /** null when the game isn't in either list */
  get: async (gameId: number, signal?: AbortSignal): Promise<GameListEntry | null> => {
    try {
      return await request<GameListEntry>(`/users/me/game-lists/${gameId}`, { signal })
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },
  /** Puts the game in a list (moves it out of the other one). */
  set: (gameId: number, status: GameListStatus) =>
    request<GameListEntry>(`/users/me/game-lists/${gameId}`, { method: 'PUT', body: { status } }),
  remove: (gameId: number) => request<void>(`/users/me/game-lists/${gameId}`, { method: 'DELETE' }),
}
