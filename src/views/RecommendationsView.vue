<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { userService } from '@/services/userService'
import { recommendationService } from '@/services/recommendationService'
import { ApiError, isAbortError } from '@/services/api'
import { useRecommendationRun } from '@/composables/useRecommendationRun'
import { useToast } from '@/composables/useToast'
import { useErrorMessage } from '@/composables/useErrorMessage'
import { formatDateTime } from '@/utils/format'
import RecommendationParams from '@/components/recommendations/RecommendationParams.vue'
import GameCard from '@/components/games/GameCard.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { Recommendation, RecommendationSettings, RecommendedGame } from '@/types/api'

// /recommendations: params + Calculate + previous recommendations.
// /recommendations/:id: the same page showing (and polling) one stored recommendation, so a reload or the back
// button returns to the same list. Calculate creates a new recommendation and moves to its page.
const props = defineProps<{ id?: number }>()

const { t, locale } = useI18n()
const router = useRouter()
const toast = useToast()
const errorMessage = useErrorMessage()
const run = useRecommendationRun()

const paramsOpen = ref(false)
const limit = ref(20)
const settings = ref<RecommendationSettings>({
  mainstream: 10,
  dislikeMode: 'ignore',
  dislikeStrength: 50,
})
const settingsLoaded = ref(false)
const settingsError = shallowRef<unknown>(null)
const creating = ref(false)

// Without an id the form starts from the user's saved defaults; changes here are not saved back
async function loadSettings() {
  settingsError.value = null
  try {
    const { mainstream, dislikeMode, dislikeStrength } = await userService.getSettings()
    settings.value = { mainstream, dislikeMode, dislikeStrength }
    settingsLoaded.value = true
  } catch (e) {
    settingsError.value = e
  }
}

// With an id the form shows the parameters that recommendation was calculated with
function applyParams(rec: Recommendation) {
  settings.value = {
    mainstream: rec.mainstream,
    dislikeMode: rec.dislikeMode,
    dislikeStrength: rec.dislikeStrength,
  }
  limit.value = rec.limit
  settingsLoaded.value = true
}

watch(
  () => props.id,
  (id) => {
    if (id) {
      settingsLoaded.value = false
      run.show(id)
    } else {
      run.stop()
      loadSettings()
      loadHistory()
    }
  },
  { immediate: true },
)
// Once per id: the first response (queued or completed) carries the parameters
watch(run.current, (rec) => {
  if (rec && rec.id === props.id && !settingsLoaded.value) applyParams(rec)
})

async function calculate() {
  creating.value = true
  try {
    const created = await recommendationService.create({
      limit: Math.min(100, Math.max(3, limit.value || 20)),
      ...settings.value,
    })
    await router.push({ name: 'recommendation', params: { id: created.id } })
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    creating.value = false
  }
}

const games = computed(() => run.result.value?.games ?? [])
const busy = computed(() => creating.value || run.status.value === 'queued')
const waiting = computed(() => run.status.value === 'loading' || run.status.value === 'queued')
const notFound = computed(
  () => run.error.value instanceof ApiError && run.error.value.status === 404,
)
const statusText = computed(() => {
  if (run.status.value === 'queued')
    return run.waitedSeconds.value >= 15
      ? t('recommendations.queuedLong')
      : t('recommendations.queued')
  return ''
})
const finishedAt = computed(() => formatDateTime(run.result.value?.finishedAt, locale.value))

// Previous recommendations (only on /recommendations)
const HISTORY_LIMIT = 10
const history = shallowRef<Recommendation[]>([])
const historyLoading = ref(false)
const historyError = shallowRef<unknown>(null)
let historyController: AbortController | null = null
async function loadHistory() {
  historyController?.abort()
  historyController = new AbortController()
  const own = historyController
  historyLoading.value = true
  historyError.value = null
  try {
    history.value = (
      await recommendationService.history({ page: 1, limit: HISTORY_LIMIT }, own.signal)
    ).recommendations
  } catch (e) {
    if (!isAbortError(e)) historyError.value = e
  } finally {
    if (own === historyController) historyLoading.value = false
  }
}
function historyLine(rec: Recommendation) {
  const date = formatDateTime(rec.finishedAt ?? rec.createdAt, locale.value) ?? ''
  if (rec.status !== 'completed') return `${date} · ${t('recommendations.historyQueued')}`
  const source =
    rec.source === 'personal'
      ? t('recommendations.historyPersonal')
      : t('recommendations.historyPopular')
  return `${date} · ${source} · ${t('recommendations.historyCount', { n: rec.count })}`
}

// Feedback on single recommended games: the API also puts liked games in "planned" and disliked ones in "rejected"
// (weak likes / dislikes, never recommended again). `null` = the neutral "–" button: clears the feedback.
const feedback = ref(new Map<number, boolean | null>())
watch(
  () => props.id,
  () => feedback.value.clear(),
)
async function sendFeedback(game: RecommendedGame, liked: boolean | null) {
  const rec = run.result.value
  if (!rec) return
  const current = likedOf(game) ?? null
  const next = current === liked ? null : liked
  if (next === current) return
  feedback.value.set(game.gameId, next)
  try {
    await recommendationService.feedback(rec.id, game.gameId, next)
  } catch (e) {
    feedback.value.set(game.gameId, current ?? null)
    toast.error(errorMessage(e))
  }
}
function likedOf(game: RecommendedGame) {
  return feedback.value.has(game.gameId) ? feedback.value.get(game.gameId) : game.liked
}
</script>

