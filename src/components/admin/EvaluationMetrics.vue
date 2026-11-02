<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AT_K_METRICS, flattenMetrics } from '@/utils/metrics'
import type { EvaluationResults } from '@/types/api'

// Strategy comparison: one table of the @K metrics (rows grouped by K) and one of the strategy-level metrics.
// The best value in each column (per K) is highlighted.

const props = defineProps<{ results: EvaluationResults }>()

const { locale } = useI18n()
const flat = computed(() => flattenMetrics(props.results))

function fmt(v: number | undefined) {
  return v === undefined
    ? '—'
    : v.toLocaleString(locale.value, { maximumFractionDigits: 4, minimumFractionDigits: 4 })
}
function isBest(key: string, v: number | undefined) {
  return v !== undefined && flat.value.strategies.length > 1 && flat.value.best[key] === v && v > 0
}
</script>

<template>
  <div class="metrics">
    <p v-if="!flat.strategies.length" class="muted">{{ $t('evaluation.noMetrics') }}</p>
    <template v-else>
      <div class="table-wrap">
        <table>
          <caption>
            {{
              $t('evaluation.atKCaption')
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ $t('evaluation.strategy') }}</th>
              <th scope="col" class="num">K</th>
              <th v-for="m in AT_K_METRICS" :key="m" scope="col" class="num">
                {{ $t(`evaluation.metrics.${m}`) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in flat.atK"
              :key="`${row.k}-${row.strategy}`"
              :class="{ 'group-start': row.strategy === flat.strategies[0] }"
            >
              <th scope="row">{{ row.strategy }}</th>
              <td class="num">{{ row.k }}</td>
              <td
                v-for="m in AT_K_METRICS"
                :key="m"
                class="num"
                :class="{ best: isBest(`${row.k}:${m}`, row.metrics[m]) }"
              >
                {{ fmt(row.metrics[m]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="flat.strategyMetrics.length" class="table-wrap">
        <table>
          <caption>
            {{
              $t('evaluation.strategyCaption')
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ $t('evaluation.strategy') }}</th>
              <th v-for="m in flat.strategyMetrics" :key="m" scope="col" class="num">
                {{ $te(`evaluation.metrics.${m}`) ? $t(`evaluation.metrics.${m}`) : m }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in flat.perStrategy" :key="row.strategy">
              <th scope="row">{{ row.strategy }}</th>
              <td
                v-for="m in flat.strategyMetrics"
                :key="m"
                class="num"
                :class="{ best: isBest(m, row.values[m]) }"
              >
                {{ fmt(row.values[m]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.metrics {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
caption {
  margin-bottom: 0.5rem;
  font-weight: 600;
  text-align: left;
}
th,
td {
  padding: 0.375rem 0.75rem;
  border-bottom: 1px solid var(--c-border);
  text-align: left;
  white-space: nowrap;
}
thead th {
  color: var(--c-text-muted);
  font-weight: 600;
}
tbody th {
  font-weight: 600;
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
tr.group-start > * {
  border-top: 2px solid var(--c-surface-3);
}
td.best {
  color: var(--c-positive);
  font-weight: 700;
}
</style>
