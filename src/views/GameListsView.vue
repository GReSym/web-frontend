<script setup lang="ts">
import GameListSection from '@/components/lists/GameListSection.vue'
</script>

<template>
  <div class="page lists">
    <h1>{{ $t('lists.title') }}</h1>
    <p class="muted">{{ $t('lists.intro') }}</p>
    <GameListSection status="planned" />
    <GameListSection status="rejected" />
  </div>
</template>

<style scoped>
.lists {
  max-width: var(--w-recs);
}
</style>
