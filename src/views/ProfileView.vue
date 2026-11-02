<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userService } from '@/services/userService'
import { isAbortError } from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useErrorMessage } from '@/composables/useErrorMessage'
import { useLibraryEditor } from '@/composables/useLibraryEditor'
import ProfileStats from '@/components/profile/ProfileStats.vue'
import UserGameItem from '@/components/profile/UserGameItem.vue'
import SteamImportModal from '@/components/profile/SteamImportModal.vue'
import RecommendationParams from '@/components/recommendations/RecommendationParams.vue'
import InfiniteSentinel from '@/components/common/InfiniteSentinel.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { RecommendationSettings } from '@/types/api'

const auth = useAuthStore()
const { t } = useI18n()
const toast = useToast()
const errorMessage = useErrorMessage()

// ---------- Profile ----------
const username = ref(auth.user?.name ?? '')
const savingName = ref(false)
const nameError = computed(() => {
  const n = username.value.trim().length
  return n < 4 || n > 32 ? t('profile.nameLength') : null
})
watch(
  () => auth.user?.name,
  (name) => (username.value = name ?? ''),
)

async function saveName() {
  if (nameError.value) return
  savingName.value = true
  try {
    auth.setUser(await userService.updateUsername(username.value.trim()))
    toast.success(t('profile.nameSaved'))
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    savingName.value = false
  }
}

// ---------- Settings (recommendation defaults) ----------
const settings = ref<RecommendationSettings | null>(null)
const savedSettings = ref<RecommendationSettings | null>(null)
const settingsError = ref<unknown>(null)
const savingSettings = ref(false)
const settingsController = new AbortController()

async function loadSettings() {
  settingsError.value = null
  try {
    const s = await userService.getSettings(settingsController.signal)
    settings.value = { ...s }
    savedSettings.value = { ...s }
  } catch (e) {
    if (!isAbortError(e)) settingsError.value = e
  }
}
const settingsDirty = computed(
  () => !!settings.value && JSON.stringify(settings.value) !== JSON.stringify(savedSettings.value),
)

async function saveSettings() {
  if (!settings.value) return
  savingSettings.value = true
  try {
    const s = await userService.updateSettings(settings.value)
    settings.value = { ...s }
    savedSettings.value = { ...s }
    toast.success(t('profile.settingsSaved'))
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    savingSettings.value = false
  }
}

// ---------- Library ----------
const library = useLibraryEditor()
const { list } = library
const stats = useTemplateRef<InstanceType<typeof ProfileStats>>('statsPanel')
const importOpen = ref(false)
const savingAll = ref(false)

async function saveComment(gameId: number) {
  if (await library.saveComment(gameId)) toast.success(t('library.commentSaved'))
  else toast.error(t('library.saveFailedShort'))
}

async function saveAll() {
  if (!library.dirtyIds.value.length) return
  savingAll.value = true
  const { saved, failed } = await library.saveAll()
  savingAll.value = false
  if (failed) toast.error(t('library.saveAllPartial', { saved, failed }))
  else toast.success(t('library.saveAllDone', { n: saved }))
  stats.value?.reload()
}

// Don't lose unsaved library/settings edits
const hasUnsaved = computed(() => library.dirtyIds.value.length > 0 || settingsDirty.value)
onBeforeRouteLeave(() => (hasUnsaved.value ? window.confirm(t('profile.leaveConfirm')) : true))
function onBeforeUnload(e: BeforeUnloadEvent) {
  if (hasUnsaved.value) e.preventDefault()
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  loadSettings()
  library.reload()
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  settingsController.abort()
  list.abort()
})
</script>

