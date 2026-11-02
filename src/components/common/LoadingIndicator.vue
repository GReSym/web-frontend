<script setup lang="ts">
withDefaults(defineProps<{ label?: string; inline?: boolean }>(), { inline: false })
</script>

<template>
  <div class="loading" :class="{ inline }" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true" />
    <span class="text">{{ label ?? $t('common.loading') }}</span>
  </div>
</template>

<style scoped>
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  padding: var(--sp-3) 0;
  color: var(--c-text-muted);
}
.loading.inline {
  display: inline-flex;
  padding: 0;
}
.spinner {
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid var(--c-surface-3);
  border-top-color: var(--c-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
