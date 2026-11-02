<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import RecommendToggle from '@/components/common/RecommendToggle.vue'
import RatingSelect from '@/components/common/RatingSelect.vue'
import { ratingService } from '@/services/ratingService'
import { useToast } from '@/composables/useToast'
import { useErrorMessage } from '@/composables/useErrorMessage'
import type { GameRating } from '@/types/api'

// "Add to my games": the same fields as a library entry on the profile. If the game is already in the library
// the existing entry is loaded and edited (PUT replaces it, so there are never duplicates).

const props = defineProps<{ open: boolean; gameId: number; title: string }>()
const emit = defineEmits<{ close: []; saved: [entry: GameRating | null] }>()

const { t } = useI18n()
const toast = useToast()
const errorMessage = useErrorMessage()

const loading = ref(false)
const loadError = ref<unknown>(null)
const saving = ref(false)
const confirmRemove = ref(false)
const existing = ref<GameRating | null>(null)
const form = reactive({
  recommend: null as boolean | null,
  rating: null as number | null,
  hours: '' as string | number,
  comment: '',
})

async function load() {
  loading.value = true
  loadError.value = null
  confirmRemove.value = false
  try {
    existing.value = await ratingService.get(props.gameId)
    form.recommend = existing.value?.recommend ?? null
    form.rating = existing.value?.rating ?? null
    form.hours = existing.value?.playerHours ?? ''
    form.comment = existing.value?.comment ?? ''
  } catch (e) {
    loadError.value = e
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (open) => open && load(),
  { immediate: true },
)

function parsedHours(): number | null | undefined {
  if (form.hours === '' || form.hours === null) return null
  const n = Number(form.hours)
  return Number.isInteger(n) && n >= 0 && n <= 1_000_000 ? n : undefined
}

async function save() {
  const hours = parsedHours()
  if (hours === undefined) {
    toast.error(t('library.hoursInvalid'))
    return
  }
  saving.value = true
  try {
    const saved = await ratingService.save(props.gameId, {
      recommend: form.recommend,
      rating: form.rating,
      playerHours: hours,
      comment: form.comment.trim() || null,
    })
    toast.success(
      existing.value ? t('library.updated') : t('library.added', { title: props.title }),
    )
    emit('saved', saved)
    emit('close')
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!confirmRemove.value) {
    confirmRemove.value = true
    return
  }
  saving.value = true
  try {
    await ratingService.remove(props.gameId)
    toast.success(t('library.removed', { title: props.title }))
    emit('saved', null)
    emit('close')
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="existing ? $t('library.editTitle') : $t('library.addTitle')"
    @close="emit('close')"
  >
    <LoadingIndicator v-if="loading" />
    <ErrorMessage v-else-if="loadError" :error="loadError" retryable @retry="load" />
    <form v-else id="library-form" class="form" @submit.prevent="save">
      <p class="game">{{ title }}</p>
      <p v-if="existing" class="note">{{ $t('library.alreadyInLibrary') }}</p>

      <div class="grid">
        <span class="label">{{ $t('library.recommend') }}</span>
        <RecommendToggle v-model="form.recommend" />

        <label class="label" for="lib-rating">{{ $t('library.rating') }}</label>
        <RatingSelect id="lib-rating" v-model="form.rating" />

        <label class="label" for="lib-hours">{{ $t('library.hours') }}</label>
        <input
          id="lib-hours"
          v-model="form.hours"
          class="input hours"
          type="number"
          min="0"
          max="1000000"
          step="1"
          inputmode="numeric"
        />
      </div>

      <div class="field">
        <label for="lib-comment">{{ $t('library.comment') }}</label>
        <textarea
          id="lib-comment"
          v-model="form.comment"
          class="textarea"
          maxlength="2000"
          rows="4"
          :placeholder="$t('library.commentPlaceholder')"
        />
      </div>
      <p class="muted small">{{ $t('library.recommendHint') }}</p>
    </form>

    <template #footer>
      <button
        v-if="existing"
        type="button"
        class="btn btn-negative"
        :disabled="saving"
        @click="remove"
      >
        {{ confirmRemove ? $t('library.confirmRemove') : $t('library.remove') }}
      </button>
      <span class="spacer" />
      <button type="button" class="btn btn-ghost" @click="emit('close')">
        {{ $t('common.cancel') }}
      </button>
      <button
        type="submit"
        form="library-form"
        class="btn btn-primary"
        :disabled="saving || loading || !!loadError"
      >
        {{ saving ? $t('common.saving') : $t('common.save') }}
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
.game {
  font-weight: 600;
}
.note {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  background: var(--c-accent-soft);
  font-size: 0.875rem;
}
.grid {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.75rem var(--sp-2);
}
.grid > :nth-child(even) {
  justify-self: start;
}
.hours {
  width: 8rem;
}
.spacer {
  flex: 1;
}
</style>
