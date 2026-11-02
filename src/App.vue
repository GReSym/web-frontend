<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import ToastHost from '@/components/common/ToastHost.vue'
</script>

<template>
  <AppHeader />
  <main>
    <RouterView />
  </main>
  <ToastHost />
</template>
