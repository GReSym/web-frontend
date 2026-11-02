import { request } from './api'
import type {
  EvaluationRun,
  EvaluationRunsList,
  GameInfo,
  PageQuery,
  StaleReport,
  UpdateGameRequest,
} from '@/types/api'

export const adminService = {
  updateGame: (id: number, body: UpdateGameRequest) =>
    request<GameInfo>(`/admin/games/${id}`, { method: 'PATCH', body }),
  evaluationRuns: (q: PageQuery, signal?: AbortSignal) =>
    request<EvaluationRunsList>('/admin/evaluation/runs', { query: { ...q }, signal }),
  evaluationRun: (id: number, signal?: AbortSignal) =>
    request<EvaluationRun>(`/admin/evaluation/runs/${id}`, { signal }),
  /** Slow (the ML service scans every vector, up to ~2 min). */
  staleVectors: (
    q: { limit?: number; offset?: number; reason?: string[] } = {},
    signal?: AbortSignal,
  ) => request<StaleReport>('/admin/vectorization/stale', { query: q, signal }),
}
