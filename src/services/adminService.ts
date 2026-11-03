import { request } from './api'
import type {
  AppSettings,
  EvaluationRun,
  EvaluationRunsList,
  GameInfo,
  MediaMigrationStatus,
  MediaStats,
  PageQuery,
  StaleReport,
  StartMediaMigrationRequest,
  UpdateAppSettingsRequest,
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
  settings: (signal?: AbortSignal) => request<AppSettings>('/admin/settings', { signal }),
  updateSettings: (body: UpdateAppSettingsRequest) =>
    request<AppSettings>('/admin/settings', { method: 'PATCH', body }),
  /** Counts over every game and screenshot (a second or two). */
  mediaStats: (signal?: AbortSignal) => request<MediaStats>('/admin/media/stats', { signal }),
  mediaMigration: (signal?: AbortSignal) =>
    request<MediaMigrationStatus>('/admin/media/migration', { signal }),
  startMediaMigration: (body: StartMediaMigrationRequest) =>
    request<MediaMigrationStatus>('/admin/media/migration', { method: 'POST', body }),
  cancelMediaMigration: () => request<void>('/admin/media/migration', { method: 'DELETE' }),
}
