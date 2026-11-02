import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { recommendationService } from '@/services/recommendationService'
import { isAbortError } from '@/services/api'
import type { CreateRecommendationRequest, Recommendation } from '@/types/api'

const POLL_START_MS = 1000
const POLL_MAX_MS = 3000

/**
 * Starts a recommendation calculation and polls it until the backend marks it completed.
 * The ML worker answers in ~0.3 s (the first run after a worker start ~6 s); while the worker is down the
 * request stays queued, so polling continues (slower) until the user leaves the page.
 */
export function useRecommendationRun() {
  const result = shallowRef<Recommendation | null>(null)
  const status = ref<'idle' | 'starting' | 'queued' | 'completed' | 'failed'>('idle')
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
      waitedSeconds.value = Math.round((Date.now() - startedAt) / 1000)
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

  async function start(request: CreateRecommendationRequest) {
    stop()
    error.value = null
    result.value = null
    waitedSeconds.value = 0
    status.value = 'starting'
    startedAt = Date.now()
    try {
      const created = await recommendationService.create(request)
      // Completed right away when the popular-games fallback was used
      await poll(created.id, POLL_START_MS)
    } catch (e) {
      error.value = e
      status.value = 'failed'
    }
  }

  /** Shows a stored recommendation (the latest one) without calculating a new one. */
  async function show(id: number) {
    stop()
    startedAt = Date.now()
    await poll(id, POLL_START_MS)
  }

  onBeforeUnmount(stop)

  return { result, status, error, waitedSeconds, start, show, stop }
}