<template>
  <div class="page profile">
    <div class="two">
      <section class="section" aria-labelledby="profile-h">
        <h2 id="profile-h">{{ $t('profile.profile') }}</h2>
        <form class="panel profile-panel" @submit.prevent="saveName">
          <div class="field">
            <label for="pf-name">{{ $t('profile.yourName') }}</label>
            <div class="name-row">
              <input
                id="pf-name"
                v-model="username"
                class="input"
                :class="{ invalid: nameError }"
                maxlength="32"
                autocomplete="nickname"
              />
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="savingName || !!nameError || username.trim() === auth.user?.name"
              >
                {{ $t('common.save') }}
              </button>
            </div>
            <span v-if="nameError" class="field-error">{{ nameError }}</span>
          </div>
          <div class="field">
            <label for="pf-email">{{ $t('profile.email') }}</label>
            <input id="pf-email" class="input" :value="auth.user?.email" readonly />
          </div>
        </form>
      </section>

      <section class="section" aria-labelledby="stats-h">
        <h2 id="stats-h">{{ $t('stats.title') }}</h2>
        <ProfileStats ref="statsPanel" />
      </section>
    </div>

    <section class="section" aria-labelledby="settings-h">
      <div class="section-head">
        <h2 id="settings-h">{{ $t('profile.settings') }}</h2>
        <button
          v-if="settings"
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="!settingsDirty || savingSettings"
          @click="saveSettings"
        >
          {{ savingSettings ? $t('common.saving') : $t('profile.saveSettings') }}
        </button>
      </div>
      <div class="panel">
        <ErrorMessage v-if="settingsError" :error="settingsError" retryable @retry="loadSettings" />
        <RecommendationParams
          v-else-if="settings"
          v-model="settings"
          layout="profile"
          :disabled="savingSettings"
        />
        <LoadingIndicator v-else />
      </div>
    </section>

    <section class="section" aria-labelledby="games-h">
      <div class="section-head">
        <h2 id="games-h">{{ $t('library.yourGames') }}</h2>
        <button type="button" class="btn btn-ghost" @click="importOpen = true">
          {{ $t('steam.button') }}
        </button>
      </div>
      <div class="panel library">
        <UserGameItem
          v-for="entry in list.items.value"
          :key="entry.gameId"
          :entry="entry"
          :draft="library.draftOf(entry)"
          :dirty="library.isDirty(entry.gameId)"
          :comment-dirty="library.isFieldDirty(entry.gameId, 'comment')"
          :saving="library.savingIds.has(entry.gameId) || savingAll"
          :error="library.errors.get(entry.gameId)"
          @change="(field, value) => library.setField(entry.gameId, field, value)"
          @save-comment="saveComment(entry.gameId)"
          @revert="library.revert(entry.gameId)"
        />
        <LoadingIndicator v-if="list.loading.value" />
        <ErrorMessage
          v-else-if="list.error.value"
          :error="list.error.value"
          retryable
          @retry="list.retry"
        />
        <EmptyState
          v-else-if="list.done.value && !list.items.value.length"
          :text="$t('library.empty')"
        >
          <RouterLink :to="{ name: 'search' }">{{ $t('library.findGames') }}</RouterLink>
        </EmptyState>
        <InfiniteSentinel
          :active="list.loadedOnce.value && !list.done.value && !list.error.value"
          :loading="list.loading.value"
          @load="list.loadMore"
        />
      </div>
    </section>

    <div class="save-all" :class="{ visible: library.dirtyIds.value.length > 0 }">
      <button
        type="button"
        class="btn btn-primary btn-lg"
        :disabled="savingAll || !library.dirtyIds.value.length"
        @click="saveAll"
      >
        {{
          savingAll
            ? $t('common.saving')
            : $t('library.saveAll', { n: library.dirtyIds.value.length })
        }}
      </button>
    </div>

    <SteamImportModal :open="importOpen" @close="importOpen = false" @imported="library.reload()" />
  </div>
</template>

<style scoped>
.profile {
  max-width: var(--w-profile);
}
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
  align-items: stretch;
}
.two > .section > .panel,
.two > .section > :deep(.panel) {
  flex: 1;
}
.profile-panel {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.name-row {
  display: flex;
  gap: 0.5rem;
}
.library {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.save-all {
  position: fixed;
  right: var(--sp-3);
  bottom: var(--sp-3);
  z-index: 40;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.save-all.visible {
  opacity: 1;
}
.save-all .btn {
  box-shadow: var(--shadow-pop);
}
@media (max-width: 40rem) {
  .two {
    grid-template-columns: minmax(0, 1fr);
  }
  .save-all {
    right: var(--sp-2);
    bottom: var(--sp-2);
  }
}
</style>
