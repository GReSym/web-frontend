<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

// Placed after a progressively loaded list: emits `load` while it is near the viewport (or `root`).
// When a page finishes loading and the sentinel is still visible (short page), it asks for the next one.

const props = withDefaults(
  defineProps<{
    active: boolean
    loading: boolean
    root?: HTMLElement | null
    rootMargin?: string
    horizontal?: boolean
  }>(),
  { root: null, rootMargin: '400px', horizontal: false },
)
const emit = defineEmits<{ load: [] }>()

const el = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let visible = false

function maybeLoad() {
  if (visible && props.active && !props.loading) emit('load')
}

watch(
  [el, () => props.root],
  ([target, root]) => {
    observer?.disconnect()
    if (!target) return
    observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting)
        maybeLoad()
      },
      { root, rootMargin: props.rootMargin },
    )
    observer.observe(target)
  },
  { immediate: true, flush: 'post' },
)

watch(
  () => [props.loading, props.active],
  () => maybeLoad(),
  { flush: 'post' },
)

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="el" class="sentinel" :class="{ horizontal }" aria-hidden="true" />
</template>

<style scoped>
.sentinel {
  width: 100%;
  height: 1px;
}
.sentinel.horizontal {
  width: 1px;
  height: auto;
  align-self: stretch;
  flex: 0 0 1px;
}
</style>
