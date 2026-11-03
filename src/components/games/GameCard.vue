<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MediaImage from '@/components/common/MediaImage.vue'
import GameTags from './GameTags.vue'
import { developerLine, formatDate, formatNumber } from '@/utils/format'
import type { GameInfo } from '@/types/api'

// One game in a collection.
// compact: image on top, title and developer below (home page rows).
// search / recommendation: a wide row [image | title, developer, release date | tags (+ score)].
// Slots: `actions` (under the compact card / in the info column of a row), `aside` (top of the right column).

const props = withDefaults(
  defineProps<{
    game: GameInfo
    variant?: 'compact' | 'search' | 'recommendation'
    /** recommendation score from the backend; null = popular fallback (no score) */
    score?: number | null
    maxTags?: number
  }>(),
  { variant: 'compact', score: undefined, maxTags: 10 },
)

const { locale, t } = useI18n()
const to = computed(() => ({ name: 'game', params: { id: props.game.gameId } }))
const developer = computed(() => developerLine(props.game.developer, props.game.publisher))
const released = computed(
  () => formatDate(props.game.releaseDate, locale.value) ?? t('game.dateUnknown'),
)
const scoreText = computed(() =>
  typeof props.score === 'number' ? formatNumber(props.score, locale.value, 3) : null,
)
</script>

<template>
  <article v-if="variant === 'compact'" class="card compact">
    <RouterLink :to="to" class="image-link" :aria-label="game.title">
      <MediaImage :src="game.headerImageUrl" :alt="game.title" />
    </RouterLink>
    <div class="compact-info">
      <RouterLink :to="to" class="title" :title="game.title">{{ game.title }}</RouterLink>
      <span v-if="developer" class="dev" :title="developer">{{ developer }}</span>
    </div>
    <slot name="actions" />
  </article>

  <article v-else class="card row">
    <RouterLink :to="to" class="image-link" :aria-label="game.title">
      <MediaImage :src="game.headerImageUrl" :alt="game.title" />
    </RouterLink>
    <div class="row-info">
      <RouterLink :to="to" class="title big" :title="game.title">{{ game.title }}</RouterLink>
      <span v-if="developer" class="dev">{{ developer }}</span>
      <span class="date">{{ released }}</span>
      <slot name="actions" />
    </div>
    <div class="row-side">
      <slot name="aside" />
      <p v-if="variant === 'recommendation' && score !== undefined" class="score">
        <template v-if="scoreText">
          <span class="muted small">{{ $t('recommendations.score') }}</span>
          <strong>{{ scoreText }}</strong>
        </template>
        <span v-else class="muted small">{{ $t('recommendations.popularNoScore') }}</span>
      </p>
      <GameTags :tags="game.tags" :max="maxTags" />
    </div>
  </article>
</template>

<style scoped>
.card {
  min-width: 0;
}
.image-link {
  display: block;
  border-radius: var(--radius);
}
.title {
  color: var(--c-text);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.title:hover {
  color: var(--c-accent);
}
.dev,
.date {
  color: var(--c-text-muted);
  font-size: 0.875rem;
}
.compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.compact-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.compact .dev {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row {
  display: grid;
  grid-template-columns: 32fr 32fr 36fr;
  gap: var(--sp-2);
  align-items: start;
  padding: var(--sp-2);
  border-radius: var(--radius-lg);
  background: var(--c-surface);
}
.row-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.title.big {
  font-size: 1.125rem;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
.row-side {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}
.score {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.score strong {
  font-size: 1.125rem;
  color: var(--c-accent);
}

@media (max-width: 48rem) {
  .row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .row-side {
    grid-column: 1 / -1;
  }
}
@media (max-width: 30rem) {
  .row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
