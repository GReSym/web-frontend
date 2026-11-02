<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '@/services/userService'
import { recommendationService } from '@/services/recommendationService'
import { useRecommendationRun } from '@/composables/useRecommendationRun'
import { useToast } from '@/composables/useToast'
import { useErrorMessage } from '@/composables/useErrorMessage'
import { formatDateTime } from '@/utils/format'
import RecommendationParams from '@/components/recommendations/RecommendationParams.vue'
import GameCard from '@/components/games/GameCard.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { RecommendationSettings, RecommendedGame } from '@/types/api'

const { t, locale } = useI18n()
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
const requested = ref(false)

// Initial values come from the user's saved defaults; changes here are not saved back
async function loadSettings() {
  settingsError.value = null
  try {
    settings.value = await userService.getSettings()
    settingsLoaded.value = true
  } catch (e) {
    settingsError.value = e
  }
}
loadSettings()

function calculate() {
  requested.value = true
  run.start({ limit: Math.min(100, Math.max(3, limit.value || 20)), ...settings.value })
}

const games = computed(() => run.result.value?.games ?? [])
const busy = computed(() => run.status.value === 'starting' || run.status.value === 'queued')
const statusText = computed(() => {
  if (run.status.value === 'starting') return t('recommendations.starting')
  if (run.status.value === 'queued')
    return run.waitedSeconds.value >= 15
      ? t('recommendations.queuedLong')
      : t('recommendations.queued')
  return ''
})
const finishedAt = computed(() => formatDateTime(run.result.value?.finishedAt, locale.value))

// Feedback on single recommended games (stored by the API for later evaluation)
const feedback = ref(new Map<number, boolean | null>())
async function sendFeedback(game: RecommendedGame, liked: boolean) {
  const rec = run.result.value
  if (!rec) return
  const current = feedback.value.has(game.gameId) ? feedback.value.get(game.gameId) : game.liked
  const next = current === liked ? null : liked
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
        <ErrorMessage v-if="settingsError" :error="settingsError" retryable @retry="loadSettings" />
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

    <section v-if="requested" class="section" aria-labelledby="results-h" aria-live="polite">
      <h2 id="results-h">{{ $t('recommendations.results') }}</h2>

      <LoadingIndicator v-if="busy" :label="statusText" />
      <ErrorMessage
        v-else-if="run.error.value"
        :error="run.error.value"
        retryable
        @retry="calculate"
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
          <GameCard
            v-for="game in games"
            :key="game.gameId"
            :game="game"
            variant="recommendation"
            :score="game.score"
          >
            <template #actions>
              <div class="feedback">
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
</style>
