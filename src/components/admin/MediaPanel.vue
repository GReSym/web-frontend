<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminService } from '@/services/adminService'
import { isAbortError } from '@/services/api'
import { useConfigStore } from '@/stores/config'
import { useToast } from '@/composables/useToast'
import { useErrorMessage } from '@/composables/useErrorMessage'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import type { AppSettings, MediaMigrationStatus, MediaStats } from '@/types/api'

// Self-hosted images: the media base URL (Openinary gateway) and moving images off the Steam CDN.
// The migration runs in the API's background; its status is polled while it runs.

const POLL_MS = 3000

const { t } = useI18n()
const toast = useToast()
const errorMessage = useErrorMessage()
const config = useConfigStore()

const settings = shallowRef<AppSettings | null>(null)
const baseUrl = ref('')
const saving = ref(false)

const stats = shallowRef<MediaStats | null>(null)
const statsLoading = ref(false)
const statsError = ref<unknown>(null)

const status = shallowRef<MediaMigrationStatus | null>(null)
const limit = ref(1000)
const includeScreenshots = ref(false)
const starting = ref(false)

const controller = new AbortController()
let poller: ReturnType<typeof setTimeout> | null = null

const running = computed(() => status.value?.state === 'running')
const dirty = computed(() => settings.value !== null && baseUrl.value.trim() !== settings.value.mediaBaseUrl)

async function loadSettings() {
  try {
    settings.value = await adminService.settings(controller.signal)
    baseUrl.value = settings.value.mediaBaseUrl
  } catch (e) {
    if (!isAbortError(e)) toast.error(errorMessage(e))
  }
}

async function saveBaseUrl() {
  saving.value = true
  try {
    settings.value = await adminService.updateSettings({ mediaBaseUrl: baseUrl.value.trim() })
    baseUrl.value = settings.value.mediaBaseUrl
    config.setMediaBaseUrl(settings.value.mediaBaseUrl)
    toast.success(t('admin.media.saved'))
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    saving.value = false
  }
}

async function loadStats() {
  statsLoading.value = true
  statsError.value = null
  try {
    stats.value = await adminService.mediaStats(controller.signal)
  } catch (e) {
    if (!isAbortError(e)) statsError.value = e
  } finally {
    statsLoading.value = false
  }
}

async function poll() {
  poller = null
  const wasRunning = running.value
  try {
    status.value = await adminService.mediaMigration(controller.signal)
  } catch (e) {
    if (isAbortError(e)) return
  }
  if (running.value) poller = setTimeout(poll, POLL_MS)
  else if (wasRunning) loadStats()
}

async function start() {
  starting.value = true
  try {
    status.value = await adminService.startMediaMigration({
      limit: limit.value,
      includeScreenshots: includeScreenshots.value,
    })
    if (!poller) poller = setTimeout(poll, POLL_MS)
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    starting.value = false
  }
}

async function cancel() {
  try {
    await adminService.cancelMediaMigration()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}

onMounted(() => {
  loadSettings()
  loadStats()
  poll()
})
onBeforeUnmount(() => {
  controller.abort()
  if (poller) clearTimeout(poller)
})
</script>

<template>
  <section class="section" aria-labelledby="media-h">
    <h2 id="media-h">{{ $t('admin.media.title') }}</h2>
    <div class="panel media">
      <form class="row" @submit.prevent="saveBaseUrl">
        <div class="field grow">
          <label for="media-base">{{ $t('admin.media.baseUrl') }}</label>
          <input
            id="media-base"
            v-model="baseUrl"
            class="input"
            type="text"
            maxlength="255"
            :placeholder="settings?.defaultMediaBaseUrl || 'https://example.com/cdn'"
            :disabled="!settings || saving"
          />
          <span class="small muted">{{
            $t('admin.media.baseUrlHint', { def: settings?.defaultMediaBaseUrl || '—' })
          }}</span>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="!dirty || saving">
          {{ $t('common.save') }}
        </button>
      </form>

      <div class="block">
        <div class="section-head">
          <h3>{{ $t('admin.media.stats') }}</h3>
          <button type="button" class="btn btn-ghost btn-sm" :disabled="statsLoading" @click="loadStats">
            {{ $t('admin.updateList') }}
          </button>
        </div>
        <LoadingIndicator v-if="statsLoading && !stats" />
        <ErrorMessage v-else-if="statsError" :error="statsError" retryable @retry="loadStats" />
        <p v-else-if="stats" class="small" :class="{ dim: statsLoading }">
          {{ $t('admin.media.headersOnSteam', { n: stats.steamHeaders, total: stats.headers }) }}<br />
          {{ $t('admin.media.screenshotsOnSteam', { n: stats.steamScreenshots, total: stats.screenshots }) }}
        </p>
      </div>

      <div class="block">
        <h3>{{ $t('admin.media.migration') }}</h3>
        <form class="row" @submit.prevent="start">
          <div class="field">
            <label for="media-limit">{{ $t('admin.media.limit') }}</label>
            <input
              id="media-limit"
              v-model.number="limit"
              class="input limit"
              type="number"
              min="1"
              max="200000"
              step="1"
              inputmode="numeric"
              :disabled="running"
            />
          </div>
          <label class="check">
            <input v-model="includeScreenshots" type="checkbox" :disabled="running" />
            {{ $t('admin.media.includeScreenshots') }}
          </label>
          <button v-if="running" type="button" class="btn btn-ghost" @click="cancel">
            {{ $t('common.cancel') }}
          </button>
          <button v-else type="submit" class="btn btn-primary" :disabled="starting || !(limit >= 1)">
            {{ $t('admin.media.start') }}
          </button>
        </form>
        <p class="small muted">{{ $t('admin.media.migrationHint') }}</p>
        <p v-if="status && status.state !== 'idle'" class="small status">
          <strong>{{ $t(`admin.media.state.${status.state}`) }}</strong> —
          {{
            $t('admin.media.progress', {
              games: status.gamesProcessed,
              limit: status.limit,
              headers: status.headersMigrated,
              screenshots: status.screenshotsMigrated,
              failed: status.gamesFailed,
            })
          }}
          <template v-if="status.error"><br />{{ status.error }}</template>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.media {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--sp-2);
}
.grow {
  flex: 1 1 20rem;
}
.limit {
  width: 8rem;
}
.check {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-bottom: 0.5rem;
}
.block h3 {
  margin-bottom: 0.5rem;
}
.status {
  margin-top: 0.5rem;
}
.dim {
  opacity: 0.6;
}
</style>
