<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

// "How it works" for new users on the home page: two ways to tell the system your taste + where the searches are.
// Collapsible; the collapsed state is a per-browser convenience (localStorage, may be unavailable).

const STORAGE_KEY = 'gresym-guide-collapsed'
const auth = useAuthStore()

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
const collapsed = ref(readCollapsed())
watch(collapsed, (value) => {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable
  }
})
</script>

<template>
  <section class="panel guide" aria-labelledby="guide-h">
    <div class="head">
      <h2 id="guide-h">{{ $t('guide.title') }}</h2>
      <button
        type="button"
        class="toggle"
        :aria-expanded="!collapsed"
        aria-controls="guide-body"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? $t('guide.show') : $t('guide.hide') }}
        <span aria-hidden="true">{{ collapsed ? '▼' : '▲' }}</span>
      </button>
    </div>

    <div v-show="!collapsed" id="guide-body" class="body">
      <p>{{ $t('guide.intro') }}</p>

      <div class="paths">
        <div class="path">
          <h3>{{ $t('guide.a.title') }}</h3>
          <ol>
            <li>{{ $t('guide.a.s1') }}</li>
            <li>{{ $t('guide.a.s2') }}</li>
            <li>{{ $t('guide.a.s3') }}</li>
            <li>{{ $t('guide.a.s4') }}</li>
          </ol>
        </div>
        <div class="path">
          <h3>{{ $t('guide.b.title') }}</h3>
          <ol>
            <li>{{ $t('guide.b.s1') }}</li>
            <li>{{ $t('guide.b.s2') }}</li>
            <li>{{ $t('guide.b.s3') }}</li>
          </ol>
        </div>
      </div>

      <p class="search small">
        {{ $t('guide.search') }}
        <RouterLink :to="{ name: 'search', query: { exact: '0' } }">{{
          $t('guide.searchLink')
        }}</RouterLink>
      </p>

      <div class="actions">
        <template v-if="!auth.isAuthenticated">
          <RouterLink :to="{ name: 'register' }" class="btn btn-primary">{{
            $t('nav.register')
          }}</RouterLink>
          <RouterLink :to="{ name: 'login', query: { redirect: '/' } }" class="btn btn-ghost">{{
            $t('nav.login')
          }}</RouterLink>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'recommendations' }" class="btn btn-primary">{{
            $t('guide.toRecommendations')
          }}</RouterLink>
          <RouterLink :to="{ name: 'search' }" class="btn btn-ghost">{{
            $t('guide.toSearch')
          }}</RouterLink>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.guide {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}
.head h2 {
  font-size: 1.125rem;
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0;
  border: 0;
  background: none;
  color: var(--c-accent);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}
.body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.paths {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-2);
}
.path {
  padding: 0.75rem var(--sp-2);
  border-radius: var(--radius);
  background: var(--c-bg);
}
.path h3 {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}
.path ol {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding-left: 1.25rem;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
@media (max-width: 40rem) {
  .paths {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
