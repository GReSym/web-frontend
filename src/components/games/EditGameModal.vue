<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '@/components/common/BaseModal.vue'
import TagAutocomplete from '@/components/search/TagAutocomplete.vue'
import { adminService } from '@/services/adminService'
import { useToast } from '@/composables/useToast'
import { useErrorMessage } from '@/composables/useErrorMessage'
import type { GameInfo, UpdateGameRequest } from '@/types/api'

// Admin: edit the fields PATCH /api/admin/games/{id} supports. Only changed fields are sent;
// a changed title/description makes the API queue re-vectorization.

const props = defineProps<{ open: boolean; game: GameInfo }>()
const emit = defineEmits<{ close: []; saved: [game: GameInfo] }>()

const { t } = useI18n()
const toast = useToast()
const errorMessage = useErrorMessage()

const saving = ref(false)
const form = reactive({
  title: '',
  developer: '',
  publisher: '',
  releaseDate: '',
  description: '',
  tags: [] as string[],
})

function reset() {
  form.title = props.game.title
  form.developer = props.game.developer
  form.publisher = props.game.publisher
  form.releaseDate = props.game.releaseDate?.slice(0, 10) ?? ''
  form.description = props.game.description ?? ''
  form.tags = [...(props.game.tags ?? [])]
}

watch(
  () => props.open,
  (open) => open && reset(),
  { immediate: true },
)

function changes(): UpdateGameRequest {
  const body: UpdateGameRequest = {}
  if (form.title.trim() !== props.game.title) body.title = form.title.trim()
  if (form.developer.trim() !== props.game.developer) body.developer = form.developer.trim()
  if (form.publisher.trim() !== props.game.publisher) body.publisher = form.publisher.trim()
  if (form.releaseDate && form.releaseDate !== props.game.releaseDate?.slice(0, 10))
    body.releaseDate = form.releaseDate
  if (form.description !== (props.game.description ?? '')) body.description = form.description
  const before = props.game.tags ?? []
  if (form.tags.length !== before.length || form.tags.some((tag, i) => tag !== before[i]))
    body.tags = form.tags
  return body
}

async function save() {
  if (!form.title.trim()) {
    toast.error(t('editGame.titleRequired'))
    return
  }
  const body = changes()
  if (!Object.keys(body).length) {
    emit('close')
    return
  }
  saving.value = true
  try {
    const updated = await adminService.updateGame(props.game.gameId, body)
    toast.success(t('editGame.saved'))
    emit('saved', updated)
    emit('close')
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :open="open" :title="$t('editGame.title')" width="48rem" @close="emit('close')">
    <form id="edit-game-form" class="form" @submit.prevent="save">
      <div class="field">
        <label for="eg-title">{{ $t('editGame.gameTitle') }}</label>
        <input id="eg-title" v-model="form.title" class="input" maxlength="255" required />
      </div>
      <div class="two">
        <div class="field">
          <label for="eg-dev">{{ $t('editGame.developer') }}</label>
          <input id="eg-dev" v-model="form.developer" class="input" />
        </div>
        <div class="field">
          <label for="eg-pub">{{ $t('editGame.publisher') }}</label>
          <input id="eg-pub" v-model="form.publisher" class="input" />
        </div>
      </div>
      <div class="field date">
        <label for="eg-date">{{ $t('editGame.releaseDate') }}</label>
        <input id="eg-date" v-model="form.releaseDate" class="input" type="date" />
      </div>
      <div class="field">
        <label for="eg-tags">{{ $t('editGame.tags') }}</label>
        <TagAutocomplete v-model="form.tags" input-id="eg-tags" allow-new />
      </div>
      <div class="field">
        <label for="eg-desc">{{ $t('editGame.description') }}</label>
        <textarea id="eg-desc" v-model="form.description" class="textarea mono" rows="10" />
        <span class="muted small">{{ $t('editGame.descriptionHint') }}</span>
      </div>
    </form>
    <template #footer>
      <button type="button" class="btn btn-ghost" @click="emit('close')">
        {{ $t('common.cancel') }}
      </button>
      <button type="submit" form="edit-game-form" class="btn btn-primary" :disabled="saving">
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
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}
.date {
  max-width: 14rem;
}
.mono {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}
@media (max-width: 36rem) {
  .two {
    grid-template-columns: 1fr;
  }
}
</style>
