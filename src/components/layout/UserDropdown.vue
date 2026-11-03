<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
onClickOutside(root, () => (open.value = false))

function logout() {
  open.value = false
  auth.logout()
  if (router.currentRoute.value.meta.requiresAuth) router.push({ name: 'home' })
}
</script>

<template>
  <div ref="root" class="user" @keydown.esc="open = false">
    <button
      type="button"
      class="icon"
      :aria-label="$t('header.userMenu')"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="currentColor" />
      </svg>
    </button>

    <div v-if="open" class="menu" role="menu" @click="open = false">
      <template v-if="auth.isAuthenticated">
        <p v-if="auth.user" class="who">{{ auth.user.name || auth.user.email }}</p>
        <RouterLink class="entry" role="menuitem" :to="{ name: 'profile' }">{{
          $t('nav.profile')
        }}</RouterLink>
        <RouterLink class="entry" role="menuitem" :to="{ name: 'lists' }">{{
          $t('nav.lists')
        }}</RouterLink>
        <RouterLink v-if="auth.isAdmin" class="entry" role="menuitem" :to="{ name: 'admin' }">
          {{ $t('nav.admin') }}
        </RouterLink>
        <button type="button" class="entry" role="menuitem" @click="logout">
          {{ $t('nav.logout') }}
        </button>
      </template>
      <template v-else>
        <RouterLink class="entry" role="menuitem" :to="{ name: 'login' }">{{
          $t('nav.login')
        }}</RouterLink>
        <RouterLink class="entry" role="menuitem" :to="{ name: 'register' }">{{
          $t('nav.register')
        }}</RouterLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.user {
  position: relative;
}
.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.12);
  color: var(--c-header-text);
  cursor: pointer;
}
.icon:hover {
  background: rgb(255 255 255 / 0.22);
}
.menu {
  position: absolute;
  top: calc(100% + 0.375rem);
  right: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  min-width: 12rem;
  padding: 0.25rem 0;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-bg);
  box-shadow: var(--shadow-pop);
}
.who {
  padding: 0.375rem 1rem 0.5rem;
  border-bottom: 1px solid var(--c-border);
  color: var(--c-text-muted);
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.entry {
  display: block;
  padding: 0.5rem 1rem;
  border: 0;
  background: none;
  color: var(--c-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.entry + .entry {
  border-top: 1px solid var(--c-border);
}
.entry:hover {
  background: var(--c-surface);
  text-decoration: none;
}
</style>
