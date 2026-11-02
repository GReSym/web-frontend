<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <div class="empty">
    <p>{{ text }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-1);
  padding: var(--sp-3) var(--sp-2);
  color: var(--c-text-muted);
  text-align: center;
}
</style>
