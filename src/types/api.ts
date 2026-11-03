// Shapes of the GReSym API (backend/GReSym.Application/DTO, docs/api.md). camelCase JSON.

export interface UserInfo {
  id: number
  name: string
  email: string
  isAdmin: boolean
}

export interface AuthResponse {
  token: string
}

export const DISLIKE_MODES = [
  'ignore',
  'penalize_closer',
  'penalize_similar',
  'hide_similar',
] as const
export type DislikeMode = (typeof DISLIKE_MODES)[number]

export interface RecommendationSettings {
  mainstream: number
  dislikeMode: DislikeMode
  dislikeStrength: number
}

export interface UserStats {
  totalHours: number
  gamesPlayed: number
  favoriteTag: string | null
}

export interface GameInfo {
  gameId: number
  title: string
  /** HTML, only for a single game */
  description?: string | null
  /** yyyy-mm-dd; 1970-01-01 is a placeholder for an unknown date */
  releaseDate: string
  developer: string
  publisher: string
  headerImageUrl: string | null
  tags?: string[] | null
  screenshots?: string[] | null
  steamAppId?: number | null
}

export interface GamesList {
  count: number
  games: GameInfo[]
}

export interface GameRating {
  gameId: number
  /** 1–10 */
  rating: number | null
  /** true = liked, false = disliked, null = not evaluated */
  recommend: boolean | null
  playerHours: number | null
  comment: string | null
  game?: GameInfo | null
}

export type RateGameRequest = Pick<GameRating, 'rating' | 'recommend' | 'playerHours' | 'comment'>

export interface GameRatingsList {
  count: number
  ratings: GameRating[]
}

/** The user's lists: planned = wants to play it, rejected = not interested. Both are never recommended again. */
export type GameListStatus = 'planned' | 'rejected'

export interface GameListEntry {
  gameId: number
  status: GameListStatus
  /** ISO date: when the game was put in this list */
  addedAt: string
  /** only in lists */
  game?: GameInfo
}

export interface GameListPage {
  count: number
  games: GameListEntry[]
}

export interface GameReview {
  id: number
  source: string
  content: string | null
  recommended: boolean | null
  /** minutes */
  playtimeAtReview: number | null
  votesUp: number | null
  writtenDuringEarlyAccess: boolean | null
  createdAt: string | null
}

export interface GameReviewsList {
  count: number
  reviews: GameReview[]
}

export interface TagsList {
  count: number
  tags: string[]
}

export interface UpdateGameRequest {
  title?: string
  description?: string
  releaseDate?: string
  developer?: string
  publisher?: string
  tags?: string[]
}

export type RecommendationStatus = 'queued' | 'completed'

export interface RecommendedGame extends GameInfo {
  position: number
  /** null for the popular-games fallback */
  score: number | null
  liked: boolean | null
}

export interface Recommendation {
  id: number
  status: RecommendationStatus
  source: 'personal' | 'popular' | null
  limit: number
  mainstream: number
  dislikeMode: DislikeMode
  dislikeStrength: number
  usedRatings: number | null
  error: string | null
  createdAt: string
  updatedAt: string
  finishedAt: string | null
  count: number
  games?: RecommendedGame[] | null
}

export interface RecommendationHistory {
  count: number
  recommendations: Recommendation[]
}

export interface CreateRecommendationRequest extends Partial<RecommendationSettings> {
  limit?: number
}

export interface CreateRecommendationResponse {
  id: number
  status: RecommendationStatus
}

export interface EvaluationParameters {
  ks?: number[]
  testSize?: number
  minTrainGames?: number
  minPlaytimeMinutes?: number
  testSelection?: string
  seed?: number
  [key: string]: unknown
}

export interface MetricsAtK {
  precision: number
  recall: number
  hitRate: number
  ndcg: number
}

/** Keys are K values ("5", "10", …) with MetricsAtK, plus strategy-level numbers (mrr, coverage, …). */
export type StrategyMetrics = Record<string, MetricsAtK | number | unknown>

export interface EvaluationResults {
  usersEvaluated?: number
  users?: { total: number; evaluated: number; skipped: Record<string, number> }
  filtered?: Record<string, number>
  strategies?: Record<string, StrategyMetrics>
  [key: string]: unknown
}

export type EvaluationStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface EvaluationRun {
  id: number
  status: EvaluationStatus
  parameters: EvaluationParameters | null
  usersEvaluated: number | null
  error: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  results?: EvaluationResults | null
}

export interface EvaluationRunsList {
  count: number
  runs: EvaluationRun[]
}

export interface StaleGame {
  gameId: number
  score: number
  reasons: string[]
  vectorizedAt: string | null
  details: Record<string, number | null>
}

export interface StaleReport {
  collection: string
  textVersion: number
  vectors: number
  games: number
  counts: Record<string, number>
  total: number
  items: StaleGame[]
}

/** A page request; the API returns `count` = items on the page, so "done" is count < limit. */
export interface PageQuery {
  page: number
  limit: number
}

/** GET /api/config: what every page needs. */
export interface PublicConfig {
  /** Base URL for stored image paths, no trailing slash; "" = not configured. */
  mediaBaseUrl: string
}

export interface AppSettings {
  mediaBaseUrl: string
  /** From the API's appsettings, used while the admin never set one. */
  defaultMediaBaseUrl: string
}

/** Partial update; mediaBaseUrl "" = back to the default. */
export interface UpdateAppSettingsRequest {
  mediaBaseUrl?: string
}

/** How many image references still point at the Steam CDN. */
export interface MediaStats {
  headers: number
  steamHeaders: number
  screenshots: number
  steamScreenshots: number
}

export type MediaMigrationState = 'idle' | 'running' | 'completed' | 'cancelled' | 'failed'

/** The current or last migration run (in the API's memory: a restart forgets it). */
export interface MediaMigrationStatus {
  state: MediaMigrationState
  startedAt?: string | null
  finishedAt?: string | null
  limit: number
  includeScreenshots: boolean
  gamesProcessed: number
  gamesFailed: number
  headersMigrated: number
  screenshotsMigrated: number
  filesFailed: number
  error?: string | null
}

export interface StartMediaMigrationRequest {
  gameIds?: number[]
  limit: number
  includeScreenshots: boolean
}
