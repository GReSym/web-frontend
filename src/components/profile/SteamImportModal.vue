<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '@/components/common/BaseModal.vue'
import { isSteamProfileUrl, steamImportService } from '@/services/steamImportService'
import { useToast } from '@/composables/useToast'
import { useErrorMessage } from '@/composables/useErrorMessage'

// Steam library import. The backend operation doesn't exist yet, so the popup explains that and
// doesn't submit (see services/steamImportService.ts).

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; imported: [] }>()

const { t } = useI18n()
const toast = useToast()
const errorMessage = useErrorMessage()

const url = ref('')
const touched = ref(false)
const busy = ref(false)
const valid = computed(() => isSteamProfileUrl(url.value))

async function submit() {
  touched.value = true
  if (!valid.value || !steamImportService.available) return
  busy.value = true
  try {
    const result = await steamImportService.importLibrary(url.value.trim())
    toast.success(t('steam.done', { n: result.imported }))
    emit('imported')
    emit('close')
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BaseModal :open="open" :title="$t('steam.title')" @close="emit('close')">
    <form id="steam-form" class="form" @submit.prevent="submit">
      <p>{{ $t('steam.intro') }}</p>
      <div class="field">
        <label for="steam-url">{{ $t('steam.profileUrl') }}</label>
        <input
          id="steam-url"
          v-model="url"
          class="input"
          :class="{ invalid: touched && !valid }"
          type="url"
          placeholder="https://steamcommunity.com/id/…"
          autocomplete="off"
          @blur="touched = true"
        />
        <span v-if="touched && !valid" class="field-error">{{ $t('steam.invalidUrl') }}</span>
      </div>
      <p class="muted small">{{ $t('steam.publicNote') }}</p>
      <p v-if="!steamImportService.available" class="note small">{{ $t('steam.notAvailable') }}</p>
    </form>
    <template #footer>
      <button type="button" class="btn btn-ghost" @click="emit('close')">
        {{ $t('common.close') }}
      </button>
      <button
        type="submit"
        form="steam-form"
        class="btn btn-primary"
        :disabled="busy || !steamImportService.available"
      >
        {{ $t('steam.import') }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.note {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  background: var(--c-warning-soft);
  color: var(--c-text);
}
</style>
