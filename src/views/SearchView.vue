<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'
import { gameService } from '@/services/gameService'
import { usePagedList } from '@/composables/usePagedList'
import SearchFilters, { type SearchParams } from '@/components/search/SearchFilters.vue'
import GameCard from '@/components/games/GameCard.vue'
import InfiniteSentinel from '@/components/common/InfiniteSentinel.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'

// The search state lives in the URL (?q=&exact=0&tags=a,b), so results can be shared and survive reloads.

const PAGE = 20
const route = useRoute()
const router = useRouter()

function parse(query: LocationQuery): SearchParams {
  const q = typeof query.q === 'string' ? query.q : ''
  const exact = query.exact !== '0'
  const tags =
    typeof query.tags === 'string'
      ? query.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : []
  return { q, exact, tags }
}

const params = computed(() => parse(route.query))

const list = usePagedList(
  async (page, limit, signal) => {
    const { q, exact, tags } = params.value
    return (await gameService.search({ search: q, exact, tags, page, limit }, signal)).games
  },
  PAGE,
  (g) => g.gameId,
)

watch(
  () => JSON.stringify(params.value),
  () => {
    list.reset()
    list.loadMore()
  },
  { immediate: true },
)
onBeforeUnmount(list.abort)

function onChange(next: SearchParams) {
  router.push({
    name: 'search',
    query: {
      ...(next.q ? { q: next.q } : {}),
      ...(next.exact ? {} : { exact: '0' }),
      ...(next.tags.length ? { tags: next.tags.join(',') } : {}),
    },
  })
}

const slowHint = computed(
  () => !params.value.exact && !!params.value.q && list.loading.value && !list.items.value.length,
)
</script>

<template>
  <div class="page search-page">
    <SearchFilters :value="params" @change="onChange" />

    <section class="section" aria-labelledby="results-h">
      <h2 id="results-h">{{ $t('search.results') }}</h2>
      <p v-if="!params.q && !params.tags.length" class="muted small">
        {{ $t('search.browseHint') }}
      </p>

      <div class="results">
        <GameCard
          v-for="game in list.items.value"
          :key="game.gameId"
          :game="game"
          variant="search"
        />
      </div>

      <LoadingIndicator
        v-if="list.loading.value"
        :label="slowHint ? $t('search.meaningSlow') : undefined"
      />
      <ErrorMessage
        v-else-if="list.error.value"
        :error="list.error.value"
        retryable
        @retry="list.retry"
      />
      <EmptyState
        v-else-if="list.done.value && !list.items.value.length"
        :text="$t('search.empty')"
      />
      <p v-else-if="list.done.value" class="muted small end">{{ $t('search.end') }}</p>

      <InfiniteSentinel
        :active="list.loadedOnce.value && !list.done.value && !list.error.value"
        :loading="list.loading.value"
        @load="list.loadMore"
      />
    </section>
  </div>
</template>

<style scoped>
.search-page {
  max-width: var(--w-search);
}
.results {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.end {
  text-align: center;
}
</style>
