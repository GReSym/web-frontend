<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate, minutesToHours } from '@/utils/format'
import type { GameReview } from '@/types/api'

const props = defineProps<{ review: GameReview }>()

const { locale } = useI18n()
const LONG = 700
const expanded = ref(false)

const content = computed(() => props.review.content?.trim() ?? '')
const isLong = computed(() => content.value.length > LONG)
const text = computed(() =>
  isLong.value && !expanded.value ? content.value.slice(0, LONG).trimEnd() + '…' : content.value,
)
const date = computed(() => formatDate(props.review.createdAt, locale.value))
const hours = computed(() =>
  props.review.playtimeAtReview != null ? minutesToHours(props.review.playtimeAtReview) : null,
)
</script>

<template>
  <article class="review">
    <div
      class="indicator"
      :class="review.recommended ? 'up' : review.recommended === false ? 'down' : ''"
      role="img"
      :aria-label="review.recommended ? $t('reviews.positive') : $t('reviews.negative')"
    >
      <span aria-hidden="true">{{ review.recommended === false ? '👎' : '👍' }}</span>
    </div>
    <div class="body">
      <p class="meta">
        <span v-if="date">{{ date }}</span>
        <span v-if="hours !== null">{{ $t('reviews.playtime', { hours }) }}</span>
        <span v-if="review.writtenDuringEarlyAccess" class="tag">{{
          $t('reviews.earlyAccess')
        }}</span>
        <span v-if="review.votesUp">{{ $t('reviews.helpful', { n: review.votesUp }) }}</span>
      </p>
      <p class="text">{{ text }}</p>
      <button v-if="isLong" type="button" class="more" @click="expanded = !expanded">
        {{ expanded ? $t('common.less') : $t('common.more') }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.review {
  display: grid;
  grid-template-columns: 3.5rem 1fr;
  gap: var(--sp-2);
  padding: var(--sp-2);
  border-radius: var(--radius-lg);
  background: var(--c-surface);
}
.indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--c-surface-2);
  font-size: 1.5rem;
}
.indicator.up {
  background: var(--c-positive-soft);
}
.indicator.down {
  background: var(--c-negative-soft);
}
.body {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 1rem;
  color: var(--c-text-muted);
  font-size: 0.875rem;
}
.text {
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.more {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--c-accent);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
}
@media (max-width: 30rem) {
  .review {
    grid-template-columns: 2.5rem 1fr;
    gap: 0.75rem;
  }
  .indicator {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.125rem;
  }
}
</style>
