import { ref, shallowRef } from 'vue'
import { isAbortError } from '@/services/api'

export interface Page<T> {
  items: T[]
}

/**
 * Progressive loading of a paged API list. The API's `count` is the number of items on the page,
 * so the list is complete when a page comes back shorter than `limit`.
 * One request at a time; `reset()` aborts the running one (e.g. when the query changes).
 */
export function usePagedList<T>(
  fetchPage: (page: number, limit: number, signal: AbortSignal) => Promise<T[]>,
  limit = 20,
  key?: (item: T) => string | number,
) {
  const items = shallowRef<T[]>([])
  const loading = ref(false)
  const done = ref(false)
  const error = ref<unknown>(null)
  const loadedOnce = ref(false)

  let page = 0
  let controller: AbortController | null = null

  async function loadMore() {
    if (loading.value || done.value || error.value) return
    loading.value = true
    controller = new AbortController()
    const own = controller
    try {
      const next = await fetchPage(page + 1, limit, own.signal)
      if (own !== controller) return
      page++
      // Pages can shift when the data changes between requests: skip duplicates
      const seen = key ? new Set(items.value.map(key)) : null
      const fresh = seen ? next.filter((item) => !seen.has(key!(item))) : next
      items.value = [...items.value, ...fresh]
      if (next.length < limit) done.value = true
      loadedOnce.value = true
    } catch (e) {
      if (isAbortError(e) || own !== controller) return
      error.value = e
    } finally {
      if (own === controller) {
        loading.value = false
        controller = null
      }
    }
  }

  function reset() {
    controller?.abort()
    controller = null
    page = 0
    items.value = []
    loading.value = false
    done.value = false
    error.value = null
    loadedOnce.value = false
  }

  /** After a failure: clear the error and try the same page again. */
  function retry() {
    error.value = null
    return loadMore()
  }

  /** Local edits (e.g. an item removed after an action) without refetching. */
  function setItems(next: T[]) {
    items.value = next
  }

  return {
    items,
    loading,
    done,
    error,
    loadedOnce,
    loadMore,
    reset,
    retry,
    setItems,
    abort: () => controller?.abort(),
  }
}
