import { computed, reactive, watch } from 'vue'
import { ratingService } from '@/services/ratingService'
import { usePagedList } from './usePagedList'
import type { GameRating, RateGameRequest } from '@/types/api'

/** Editable fields of a library entry. Hours stay a string while typing (empty = not set). */
export interface EntryDraft {
  recommend: boolean | null
  rating: number | null
  hours: string
  comment: string
}

export type DraftField = keyof EntryDraft

function toDraft(entry: GameRating): EntryDraft {
  return {
    recommend: entry.recommend,
    rating: entry.rating,
    hours: entry.playerHours == null ? '' : String(entry.playerHours),
    comment: entry.comment ?? '',
  }
}

function sameField(a: EntryDraft, b: EntryDraft, field: DraftField) {
  return field === 'comment' ? a.comment.trim() === b.comment.trim() : a[field] === b[field]
}

const FIELDS: DraftField[] = ['recommend', 'rating', 'hours', 'comment']

/** undefined = invalid */
export function parseHours(value: string): number | null | undefined {
  const text = value.trim()
  if (!text) return null
  const n = Number(text)
  return Number.isInteger(n) && n >= 0 && n <= 1_000_000 ? n : undefined
}

/**
 * The profile's game library: progressively loaded entries, per-entry drafts, and saving
 * (one entry's comment, or every changed entry at once for "Save all").
 */
export function useLibraryEditor(pageSize = 20) {
  const list = usePagedList(
    async (page, limit, signal) => (await ratingService.list({ page, limit }, signal)).ratings,
    pageSize,
    (r) => r.gameId,
  )

  /** Last saved state per game id; drafts are compared against it */
  const saved = reactive(new Map<number, EntryDraft>())
  const drafts = reactive(new Map<number, EntryDraft>())
  const errors = reactive(new Map<number, string>())
  const savingIds = reactive(new Set<number>())

  // Every loaded entry gets a draft before it renders
  watch(
    list.items,
    (items) => {
      for (const entry of items) {
        if (drafts.has(entry.gameId)) continue
        const base = toDraft(entry)
        saved.set(entry.gameId, base)
        drafts.set(entry.gameId, { ...base })
      }
    },
    { immediate: true, flush: 'sync' },
  )

  function draftOf(entry: GameRating): EntryDraft {
    return drafts.get(entry.gameId)!
  }

  function setField<F extends DraftField>(gameId: number, field: F, value: EntryDraft[F]) {
    const draft = drafts.get(gameId)
    if (!draft) return
    draft[field] = value
    errors.delete(gameId)
  }

  function isFieldDirty(gameId: number, field: DraftField): boolean {
    const draft = drafts.get(gameId)
    const base = saved.get(gameId)
    return !!draft && !!base && !sameField(draft, base, field)
  }

  function isDirty(gameId: number): boolean {
    return FIELDS.some((f) => isFieldDirty(gameId, f))
  }

  const dirtyIds = computed(() => [...drafts.keys()].filter(isDirty))

  function requestFor(gameId: number, fields: DraftField[]): RateGameRequest | string {
    const draft = drafts.get(gameId)!
    const base = saved.get(gameId)!
    // Fields not being saved keep their saved value (PUT replaces the whole entry)
    const pick = (f: DraftField) => (fields.includes(f) ? draft : base)
    const hours = parseHours(pick('hours').hours)
    if (hours === undefined) return 'hours'
    return {
      recommend: pick('recommend').recommend,
      rating: pick('rating').rating,
      playerHours: hours,
      comment: pick('comment').comment.trim() || null,
    }
  }

  async function save(gameId: number, fields: DraftField[]): Promise<boolean> {
    const body = requestFor(gameId, fields)
    if (typeof body === 'string') {
      errors.set(gameId, body)
      return false
    }
    savingIds.add(gameId)
    errors.delete(gameId)
    try {
      const result = await ratingService.save(gameId, body)
      const base = { ...saved.get(gameId)! }
      const fresh = toDraft(result)
      for (const f of fields) (base as Record<DraftField, unknown>)[f] = fresh[f]
      saved.set(gameId, base)
      // Normalize what was saved (e.g. trimmed comment), keep other unsaved edits
      const draft = drafts.get(gameId)!
      for (const f of fields) (draft as Record<DraftField, unknown>)[f] = fresh[f]
      return true
    } catch (e) {
      errors.set(gameId, e instanceof Error ? e.message : String(e))
      return false
    } finally {
      savingIds.delete(gameId)
    }
  }

  function saveComment(gameId: number) {
    return save(gameId, ['comment'])
  }

  /** Saves every changed entry one by one; returns how many failed. */
  async function saveAll(): Promise<{ saved: number; failed: number }> {
    let ok = 0
    let failed = 0
    for (const id of dirtyIds.value) {
      if (await save(id, FIELDS)) ok++
      else failed++
    }
    return { saved: ok, failed }
  }

  function revert(gameId: number) {
    const base = saved.get(gameId)
    if (base) drafts.set(gameId, { ...base })
    errors.delete(gameId)
  }

  function reload() {
    list.reset()
    saved.clear()
    drafts.clear()
    errors.clear()
    return list.loadMore()
  }

  return {
    list,
    draftOf,
    setField,
    isDirty,
    isFieldDirty,
    dirtyIds,
    errors,
    savingIds,
    saveComment,
    saveAll,
    revert,
    reload,
  }
}
