<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminService } from '@/services/adminService'
import { isAbortError } from '@/services/api'
import EvaluationSummary from '@/components/admin/EvaluationSummary.vue'
import StaleGamesPanel from '@/components/admin/StaleGamesPanel.vue'
import PaginationControls from '@/components/common/PaginationControls.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { EvaluationRun } from '@/types/api'

const PAGE_SIZE = 5

const route = useRoute()
const router = useRouter()

// The page number is kept in the URL (?page=2) so "back" from an evaluation returns to the same page
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const runs = shallowRef<EvaluationRun[]>([])
const loading = ref(false)
const error = ref<unknown>(null)
let controller: AbortController | null = null

async function load() {
  controller?.abort()
  controller = new AbortController()
  const own = controller
  loading.value = true
  error.value = null
  try {
    runs.value = (
      await adminService.evaluationRuns({ page: page.value, limit: PAGE_SIZE }, own.signal)
    ).runs
  } catch (e) {
    if (!isAbortError(e)) error.value = e
  } finally {
    if (own === controller) loading.value = false
  }
}

watch(page, load, { immediate: true })
onBeforeUnmount(() => controller?.abort())

function goTo(next: number) {
  router.push({ query: { ...route.query, page: next > 1 ? String(next) : undefined } })
}
</script>

<template>
  <div class="page admin">
    <section class="section" aria-labelledby="evals-h">
      <h2 id="evals-h">{{ $t('admin.evaluations') }}</h2>
      <div class="panel evals">
        <LoadingIndicator v-if="loading && !runs.length" />
        <ErrorMessage v-else-if="error" :error="error" retryable @retry="load" />
        <EmptyState v-else-if="!runs.length" :text="$t('admin.noEvaluations')" />
        <div v-else class="list" :class="{ dim: loading }">
          <RouterLink
            v-for="run in runs"
            :key="run.id"
            :to="{ name: 'evaluation', params: { id: run.id } }"
            class="block entry"
          >
            <EvaluationSummary :run="run" />
          </RouterLink>
        </div>
        <PaginationControls
          :page="page"
          :has-next="runs.length === PAGE_SIZE"
          :disabled="loading"
          @change="goTo"
        />
      </div>
    </section>

    <StaleGamesPanel />
  </div>
</template>

<style scoped>
.admin {
  max-width: var(--w-admin);
}
.evals {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  transition: opacity 0.15s;
}
.list.dim {
  opacity: 0.6;
}
.entry {
  display: block;
  color: var(--c-text);
  border: 1px solid transparent;
  transition: border-color 0.15s;
}
.entry:hover {
  border-color: var(--c-accent);
  text-decoration: none;
}
</style>