<template>
  <div class="page recs">
    <div class="calc">
      <button
        type="button"
        class="btn btn-primary btn-lg calc-btn"
        :disabled="busy"
        @click="calculate"
      >
        {{ busy ? $t('recommendations.calculating') : $t('recommendations.calculate') }}
      </button>
    </div>
    <RouterLink v-if="id" :to="{ name: 'recommendations' }" class="small back">
      ← {{ $t('recommendations.allRecommendations') }}
    </RouterLink>

    <section class="section params-section">
      <button
        type="button"
        class="toggle-params"
        :aria-expanded="paramsOpen"
        aria-controls="rec-params"
        @click="paramsOpen = !paramsOpen"
      >
        {{ paramsOpen ? $t('recommendations.hideParams') : $t('recommendations.showParams') }}
        <span aria-hidden="true">{{ paramsOpen ? '▲' : '▼' }}</span>
      </button>
      <div v-show="paramsOpen" id="rec-params" class="panel">
        <h2 class="params-title">{{ $t('recommendations.params') }}</h2>
        <ErrorMessage
          v-if="!id && settingsError"
          :error="settingsError"
          retryable
          @retry="loadSettings"
        />
        <EmptyState v-else-if="id && run.error.value" :text="$t('recommendations.noParams')" />
        <LoadingIndicator v-else-if="!settingsLoaded" />
        <RecommendationParams
          v-else
          v-model="settings"
          v-model:limit="limit"
          layout="recommendations"
          :disabled="busy"
        />
      </div>
    </section>

    <section v-if="!id" class="section" aria-labelledby="history-h">
      <h2 id="history-h">{{ $t('recommendations.history') }}</h2>
      <LoadingIndicator v-if="historyLoading && !history.length" />
      <ErrorMessage v-else-if="historyError" :error="historyError" retryable @retry="loadHistory" />
      <EmptyState v-else-if="!history.length" :text="$t('recommendations.historyEmpty')" />
      <ul v-else class="history">
        <li v-for="rec in history" :key="rec.id">
          <RouterLink :to="{ name: 'recommendation', params: { id: rec.id } }" class="history-item">
            {{ historyLine(rec) }}
          </RouterLink>
        </li>
      </ul>
    </section>

    <section v-else class="section" aria-labelledby="results-h" aria-live="polite">
      <h2 id="results-h">{{ $t('recommendations.results') }}</h2>

      <LoadingIndicator v-if="waiting" :label="statusText || undefined" />
      <EmptyState v-else-if="notFound" :text="$t('recommendations.notFound')">
        <RouterLink :to="{ name: 'recommendations' }" class="btn btn-primary">{{
          $t('recommendations.allRecommendations')
        }}</RouterLink>
      </EmptyState>
      <ErrorMessage
        v-else-if="run.error.value"
        :error="run.error.value"
        retryable
        @retry="id && run.show(id)"
      />
      <template v-else-if="run.result.value">
        <p class="summary small muted">
          <span v-if="run.result.value.source === 'personal'">
            {{ $t('recommendations.personal', { n: run.result.value.usedRatings ?? 0 }) }}
          </span>
          <span v-else>{{ $t('recommendations.popularFallback') }}</span>
          <span v-if="finishedAt"> · {{ finishedAt }}</span>
        </p>
        <p v-if="run.result.value.error" class="notice small">
          {{ $t('recommendations.fallbackReason', { error: run.result.value.error }) }}
        </p>
        <EmptyState v-if="!games.length" :text="$t('recommendations.empty')" />
        <div class="list">
          <GameCard v-for="game in games" :key="game.gameId" :game="game" variant="recommendation">
            <template #actions>
              <div
                class="feedback"
                role="group"
                :aria-label="$t('recommendations.feedbackFor', { title: game.title })"
              >
                <span class="small muted">{{ $t('recommendations.goodPick') }}</span>
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="likedOf(game) === true ? 'btn-positive' : 'btn-ghost'"
                  :aria-pressed="likedOf(game) === true"
                  :title="$t('recommendations.goodPickYes')"
                  @click="sendFeedback(game, true)"
                >
                  👍
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-ghost neutral"
                  :class="{ selected: likedOf(game) == null }"
                  :aria-pressed="likedOf(game) == null"
                  :title="$t('recommendations.goodPickNeutral')"
                  @click="sendFeedback(game, null)"
                >
                  –
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="likedOf(game) === false ? 'btn-negative' : 'btn-ghost'"
                  :aria-pressed="likedOf(game) === false"
                  :title="$t('recommendations.goodPickNo')"
                  @click="sendFeedback(game, false)"
                >
                  👎
                </button>
              </div>
            </template>
          </GameCard>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.recs {
  max-width: var(--w-recs);
  gap: var(--sp-3);
}
.calc {
  display: flex;
  justify-content: center;
}
.calc-btn {
  width: min(32rem, 100%);
}
.back {
  align-self: flex-start;
}
.history {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.history-item {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  background: var(--c-surface);
  color: var(--c-text);
}
.history-item:hover {
  background: var(--c-surface-2);
  text-decoration: none;
}
.params-section {
  gap: 0.75rem;
}
.toggle-params {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border: 0;
  background: none;
  color: var(--c-accent);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.params-title {
  margin-bottom: var(--sp-2);
  font-size: 1.125rem;
}
.list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.notice {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  background: var(--c-warning-soft);
}
.feedback {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
}
/* "No opinion": does nothing on its own, only shows that the game isn't rated (selected by default) */
.neutral {
  min-width: 2.25rem;
  color: var(--c-text-muted);
}
.neutral.selected {
  background: var(--c-surface-2);
  border-color: var(--c-border);
}
</style>
