<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { gameService } from '@/services/gameService'
import { isAbortError } from '@/services/api'

// Selected tags as removable chips, a text input, and suggested tags (from the API) below it as clickable labels.

const model = defineModel<string[]>({ required: true })
const props = withDefaults(
  defineProps<{ allowNew?: boolean; suggestionCount?: number; inputId?: string }>(),
  { allowNew: false, suggestionCount: 8, inputId: undefined },
)

const fallbackId = useId()
const id = computed(() => props.inputId ?? fallbackId)
const text = ref('')
const suggestions = ref<string[]>([])
const loading = ref(false)
let controller: AbortController | null = null

const selectedLower = computed(() => new Set(model.value.map((t) => t.toLowerCase())))
const visibleSuggestions = computed(() =>
  suggestions.value.filter((s) => !selectedLower.value.has(s.toLowerCase())),
)

const fetchSuggestions = useDebounceFn(async (search: string) => {
  controller?.abort()
  controller = new AbortController()
  const own = controller
  loading.value = true
  try {
    const result = await gameService.suggestTags(
      search,
      props.suggestionCount + model.value.length,
      own.signal,
    )
    if (own === controller) suggestions.value = result.tags
  } catch (e) {
    if (!isAbortError(e) && own === controller) suggestions.value = []
  } finally {
    if (own === controller) loading.value = false
  }
}, 250)

watch(text, (value) => fetchSuggestions(value.trim()), { immediate: true })

function add(tag: string) {
  const value = tag.trim()
  if (!value || selectedLower.value.has(value.toLowerCase())) return
  model.value = [...model.value, value]
  text.value = ''
}

function remove(tag: string) {
  model.value = model.value.filter((t) => t !== tag)
}

function onEnter() {
  const typed = text.value.trim()
  if (!typed) return
  // An exact (case-insensitive) suggestion wins, then the first suggestion, then (if allowed) the typed text
  const exact = visibleSuggestions.value.find((s) => s.toLowerCase() === typed.toLowerCase())
  const pick = exact ?? (props.allowNew ? typed : visibleSuggestions.value[0])
  if (pick) add(pick)
}

function onBackspace() {
  if (!text.value && model.value.length) remove(model.value[model.value.length - 1]!)
}
</script>

<template>
  <div class="tag-input">
    <div class="box">
      <span v-for="tag in model" :key="tag" class="chip" :title="tag">
        <span class="chip-text">{{ tag }}</span>
        <button
          type="button"
          class="x"
          :aria-label="$t('tags.remove', { tag })"
          @click="remove(tag)"
        >
          ✕
        </button>
      </span>
      <input
        :id="id"
        v-model="text"
        class="field-input"
        type="text"
        autocomplete="off"
        :placeholder="model.length ? '' : $t('tags.placeholder')"
        @keydown.enter.prevent="onEnter"
        @keydown.backspace="onBackspace"
      />
    </div>
    <div class="suggestions" :aria-label="$t('tags.suggested')">
      <button
        v-for="tag in visibleSuggestions.slice(0, suggestionCount)"
        :key="tag"
        type="button"
        class="tag suggestion"
        :title="tag"
        @click="add(tag)"
      >
        + {{ tag }}
      </button>
      <span v-if="!loading && text.trim() && !visibleSuggestions.length" class="muted small">
        {{ allowNew ? $t('tags.pressEnterToAdd') : $t('tags.noMatches') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.tag-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}
.box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  min-height: var(--control-h);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-bg);
}
.box:focus-within {
  outline: 2px solid var(--c-focus);
  outline-offset: 1px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  padding: 0.125rem 0.25rem 0.125rem 0.5rem;
  border-radius: var(--radius);
  background: var(--c-accent-soft);
  color: var(--c-text);
  font-size: 0.8125rem;
}
.chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.x {
  flex: none;
  padding: 0 0.25rem;
  border: 0;
  background: none;
  color: var(--c-text-muted);
  font-size: 0.75rem;
  cursor: pointer;
}
.field-input {
  flex: 1 1 6rem;
  min-width: 6rem;
  min-height: 1.75rem;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--c-text);
  font: inherit;
}
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  min-height: 1.5rem;
}
.suggestion {
  border: 0;
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
}
.suggestion:hover {
  background: var(--c-accent-soft);
}
</style>
