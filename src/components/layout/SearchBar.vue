<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { gameService } from '@/services/gameService'
import { isAbortError } from '@/services/api'
import { developerLine } from '@/utils/format'
import SteamImage from '@/components/common/SteamImage.vue'
import type { GameInfo } from '@/types/api'

// Header search: quick exact-title search (top 3) in a dropdown while typing; Enter / Go! opens Advanced Search.

const router = useRouter()
const listId = useId()

const query = ref('')
const results = ref<GameInfo[]>([])
const loading = ref(false)
const failed = ref(false)
const open = ref(false)
const active = ref(-1)
let controller: AbortController | null = null

const trimmed = computed(() => query.value.trim())
const showDropdown = computed(() => open.value && trimmed.value.length >= 2)

const runQuickSearch = useDebounceFn(async (text: string) => {
  controller?.abort()
  controller = new AbortController()
  const own = controller
  loading.value = true
  failed.value = false
  try {
    const page = await gameService.search(
      { search: text, exact: true, page: 1, limit: 3 },
      own.signal,
    )
    if (own === controller) results.value = page.games
  } catch (e) {
    if (!isAbortError(e) && own === controller) failed.value = true
  } finally {
    if (own === controller) loading.value = false
  }
}, 300)

watch(trimmed, (text) => {
  active.value = -1
  if (text.length < 2) {
    controller?.abort()
    results.value = []
    loading.value = false
    return
  }
  loading.value = true
  runQuickSearch(text)
})

function submit() {
  if (active.value >= 0 && results.value[active.value]) {
    openGame(results.value[active.value]!.gameId)
    return
  }
  open.value = false
  router.push({ name: 'search', query: trimmed.value ? { q: trimmed.value } : {} })
}

function openGame(id: number) {
  open.value = false
  query.value = ''
  router.push({ name: 'game', params: { id } })
}

function onKeydown(e: KeyboardEvent) {
  if (!showDropdown.value) return
  const n = results.value.length
  if (e.key === 'ArrowDown' && n) {
    e.preventDefault()
    active.value = (active.value + 1) % n
  } else if (e.key === 'ArrowUp' && n) {
    e.preventDefault()
    active.value = (active.value - 1 + n) % n
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

// The dropdown closes when focus leaves the search (clicking a result keeps focus inside: links are focusable)
function onFocusOut(e: FocusEvent) {
  const container = e.currentTarget as HTMLElement
  if (!container.contains(e.relatedTarget as Node | null)) open.value = false
}
</script>

<template>
  <form class="search" role="search" @submit.prevent="submit" @focusout="onFocusOut">
    <div class="row">
      <input
        v-model="query"
        class="input"
        type="search"
        :placeholder="$t('header.searchPlaceholder')"
        :aria-label="$t('header.searchPlaceholder')"
        autocomplete="off"
        role="combobox"
        :aria-expanded="showDropdown"
        :aria-controls="listId"
        @focus="open = true"
        @input="open = true"
        @keydown="onKeydown"
      />
      <button type="submit" class="btn btn-primary go">{{ $t('header.go') }}</button>
    </div>

    <div v-if="showDropdown" :id="listId" class="dropdown" role="listbox">
      <p v-if="loading && !results.length" class="note">{{ $t('common.loading') }}</p>
      <p v-else-if="failed" class="note">{{ $t('header.quickSearchFailed') }}</p>
      <p v-else-if="!results.length" class="note">{{ $t('header.noQuickResults') }}</p>
      <RouterLink
        v-for="(game, i) in results"
        :key="game.gameId"
        :to="{ name: 'game', params: { id: game.gameId } }"
        class="item"
        :class="{ active: i === active }"
        role="option"
        :aria-selected="i === active"
        @click.prevent="openGame(game.gameId)"
      >
        <SteamImage :src="game.headerImageUrl" :alt="game.title" class="thumb" />
        <span class="info">
          <span class="title">{{ game.title }}</span>
          <span class="dev">{{ developerLine(game.developer, game.publisher) }}</span>
        </span>
      </RouterLink>
      <button type="submit" class="all">{{ $t('header.allResults', { q: trimmed }) }}</button>
    </div>
  </form>
</template>

<style scoped>
.search {
  position: relative;
  width: 100%;
  max-width: 27.5rem;
}
.row {
  display: flex;
}
.row .input {
  border-radius: var(--radius) 0 0 var(--radius);
  border-color: transparent;
  min-height: 2.25rem;
}
.go {
  min-height: 2.25rem;
  min-width: 2.75rem;
  padding: 0 0.75rem;
  border-radius: 0 var(--radius) var(--radius) 0;
}
.dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  padding: 0.375rem;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  background: var(--c-bg);
  box-shadow: var(--shadow-pop);
}
.note {
  padding: 0.5rem;
  color: var(--c-text-muted);
  font-size: 0.875rem;
}
.item {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: 0.75rem;
  align-items: center;
  padding: 0.375rem;
  border-radius: var(--radius);
  color: var(--c-text);
}
.item:hover,
.item.active {
  background: var(--c-surface);
  text-decoration: none;
}
.info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dev {
  color: var(--c-text-muted);
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.all {
  margin-top: 0.25rem;
  padding: 0.5rem;
  border: 0;
  border-top: 1px solid var(--c-border);
  background: none;
  color: var(--c-accent);
  font: inherit;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
}
</style>
