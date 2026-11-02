<script setup lang="ts">
import { watch } from 'vue'
import { gameService } from '@/services/gameService'
import { usePagedList } from '@/composables/usePagedList'
import GameReview from './GameReview.vue'
import InfiniteSentinel from '@/components/common/InfiniteSentinel.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'

// Reviews are appended page by page as the user scrolls down.

const props = defineProps<{ gameId: number }>()

const list = usePagedList(
  async (page, limit, signal) =>
    (await gameService.reviews(props.gameId, { page, limit }, signal)).reviews,
  10,
  (r) => r.id,
)

watch(
  () => props.gameId,
  () => {
    list.reset()
    list.loadMore()
  },
  { immediate: true },
)
</script>

<template>
  <div class="reviews">
    <GameReview v-for="review in list.items.value" :key="review.id" :review="review" />
    <LoadingIndicator v-if="list.loading.value" />
    <ErrorMessage
      v-else-if="list.error.value"
      :error="list.error.value"
      retryable
      @retry="list.retry"
    />
    <EmptyState
      v-else-if="list.done.value && !list.items.value.length"
      :text="$t('reviews.empty')"
    />
    <InfiniteSentinel
      :active="!list.done.value && !list.error.value"
      :loading="list.loading.value"
      @load="list.loadMore"
    />
  </div>
</template>

<style scoped>
.reviews {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
</style>
