<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/layout/AppHeader.vue'
import ToastHost from '@/components/common/ToastHost.vue'

const auth = useAuthStore()
</script>

<template>
  <AppHeader />
  <main>
    <RouterView :key="auth.token ?? 'guest'" />
  </main>
  <ToastHost />
</template>
