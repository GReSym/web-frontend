<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { gameService } from '@/services/gameService'
import { recommendationService } from '@/services/recommendationService'
import { ratingService, toRateRequest } from '@/services/ratingService'
import { isAbortError } from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useErrorMessage } from '@/composables/useErrorMessage'
import GameCard from '@/components/games/GameCard.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { GameInfo, GameRating } from '@/types/api'

const ROW = 3
/** "Played much": more than this many hours and no Yes/No yet */
const MIN_HOURS = 10

const auth = useAuthStore()
const { t } = useI18n()
const toast = useToast()
const errorMessage = useErrorMessage()

// One small loader per section so each has its own loading / error / empty state
function useSection<T>(fetch: (signal: AbortSignal) => Promise<T[]>) {
  const items = shallowRef<T[]>([])
  const loading = ref(false)
  const error = ref<unknown>(null)
  let controller: AbortController | null = null

  async function load() {
    controller?.abort()
    controller = new AbortController()
    const own = controller
    loading.value = true
    error.value = null
    try {
      items.value = await fetch(own.signal)
    } catch (e) {
      if (!isAbortError(e)) error.value = e
    } finally {
      if (own === controller) loading.value = false
    }
  }
  onBeforeUnmount(() => controller?.abort())
  return { items, loading, error, load }
}

const popular = useSection<GameInfo>(
  async (signal) => (await gameService.popular({ page: 1, limit: ROW }, signal)).games,
)

// The newest recommendation of the user (the list endpoint has no games, so it's fetched by id)
const lastRecs = useSection<GameInfo>(async (signal) => {
  const history = await recommendationService.history({ page: 1, limit: 5 }, signal)
  const latest = history.recommendations.find((r) => r.status === 'completed' && r.count > 0)
  if (!latest) return []
  const full = await recommendationService.get(latest.id, signal)
  return (full.games ?? []).slice(0, ROW)
})

// Asks for a few extra so the row stays full after Love/Hate removes a game
const playedMuch = useSection<GameRating>(async (signal) =>
  (
    await ratingService.list(
      { page: 1, limit: ROW * 3, minHours: MIN_HOURS, unevaluated: true },
      signal,
    )
  ).ratings.filter((r) => r.game),
)

popular.load()

watch(
  () => auth.isAuthenticated,
  (signedIn) => {
    if (signedIn) {
      lastRecs.load()
      playedMuch.load()
    } else {
      lastRecs.items.value = []
      playedMuch.items.value = []
    }
  },
  { immediate: true },
)

const pending = ref(new Set<number>())

async function evaluate(entry: GameRating, recommend: boolean) {
  pending.value.add(entry.gameId)
  try {
    await ratingService.save(entry.gameId, toRateRequest(entry, { recommend }))
    // It no longer matches "played much but no review"
    playedMuch.items.value = playedMuch.items.value.filter((r) => r.gameId !== entry.gameId)
    toast.success(
      recommend
        ? t('home.loved', { title: entry.game?.title })
        : t('home.hated', { title: entry.game?.title }),
    )
    if (playedMuch.items.value.length < ROW) playedMuch.load()
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    pending.value.delete(entry.gameId)
  }
}
</script>

<template>
  <div class="page home">
    <section class="section" aria-labelledby="popular-h">
      <h2 id="popular-h">{{ $t('home.popular') }}</h2>
      <LoadingIndicator v-if="popular.loading.value && !popular.items.value.length" />
      <ErrorMessage
        v-else-if="popular.error.value"
        :error="popular.error.value"
        retryable
        @retry="popular.load"
      />
      <EmptyState v-else-if="!popular.items.value.length" :text="$t('home.noPopular')" />
      <div v-else class="row3">
        <GameCard v-for="game in popular.items.value" :key="game.gameId" :game="game" />
      </div>
    </section>

    <!-- Omitted when there's no previous recommendation -->
    <section
      v-if="
        auth.isAuthenticated &&
        (lastRecs.loading.value || lastRecs.error.value || lastRecs.items.value.length)
      "
      class="section"
      aria-labelledby="last-h"
    >
      <h2 id="last-h">{{ $t('home.lastRecommendations') }}</h2>
      <LoadingIndicator v-if="lastRecs.loading.value && !lastRecs.items.value.length" />
      <ErrorMessage
        v-else-if="lastRecs.error.value"
        :error="lastRecs.error.value"
        retryable
        @retry="lastRecs.load"
      />
      <div v-else class="row3">
        <GameCard v-for="game in lastRecs.items.value" :key="game.gameId" :game="game" />
      </div>
    </section>

    <div class="cta">
      <RouterLink :to="{ name: 'recommendations' }" class="btn btn-primary btn-lg">
        {{ $t('home.recommendMe') }}
      </RouterLink>
    </div>

    <section class="section" aria-labelledby="played-h">
      <h2 id="played-h">{{ $t('home.playedMuch') }}</h2>
      <p class="muted small">{{ $t('home.playedMuchHint', { hours: MIN_HOURS }) }}</p>

      <EmptyState v-if="!auth.isAuthenticated" :text="$t('home.playedMuchGuest')">
        <RouterLink :to="{ name: 'login', query: { redirect: '/' } }" class="btn btn-primary">{{
          $t('nav.login')
        }}</RouterLink>
      </EmptyState>
      <LoadingIndicator v-else-if="playedMuch.loading.value && !playedMuch.items.value.length" />
      <ErrorMessage
        v-else-if="playedMuch.error.value"
        :error="playedMuch.error.value"
        retryable
        @retry="playedMuch.load"
      />
      <EmptyState v-else-if="!playedMuch.items.value.length" :text="$t('home.playedMuchEmpty')" />
      <div v-else class="row3">
        <GameCard
          v-for="entry in playedMuch.items.value.slice(0, ROW)"
          :key="entry.gameId"
          :game="entry.game!"
        >
          <template #actions>
            <p class="muted small">{{ $t('home.hoursPlayed', { hours: entry.playerHours }) }}</p>
            <div class="love-hate">
              <button
                type="button"
                class="btn btn-positive"
                :disabled="pending.has(entry.gameId)"
                @click="evaluate(entry, true)"
              >
                {{ $t('home.loveIt') }}
              </button>
              <button
                type="button"
                class="btn btn-negative"
                :disabled="pending.has(entry.gameId)"
                @click="evaluate(entry, false)"
              >
                {{ $t('home.hateIt') }}
              </button>
            </div>
          </template>
        </GameCard>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: min(var(--w-home), 85vw);
}
.row3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-2);
}
.cta {
  display: flex;
  justify-content: center;
}
.love-hate {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
@media (max-width: 64rem) {
  .home {
    max-width: none;
  }
}
@media (max-width: 40rem) {
  .row3 {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
