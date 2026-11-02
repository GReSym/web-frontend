<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDateTime } from '@/utils/format'
import type { EvaluationRun } from '@/types/api'

// Evaluation #id (created, status, finished) + a 3×2 grid of its parameters.
// Used in the admin list (as a link) and on the evaluation page, in the same layout.

const props = defineProps<{ run: EvaluationRun; heading?: 'h1' | 'h2' | 'h3' }>()

const { locale, t } = useI18n()
const p = computed(() => props.run.parameters ?? {})
const show = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v))

const created = computed(() => formatDateTime(props.run.createdAt, locale.value) ?? '—')
const finished = computed(() => formatDateTime(props.run.finishedAt, locale.value) ?? '—')
const params = computed(() => [
  { label: t('evaluation.ks'), value: p.value.ks?.join(', ') },
  { label: t('evaluation.testSize'), value: p.value.testSize },
  { label: t('evaluation.testSelection'), value: p.value.testSelection },
  { label: t('evaluation.minTrainGames'), value: p.value.minTrainGames },
  {
    label: t('evaluation.minPlaytime'),
    value:
      p.value.minPlaytimeMinutes != null
        ? t('evaluation.minutes', { n: p.value.minPlaytimeMinutes })
        : undefined,
  },
  { label: t('evaluation.seed'), value: p.value.seed },
])
</script>

<template>
  <div class="summary">
    <div class="head">
      <component :is="heading ?? 'h3'" class="title">{{
        $t('evaluation.title', { id: run.id })
      }}</component>
      <span class="status" :class="run.status">{{ $t(`evaluation.status.${run.status}`) }}</span>
      <span class="muted small">{{ $t('evaluation.created') }}: {{ created }}</span>
      <span class="muted small">{{ $t('evaluation.finished') }}: {{ finished }}</span>
      <span v-if="run.usersEvaluated != null" class="muted small">{{
        $t('evaluation.users', { n: run.usersEvaluated })
      }}</span>
    </div>
    <dl class="grid">
      <div v-for="item in params" :key="item.label" class="cell">
        <dt>{{ item.label }}</dt>
        <dd>{{ show(item.value) }}</dd>
      </div>
    </dl>
    <p v-if="run.error" class="error small">{{ run.error }}</p>
  </div>
</template>

<style scoped>
.summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 1rem;
}
.title {
  font-size: 1.125rem;
}
.status {
  padding: 0 0.5rem;
  border-radius: var(--radius);
  background: var(--c-surface-3);
  font-size: 0.8125rem;
  font-weight: 600;
}
.status.completed {
  background: var(--c-positive-soft);
  color: var(--c-positive);
}
.status.failed {
  background: var(--c-negative-soft);
  color: var(--c-negative);
}
.status.running,
.status.queued {
  background: var(--c-warning-soft);
  color: var(--c-warning);
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem var(--sp-2);
  margin: 0;
}
.cell dt {
  color: var(--c-text-muted);
  font-size: 0.8125rem;
}
.cell dd {
  margin: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.error {
  color: var(--c-negative);
}
@media (max-width: 36rem) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
