<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import SteamImage from '@/components/common/SteamImage.vue'
import RecommendToggle from '@/components/common/RecommendToggle.vue'
import RatingSelect from '@/components/common/RatingSelect.vue'
import { developerLine, formatDate } from '@/utils/format'
import type { DraftField, EntryDraft } from '@/composables/useLibraryEditor'
import type { GameRating } from '@/types/api'

// One library entry: [image | title, developer, date | Recommend, rating, hours] and a collapsible comment editor.
// The parent owns the draft; this component only reports edits.

const props = defineProps<{
  entry: GameRating
  draft: EntryDraft
  dirty: boolean
  commentDirty: boolean
  saving: boolean
  error?: string
}>()
const emit = defineEmits<{
  change: [field: DraftField, value: EntryDraft[DraftField]]
  saveComment: []
  revert: []
}>()

const { locale, t } = useI18n()
const id = useId()
const commentOpen = ref(false)

const game = computed(() => props.entry.game)
const to = computed(() => ({ name: 'game', params: { id: props.entry.gameId } }))
const developer = computed(() => developerLine(game.value?.developer, game.value?.publisher))
const released = computed(
  () => formatDate(game.value?.releaseDate, locale.value) ?? t('game.dateUnknown'),
)
const preview = computed(() => props.draft.comment.trim().split('\n')[0] ?? '')
const errorText = computed(() =>
  props.error === 'hours'
    ? t('library.hoursInvalid')
    : props.error
      ? t('library.saveFailed', { error: props.error })
      : '',
)

async function onSaveComment() {
  emit('saveComment')
}
</script>

<template>
  <article class="item" :class="{ dirty }">
    <div class="main">
      <RouterLink :to="to" class="image-link" :aria-label="game?.title">
        <SteamImage :src="game?.headerImageUrl" :alt="game?.title ?? `#${entry.gameId}`" />
      </RouterLink>

      <div class="info">
        <RouterLink :to="to" class="title">{{ game?.title ?? `#${entry.gameId}` }}</RouterLink>
        <span v-if="developer" class="muted small">{{ developer }}</span>
        <span class="muted small">{{ released }}</span>
        <span v-if="dirty" class="unsaved small">
          {{ $t('library.unsaved') }}
          <button type="button" class="link" @click="emit('revert')">
            {{ $t('library.revert') }}
          </button>
        </span>
      </div>

      <div class="controls">
        <div class="ctl">
          <span class="label">{{ $t('library.recommend') }}</span>
          <RecommendToggle
            :model-value="draft.recommend"
            :disabled="saving"
            @update:model-value="emit('change', 'recommend', $event)"
          />
        </div>
        <div class="ctl">
          <label class="label" :for="`${id}-rating`">{{ $t('library.rating') }}</label>
          <RatingSelect
            :id="`${id}-rating`"
            :model-value="draft.rating"
            :disabled="saving"
            @update:model-value="emit('change', 'rating', $event)"
          />
        </div>
        <div class="ctl">
          <label class="label" :for="`${id}-hours`">{{ $t('library.hoursIn') }}</label>
          <input
            :id="`${id}-hours`"
            class="input hours"
            :class="{ invalid: error === 'hours' }"
            type="number"
            min="0"
            max="1000000"
            step="1"
            inputmode="numeric"
            :value="draft.hours"
            :disabled="saving"
            @input="emit('change', 'hours', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <div class="comment">
      <template v-if="commentOpen">
        <div class="comment-head">
          <label class="label" :for="`${id}-comment`">{{ $t('library.thoughts') }}</label>
          <button type="button" class="btn btn-sm btn-ghost" @click="commentOpen = false">
            {{ $t('library.minimize') }}
          </button>
        </div>
        <textarea
          :id="`${id}-comment`"
          class="textarea"
          rows="4"
          maxlength="2000"
          :value="draft.comment"
          :placeholder="$t('library.commentPlaceholder')"
          @input="emit('change', 'comment', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="comment-foot">
          <span class="muted small">{{ draft.comment.length }} / 2000</span>
          <button
            type="button"
            class="btn btn-sm btn-primary"
            :disabled="saving || !commentDirty"
            @click="onSaveComment"
          >
            {{ saving ? $t('common.saving') : $t('library.saveComment') }}
          </button>
        </div>
      </template>
      <button
        v-else
        type="button"
        class="expand"
        :aria-expanded="false"
        @click="commentOpen = true"
      >
        <span class="expand-text">{{ preview || $t('library.expandComment') }}</span>
        <span aria-hidden="true">→</span>
      </button>
    </div>

    <p v-if="errorText" class="error small" role="alert">{{ errorText }}</p>
  </article>
</template>

<style scoped>
.item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: var(--sp-2);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  background: var(--c-surface-2);
}
.item.dirty {
  border-color: var(--c-warning);
}
.main {
  display: grid;
  grid-template-columns: minmax(0, 25fr) minmax(0, 40fr) minmax(0, 35fr);
  gap: var(--sp-2);
  align-items: start;
}
.image-link {
  display: block;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}
.title {
  color: var(--c-text);
  font-weight: 600;
  overflow-wrap: anywhere;
}
.title:hover {
  color: var(--c-accent);
}
.unsaved {
  color: var(--c-warning);
}
.link {
  margin-left: 0.25rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--c-accent);
  font: inherit;
  cursor: pointer;
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.ctl {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.hours {
  width: 6.5rem;
  min-height: 2rem;
  padding: 0.125rem 0.5rem;
}
.comment-head,
.comment-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.comment {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.expand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius);
  background: var(--c-bg);
  color: var(--c-text-muted);
  font: inherit;
  font-size: 0.875rem;
  text-align: left;
  cursor: text;
}
.expand-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.error {
  color: var(--c-negative);
}
@media (max-width: 40rem) {
  .main {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  }
  .controls {
    grid-column: 1 / -1;
  }
}
</style>
