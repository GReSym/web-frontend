<script setup lang="ts">
import { reactive, watch } from 'vue'
import TagAutocomplete from './TagAutocomplete.vue'

export interface SearchParams {
  q: string
  exact: boolean
  tags: string[]
}

// [ Your query (50%) ][ Exact name? (17%) ][ Tags + suggestions (33%) ]
// The query is applied on Enter / the search button; exact and tags apply right away.

const props = defineProps<{ value: SearchParams }>()
const emit = defineEmits<{ change: [params: SearchParams] }>()

const draft = reactive<SearchParams>({ q: '', exact: true, tags: [] })

watch(
  () => props.value,
  (value) => {
    draft.q = value.q
    draft.exact = value.exact
    draft.tags = [...value.tags]
  },
  { immediate: true, deep: true },
)

function apply() {
  emit('change', { q: draft.q.trim(), exact: draft.exact, tags: [...draft.tags] })
}

function onExact(e: Event) {
  draft.exact = (e.target as HTMLSelectElement).value === 'yes'
  apply()
}

function onTags(tags: string[]) {
  draft.tags = tags
  apply()
}
</script>

<template>
  <section class="panel filters" aria-labelledby="filters-h">
    <h2 id="filters-h">{{ $t('search.filters') }}</h2>
    <div class="grid">
      <form class="field" role="search" @submit.prevent="apply">
        <label for="sf-query">{{ $t('search.query') }}</label>
        <div class="query-row">
          <input
            id="sf-query"
            v-model="draft.q"
            class="input"
            type="search"
            autocomplete="off"
            :placeholder="
              draft.exact
                ? $t('search.queryPlaceholderExact')
                : $t('search.queryPlaceholderMeaning')
            "
          />
          <button type="submit" class="btn btn-primary">{{ $t('search.search') }}</button>
        </div>
      </form>

      <div class="field">
        <div class="label-row">
          <label for="sf-exact">{{ $t('search.exact') }}</label>
          <span class="help" tabindex="0" :aria-label="$t('search.exactHelp')">
            ?
            <span class="tooltip" role="tooltip">{{ $t('search.exactHelp') }}</span>
          </span>
        </div>
        <select id="sf-exact" class="select" :value="draft.exact ? 'yes' : 'no'" @change="onExact">
          <option value="yes">{{ $t('search.exactYes') }}</option>
          <option value="no">{{ $t('search.exactNo') }}</option>
        </select>
      </div>

      <div class="field">
        <label for="sf-tags">{{ $t('search.tags') }}</label>
        <TagAutocomplete
          :model-value="draft.tags"
          input-id="sf-tags"
          @update:model-value="onTags"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.filters h2 {
  font-size: 1.125rem;
}
.grid {
  display: grid;
  grid-template-columns: 50fr 17fr 33fr;
  gap: var(--sp-2);
  align-items: start;
}
.query-row {
  display: flex;
  gap: 0.5rem;
}
.label-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.label-row label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-text-muted);
}
.help {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  background: var(--c-surface-3);
  color: var(--c-text);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: help;
}
.tooltip {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  z-index: 20;
  width: 16rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  background: var(--c-header);
  color: var(--c-header-text);
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.4;
  box-shadow: var(--shadow-pop);
  transform: translateX(-50%);
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.15s;
}
.help:hover .tooltip,
.help:focus .tooltip {
  visibility: visible;
  opacity: 1;
}
@media (max-width: 52rem) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
  .grid > :first-child {
    grid-column: 1 / -1;
  }
}
@media (max-width: 36rem) {
  .grid {
    grid-template-columns: 1fr;
  }
  .tooltip {
    left: 0;
    transform: none;
  }
}
</style>
