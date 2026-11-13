import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { recommendationService } from '@/services/recommendationService'
import { isAbortError } from '@/services/api'
import type { Recommendation } from '@/types/api'

const POLL_START_MS = 1000
const POLL_MAX_MS = 3000

/**
 * Loads a stored recommendation and polls it until the backend marks it completed.
 * The page `/recommendations/:id` uses it, so a reload or coming back from a game page shows the same list
 * (or keeps waiting for it) instead of calculating a new one.
 * The ML worker answers in ~0.3 s (the first run after a worker start ~6 s); while the worker is down the
 * request stays queued, so polling continues (slower) until the user leaves the page.
 */
export function useRecommendationRun() {
  /** Completed recommendation (with games) */
  const result = shallowRef<Recommendation | null>(null)
  /** The latest response, also while queued: its parameters fill the params form */
  const current = shallowRef<Recommendation | null>(null)
  const status = ref<'idle' | 'loading' | 'queued' | 'completed' | 'failed'>('idle')
  const error = ref<unknown>(null)
  const waitedSeconds = ref(0)

  let timer: ReturnType<typeof setTimeout> | null = null
  let controller: AbortController | null = null
  let startedAt = 0

  function stop() {
    if (timer) clearTimeout(timer)
    timer = null
    controller?.abort()
    controller = null
  }

  async function poll(id: number, delay: number) {
    controller = new AbortController()
    try {
      const rec = await recommendationService.get(id, controller.signal)
      current.value = rec
      // Measured from the recommendation's creation, so a reload doesn't reset the "taking long" hint
      const created = Date.parse(rec.createdAt)
      waitedSeconds.value = Math.round(
        (Date.now() - (Number.isNaN(created) ? startedAt : Math.min(created, startedAt))) / 1000,
      )
      if (rec.status === 'completed') {
        result.value = rec
        status.value = 'completed'
        return
      }
      status.value = 'queued'
      timer = setTimeout(() => poll(id, Math.min(delay * 1.5, POLL_MAX_MS)), delay)
    } catch (e) {
      if (isAbortError(e)) return
      error.value = e
      status.value = 'failed'
    }
  }

  /** Shows a stored recommendation, polling while it's still being calculated. */
  async function show(id: number) {
    stop()
    error.value = null
    result.value = null
    current.value = null
    waitedSeconds.value = 0
    status.value = 'loading'
    startedAt = Date.now()
    await poll(id, POLL_START_MS)
  }

  onBeforeUnmount(stop)

  return { result, current, status, error, waitedSeconds, show, stop }
}
