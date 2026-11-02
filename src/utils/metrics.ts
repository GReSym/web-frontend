import type { EvaluationResults, MetricsAtK } from '@/types/api'

// Turns the evaluation report's `strategies` object into table rows. Strategy names, K values and
// strategy-level metrics are all taken from the data (new strategies or Ks need no frontend change).

export const AT_K_METRICS = ['precision', 'recall', 'hitRate', 'ndcg'] as const
export type AtKMetric = (typeof AT_K_METRICS)[number]

export interface AtKRow {
  strategy: string
  k: number
  metrics: Partial<Record<AtKMetric, number>>
}

export interface StrategyRow {
  strategy: string
  /** numeric strategy-level values (mrr, coverage, …) */
  values: Record<string, number>
}

export interface FlatMetrics {
  strategies: string[]
  ks: number[]
  atK: AtKRow[]
  /** names of strategy-level metrics, mrr and coverage first */
  strategyMetrics: string[]
  perStrategy: StrategyRow[]
  /** best value per "k:metric" and per strategy-level metric (higher is better for all of them) */
  best: Record<string, number>
}

function isMetricsAtK(value: unknown): value is Partial<MetricsAtK> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function flattenMetrics(results: EvaluationResults | null | undefined): FlatMetrics {
  const strategiesObj = results?.strategies ?? {}
  const strategies = Object.keys(strategiesObj)
  const ksSet = new Set<number>()
  const levelSet = new Set<string>()
  const atK: AtKRow[] = []
  const perStrategy: StrategyRow[] = []
  const best: Record<string, number> = {}

  const consider = (key: string, value: number) => {
    if (!(key in best) || value > best[key]!) best[key] = value
  }

  for (const strategy of strategies) {
    const data = strategiesObj[strategy] ?? {}
    const values: Record<string, number> = {}
    const keys = Object.keys(data)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b))

    for (const key of keys) {
      const entry = data[key]
      if (!isMetricsAtK(entry)) continue
      const k = Number(key)
      ksSet.add(k)
      const metrics: AtKRow['metrics'] = {}
      for (const m of AT_K_METRICS) {
        const v = (entry as Record<string, unknown>)[m]
        if (typeof v === 'number') {
          metrics[m] = v
          consider(`${k}:${m}`, v)
        }
      }
      atK.push({ strategy, k, metrics })
    }

    for (const [key, value] of Object.entries(data)) {
      if (/^\d+$/.test(key) || typeof value !== 'number') continue
      values[key] = value
      levelSet.add(key)
      consider(key, value)
    }
    perStrategy.push({ strategy, values })
  }

  const order = ['mrr', 'coverage']
  const strategyMetrics = [...levelSet].sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b)
  })

  // Group rows by K, then by strategy order, so strategies are compared side by side
  atK.sort((a, b) => a.k - b.k || strategies.indexOf(a.strategy) - strategies.indexOf(b.strategy))

  return {
    strategies,
    ks: [...ksSet].sort((a, b) => a - b),
    atK,
    strategyMetrics,
    perStrategy,
    best,
  }
}
