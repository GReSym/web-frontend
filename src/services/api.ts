// The single place that talks HTTP to the GReSym API.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export interface FieldError {
  field: string
  message: string
}

/** Any failed request. `status` 0 = network error / no response. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldError[]

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError'
}

let authToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

/** Called when an authenticated request gets 401 (expired or revoked token). */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

type QueryValue = string | number | boolean | null | undefined | (string | number)[]

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, QueryValue>
  body?: unknown
  signal?: AbortSignal
}

export function buildQuery(query: Record<string, QueryValue> | undefined): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item))
    } else {
      params.append(key, String(value))
    }
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

/**
 * Turns an error response into an ApiError. The API returns either
 * `{message, errors:[{field, message}]}` (validation) or a plain string (domain errors).
 */
export async function toApiError(response: Response): Promise<ApiError> {
  let text = ''
  try {
    text = await response.text()
  } catch {
    // ignore
  }

  if (text) {
    try {
      const data: unknown = JSON.parse(text)
      if (typeof data === 'string') return new ApiError(response.status, data)
      if (data && typeof data === 'object') {
        const obj = data as { message?: unknown; title?: unknown; errors?: unknown }
        const fieldErrors = Array.isArray(obj.errors)
          ? (obj.errors as FieldError[]).filter((e) => e && typeof e.message === 'string')
          : []
        const message =
          (typeof obj.message === 'string' && obj.message) ||
          (typeof obj.title === 'string' && obj.title) ||
          response.statusText
        return new ApiError(response.status, message, fieldErrors)
      }
    } catch {
      // A plain text body
      return new ApiError(response.status, text.slice(0, 500))
    }
  }

  return new ApiError(response.status, response.statusText || `HTTP ${response.status}`)
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  let response: Response
  try {
    response = await fetch(BASE_URL + path + buildQuery(options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (e) {
    if (isAbortError(e)) throw e
    throw new ApiError(0, 'Network error: the server is unreachable')
  }

  if (!response.ok) {
    if (response.status === 401 && authToken) onUnauthorized?.()
    throw await toApiError(response)
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
