<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { gameListService } from '@/services/gameListService'
import { usePagedList } from '@/composables/usePagedList'
import { useToast } from '@/composables/useToast'
import { useErrorMessage } from '@/composables/useErrorMessage'
import GameCard from '@/components/games/GameCard.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { GameListEntry, GameListStatus } from '@/types/api'

// One of the user's lists (planned / rejected). Paged with a "Show more" button, not infinite scroll:
// the planned box sits above the rejected one, so scrolling must be able to reach it.

const props = defineProps<{ status: GameListStatus }>()

const { t } = useI18n()
const toast = useToast()
const errorMessage = useErrorMessage()

const list = usePagedList(
  async (page, limit, signal) =>
    (await gameListService.list(props.status, { page, limit }, signal)).games,
  20,
  (e) => e.gameId,
)
list.loadMore()

const headingId = computed(() => `list-${props.status}-h`)
const entries = computed(() => list.items.value.filter((e) => e.game))

async function remove(entry: GameListEntry) {
  const before = list.items.value
  list.setItems(before.filter((e) => e.gameId !== entry.gameId))
  try {
    await gameListService.remove(entry.gameId)
  } catch (e) {
    list.setItems(before)
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <section class="section" :aria-labelledby="headingId">
    <h2 :id="headingId">{{ t(`lists.${status}.title`) }}</h2>
    <p class="muted small">{{ t(`lists.${status}.hint`) }}</p>
    <div class="panel items">
      <GameCard v-for="entry in entries" :key="entry.gameId" :game="entry.game!" variant="search">
        <template #actions>
          <div class="actions">
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              :aria-label="t('lists.removeFrom', { title: entry.game!.title })"
              @click="remove(entry)"
            >
              {{ t('lists.remove') }}
            </button>
          </div>
        </template>
      </GameCard>
      <LoadingIndicator v-if="list.loading.value" />
      <ErrorMessage
        v-else-if="list.error.value"
        :error="list.error.value"
        retryable
        @retry="list.retry"
      />
      <EmptyState
        v-else-if="list.done.value && !list.items.value.length"
        :text="t(`lists.${status}.empty`)"
      />
      <button
        v-else-if="!list.done.value"
        type="button"
        class="btn btn-ghost more"
        @click="list.loadMore"
      >
        {{ t('common.more') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.items {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.actions {
  margin-top: 0.5rem;
}
.more {
  align-self: center;
}
</style>
