<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.kind" role="status">
        <span>{{ toast.message }}</span>
        <button type="button" class="x" :aria-label="$t('common.close')" @click="dismiss(toast.id)">
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  left: 50%;
  bottom: var(--sp-2);
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  width: min(26rem, calc(100vw - 2rem));
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-1);
  padding: 0.75rem var(--sp-2);
  border-radius: var(--radius);
  background: var(--c-header);
  color: var(--c-header-text);
  box-shadow: var(--shadow-pop);
  pointer-events: auto;
}
.toast.success {
  border-left: 4px solid var(--c-positive);
}
.toast.error {
  border-left: 4px solid var(--c-negative);
}
.toast.info {
  border-left: 4px solid var(--c-accent);
}
.x {
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
