<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { adminService } from '@/services/adminService'
import { isAbortError } from '@/services/api'
import JsonViewer from './JsonViewer.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { StaleReport } from '@/types/api'

// Stale vectors: requested only when the admin clicks "Update list" (the ML scan takes up to ~2 minutes).

const report = shallowRef<StaleReport | null>(null)
const loading = ref(false)
const error = ref<unknown>(null)
const seconds = ref(0)
let controller: AbortController | null = null
let ticker: ReturnType<typeof setInterval> | null = null

async function update() {
  controller?.abort()
  controller = new AbortController()
  const own = controller
  loading.value = true
  error.value = null
  seconds.value = 0
  ticker = setInterval(() => seconds.value++, 1000)
  try {
    report.value = await adminService.staleVectors({ limit: 100 }, own.signal)
  } catch (e) {
    if (!isAbortError(e)) error.value = e
  } finally {
    if (own === controller) {
      loading.value = false
      if (ticker) clearInterval(ticker)
      ticker = null
    }
  }
}

function cancel() {
  controller?.abort()
  loading.value = false
  if (ticker) clearInterval(ticker)
}

onBeforeUnmount(cancel)
</script>

<template>
  <section class="section" aria-labelledby="stale-h">
    <div class="section-head">
      <h2 id="stale-h">{{ $t('admin.stale') }}</h2>
      <div class="buttons">
        <button v-if="loading" type="button" class="btn btn-ghost" @click="cancel">
          {{ $t('common.cancel') }}
        </button>
        <button type="button" class="btn btn-primary" :disabled="loading" @click="update">
          {{ $t('admin.updateList') }}
        </button>
      </div>
    </div>
    <div class="panel">
      <LoadingIndicator v-if="loading" :label="$t('admin.staleLoading', { s: seconds })" />
      <ErrorMessage v-else-if="error" :error="error" retryable @retry="update" />
      <template v-else-if="report">
        <p class="small muted summary">
          {{
            $t('admin.staleSummary', {
              total: report.total,
              shown: report.items.length,
              vectors: report.vectors,
              games: report.games,
            })
          }}
        </p>
        <div class="json-area">
          <JsonViewer :value="report" :open-depth="1" max-height="36rem" />
        </div>
      </template>
      <EmptyState v-else :text="$t('admin.staleEmpty')" />
    </div>
  </section>
</template>

<style scoped>
.buttons {
  display: flex;
  gap: 0.5rem;
}
.summary {
  margin-bottom: 0.75rem;
}
.json-area {
  width: 80%;
}
@media (max-width: 40rem) {
  .json-area {
    width: 100%;
  }
}
</style>
