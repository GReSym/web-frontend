<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = withDefaults(defineProps<{ open: boolean; title: string; width?: string }>(), {
  width: '32rem',
})
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLElement | null>(null)
const titleId = useId()
let previousFocus: HTMLElement | null = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close')
    return
  }
  // Keep Tab inside the dialog
  if (e.key === 'Tab' && dialog.value) {
    const items = [...dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (!items.length) return
    const first = items[0]!
    const last = items[items.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      const target =
        dialog.value?.querySelector<HTMLElement>('[autofocus]') ??
        dialog.value?.querySelector<HTMLElement>(FOCUSABLE)
      target?.focus()
    } else {
      document.body.style.overflow = ''
      previousFocus?.focus?.()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (props.open) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="backdrop" @mousedown.self="emit('close')" @keydown="onKeydown">
        <div
          ref="dialog"
          class="dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :style="{ maxWidth: width }"
        >
          <header class="head">
            <h2 :id="titleId">{{ title }}</h2>
            <button
              type="button"
              class="btn btn-sm btn-ghost close"
              :aria-label="$t('common.close')"
              @click="emit('close')"
            >
              ✕
            </button>
          </header>
          <div class="body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-2);
  background: var(--c-overlay);
}
.dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100dvh - 2rem);
  border-radius: var(--radius-lg);
  background: var(--c-bg);
  color: var(--c-text);
  box-shadow: var(--shadow-pop);
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-2) 0;
}
.head h2 {
  font-size: 1.25rem;
}
.body {
  padding: var(--sp-2);
  overflow-y: auto;
}
.foot {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--sp-1);
  padding: 0 var(--sp-2) var(--sp-2);
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
