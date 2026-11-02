<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { adminService } from '@/services/adminService'
import { ApiError, isAbortError } from '@/services/api'
import EvaluationSummary from '@/components/admin/EvaluationSummary.vue'
import EvaluationMetrics from '@/components/admin/EvaluationMetrics.vue'
import JsonViewer from '@/components/admin/JsonViewer.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { EvaluationRun } from '@/types/api'

const props = defineProps<{ id: number }>()

const run = shallowRef<EvaluationRun | null>(null)
const loading = ref(false)
const error = ref<unknown>(null)
const notFound = ref(false)
const view = ref<'tables' | 'json'>('tables')
let controller: AbortController | null = null
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  controller?.abort()
  if (timer) clearTimeout(timer)
  controller = new AbortController()
  const own = controller
  loading.value = !run.value
  error.value = null
  notFound.value = false
  try {
    run.value = await adminService.evaluationRun(props.id, own.signal)
    // A queued/running evaluation is refreshed until it finishes
    if (run.value.status === 'queued' || run.value.status === 'running')
      timer = setTimeout(load, 5000)
  } catch (e) {
    if (isAbortError(e)) return
    if (e instanceof ApiError && e.status === 404) notFound.value = true
    else error.value = e
  } finally {
    if (own === controller) loading.value = false
  }
}

watch(
  () => props.id,
  () => {
    run.value = null
    load()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  controller?.abort()
  if (timer) clearTimeout(timer)
})

/** Counts shown above the metric tables */
const usersInfo = computed(() => run.value?.results?.users)
const filtered = computed(() => run.value?.results?.filtered)
</script>

<template>
  <div class="page evaluation">
    <RouterLink :to="{ name: 'admin' }" class="small back">← {{ $t('admin.back') }}</RouterLink>

    <LoadingIndicator v-if="loading" />
    <EmptyState v-else-if="notFound" :text="$t('evaluation.notFound')" />
    <ErrorMessage v-else-if="error" :error="error" retryable @retry="load" />

    <template v-else-if="run">
      <div class="block">
        <EvaluationSummary :run="run" heading="h1" />
      </div>

      <section class="section" aria-labelledby="results-h">
        <div class="section-head">
          <h2 id="results-h">{{ $t('evaluation.results') }}</h2>
          <div v-if="run.results" class="switch" role="tablist">
            <button
              type="button"
              role="tab"
              class="btn btn-sm"
              :class="{ 'btn-primary': view === 'tables' }"
              :aria-selected="view === 'tables'"
              @click="view = 'tables'"
            >
              {{ $t('evaluation.tables') }}
            </button>
            <button
              type="button"
              role="tab"
              class="btn btn-sm"
              :class="{ 'btn-primary': view === 'json' }"
              :aria-selected="view === 'json'"
              @click="view = 'json'"
            >
              JSON
            </button>
          </div>
        </div>

        <div class="panel">
          <EmptyState
            v-if="!run.results"
            :text="
              run.status === 'failed' ? $t('evaluation.failedNoResults') : $t('evaluation.pending')
            "
          />
          <template v-else-if="view === 'tables'">
            <dl v-if="usersInfo || filtered" class="facts small">
              <template v-if="usersInfo">
                <div>
                  <dt>{{ $t('evaluation.usersTotal') }}</dt>
                  <dd>{{ usersInfo.total }}</dd>
                </div>
                <div>
                  <dt>{{ $t('evaluation.usersEvaluated') }}</dt>
                  <dd>{{ usersInfo.evaluated }}</dd>
                </div>
                <div v-for="(n, reason) in usersInfo.skipped" :key="reason">
                  <dt>{{ $t('evaluation.skipped', { reason }) }}</dt>
                  <dd>{{ n }}</dd>
                </div>
              </template>
              <div v-for="(n, key) in filtered" :key="key">
                <dt>{{ $t('evaluation.filtered', { key }) }}</dt>
                <dd>{{ n }}</dd>
              </div>
            </dl>
            <EvaluationMetrics :results="run.results" />
          </template>
          <JsonViewer v-else :value="run.results" :open-depth="2" max-height="48rem" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.evaluation {
  max-width: var(--w-admin);
  gap: var(--sp-3);
}
.back {
  align-self: flex-start;
}
.switch {
  display: flex;
  gap: 0.25rem;
}
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin: 0 0 var(--sp-2);
}
.facts div {
  display: flex;
  gap: 0.375rem;
}
.facts dt {
  color: var(--c-text-muted);
}
.facts dd {
  margin: 0;
  font-weight: 600;
}
</style>
