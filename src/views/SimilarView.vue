<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { gameService } from '@/services/gameService'
import { ApiError, isAbortError } from '@/services/api'
import GameCard from '@/components/games/GameCard.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { GameInfo } from '@/types/api'

// Games closest to one game by vector (GET /api/games/{id}/similar). The API returns the top `limit` at once
// (max 100), so "show more" asks again with a larger limit.

const STEP = 20
const MAX = 100

const props = defineProps<{ id: number }>()

const game = shallowRef<GameInfo | null>(null)
const games = shallowRef<GameInfo[]>([])
const limit = ref(STEP)
const loading = ref(false)
const error = shallowRef<unknown>(null)
let controller: AbortController | null = null

async function load() {
  controller?.abort()
  controller = new AbortController()
  const own = controller
  loading.value = true
  error.value = null
  try {
    const [info, similar] = await Promise.all([
      game.value?.gameId === props.id
        ? Promise.resolve(game.value)
        : gameService.get(props.id, own.signal).catch(() => null),
      gameService.similar(props.id, limit.value, own.signal),
    ])
    game.value = info
    games.value = similar.games
  } catch (e) {
    if (!isAbortError(e)) error.value = e
  } finally {
    if (own === controller) loading.value = false
  }
}

watch(
  () => props.id,
  () => {
    games.value = []
    limit.value = STEP
    load()
  },
  { immediate: true },
)
onBeforeUnmount(() => controller?.abort())

function showMore() {
  limit.value = Math.min(MAX, limit.value + STEP)
  load()
}

/** 404 = the game has no vector yet (new or never vectorized) */
const noVector = computed(() => error.value instanceof ApiError && error.value.status === 404)
const canShowMore = computed(() => games.value.length >= limit.value && limit.value < MAX)
</script>

<template>
  <div class="page similar-page">
    <section class="section" aria-labelledby="similar-h">
      <h1 id="similar-h" class="title">
        {{ $t('similar.title') }}
        <RouterLink
          v-if="game"
          :to="{ name: 'game', params: { id: game.gameId } }"
          translate="no"
          >{{ game.title }}</RouterLink
        >
      </h1>
      <p class="muted small">{{ $t('similar.hint') }}</p>

      <div class="results">
        <GameCard v-for="g in games" :key="g.gameId" :game="g" variant="search" />
      </div>

      <LoadingIndicator v-if="loading" />
      <EmptyState v-else-if="noVector" :text="$t('similar.noVector')" />
      <ErrorMessage v-else-if="error" :error="error" retryable @retry="load" />
      <EmptyState v-else-if="!games.length" :text="$t('similar.empty')" />
      <div v-else-if="canShowMore" class="more">
        <button type="button" class="btn btn-ghost" @click="showMore">
          {{ $t('common.more') }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.similar-page {
  max-width: var(--w-search);
}
.title {
  font-size: 1.5rem;
}
.results {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.more {
  display: flex;
  justify-content: center;
}
</style>
