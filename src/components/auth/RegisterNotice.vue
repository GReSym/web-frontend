<script setup lang="ts">
// Reassurance for cautious users on the registration form: no email checks, no Steam login, hashed passwords.
// Self-contained on purpose: turn it off with VITE_REGISTER_NOTICE=false (renders nothing then),
// or delete this file and its one use in AuthForm.vue.
const enabled = import.meta.env.VITE_REGISTER_NOTICE !== 'false'
</script>

<template>
  <aside v-if="enabled" class="register-notice small" role="note">
    <p>{{ $t('auth.notice.email') }}</p>
    <p>{{ $t('auth.notice.steam') }}</p>
    <p>{{ $t('auth.notice.password') }}</p>
  </aside>
</template>

<style scoped>
.register-notice {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.625rem 0.75rem;
  border-left: 3px solid var(--c-accent);
  border-radius: var(--radius);
  background: var(--c-accent-soft);
}
</style>
