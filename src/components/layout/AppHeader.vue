<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { LOCALES, setLocale } from '@/i18n'
import SearchBar from './SearchBar.vue'
import UserDropdown from './UserDropdown.vue'

const auth = useAuthStore()
const { t, locale } = useI18n()
const { mode, cycle } = useTheme()

const themeIcon = computed(
  () => ({ light: '☀', dark: '☾', auto: '◐' })[mode.value as 'light' | 'dark' | 'auto'] ?? '◐',
)
const themeLabel = computed(() => t('header.theme', { mode: t(`header.themeModes.${mode.value}`) }))

// RU / EN as two buttons, the current one highlighted: a single toggle showing the *other* language confused users
const localeButtons = [...LOCALES].sort((a) => (a === 'ru' ? -1 : 1))
</script>

<template>
  <header class="header">
    <RouterLink :to="{ name: 'home' }" class="logo" :aria-label="$t('header.home')"
      >GReSym</RouterLink
    >

    <div class="center">
      <SearchBar />
    </div>

    <div class="right">
      <RouterLink v-if="auth.isAdmin" :to="{ name: 'admin' }" class="admin-link">{{
        $t('nav.admin')
      }}</RouterLink>
      <button
        type="button"
        class="tool"
        :title="themeLabel"
        :aria-label="themeLabel"
        @click="cycle"
      >
        {{ themeIcon }}
      </button>
      <div class="lang" role="group" :aria-label="$t('header.language')">
        <button
          v-for="code in localeButtons"
          :key="code"
          type="button"
          class="lang-btn"
          :class="{ active: locale === code }"
          :aria-pressed="locale === code"
          :lang="code"
          @click="setLocale(code)"
        >
          {{ code.toUpperCase() }}
        </button>
      </div>
      <UserDropdown />
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: 1fr minmax(0, 27.5rem) 1fr;
  align-items: center;
  gap: var(--sp-2);
  min-height: var(--header-h);
  padding: 0.5rem 0.9375rem;
  background: var(--c-header);
  color: var(--c-header-text);
}
.logo {
  justify-self: start;
  display: flex;
  align-items: center;
  height: 2.375rem;
  padding: 0 0.75rem;
  border-radius: var(--radius);
  background: var(--c-accent);
  color: var(--c-accent-text);
  font-weight: 800;
  letter-spacing: 0.02em;
}
.logo:hover {
  text-decoration: none;
  background: var(--c-accent-hover);
}
.center {
  display: flex;
  justify-content: center;
  min-width: 0;
}
.right {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.admin-link {
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius);
  background: rgb(255 255 255 / 0.12);
  color: var(--c-header-text);
  font-size: 0.875rem;
  white-space: nowrap;
}
.admin-link:hover {
  background: rgb(255 255 255 / 0.22);
  text-decoration: none;
}
.tool {
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: var(--radius);
  background: transparent;
  color: var(--c-header-text);
  font: inherit;
  font-size: 1.125rem;
  cursor: pointer;
}
.lang {
  display: flex;
  padding: 0.125rem;
  border-radius: var(--radius);
  background: rgb(255 255 255 / 0.1);
}
.lang-btn {
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.375rem;
  border: 0;
  border-radius: calc(var(--radius) - 2px);
  background: transparent;
  color: var(--c-header-text);
  opacity: 0.65;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
}
.lang-btn:hover {
  opacity: 1;
}
.lang-btn.active {
  background: var(--c-accent);
  color: var(--c-accent-text);
  opacity: 1;
  cursor: default;
}
.tool:hover {
  background: rgb(255 255 255 / 0.12);
}

/* Mobile: the search goes to its own row under the logo and the controls */
@media (max-width: 40rem) {
  .header {
    grid-template-columns: auto 1fr;
    row-gap: 0.5rem;
  }
  .center {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .search {
    max-width: none;
  }
  .admin-link {
    display: none;
  }
}
</style>
