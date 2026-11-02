<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '@/services/userService'
import { isAbortError } from '@/services/api'
import { formatNumber } from '@/utils/format'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import type { UserStats } from '@/types/api'

const { locale } = useI18n()
const stats = shallowRef<UserStats | null>(null)
const loading = ref(false)
const error = ref<unknown>(null)
let controller: AbortController | null = null

async function load() {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = null
  try {
    stats.value = await userService.getStats(controller.signal)
  } catch (e) {
    if (!isAbortError(e)) error.value = e
  } finally {
    loading.value = false
  }
}

load()
onBeforeUnmount(() => controller?.abort())
defineExpose({ reload: load })
</script>

<template>
  <div class="panel stats">
    <LoadingIndicator v-if="loading && !stats" />
    <ErrorMessage v-else-if="error" :error="error" retryable @retry="load" />
    <template v-else-if="stats">
      <p class="stat">
        <span>{{ $t('stats.hoursBefore') }}</span>
        <strong class="value">{{ formatNumber(stats.totalHours, locale) }}</strong>
        <span>{{ $t('stats.hoursAfter') }}</span>
      </p>
      <p class="stat">
        <span>{{ $t('stats.gamesBefore') }}</span>
        <strong class="value">{{ formatNumber(stats.gamesPlayed, locale) }}</strong>
        <span>{{ $t('stats.gamesAfter') }}</span>
      </p>
      <p class="stat">
        <span>{{ $t('stats.favoriteTag') }}</span>
        <strong v-if="stats.favoriteTag" class="value tag-value">{{ stats.favoriteTag }}</strong>
        <span v-else class="muted">{{ $t('stats.noFavorite') }}</span>
      </p>
    </template>
  </div>
</template>

<style scoped>
.stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}
.stat {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.375rem;
}
.value {
  padding: 0 0.5rem;
  border-radius: var(--radius);
  background: var(--c-surface-2);
  color: var(--c-accent);
  font-size: 1.125rem;
}
.tag-value {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
