<script setup lang="ts">
import { computed, ref } from 'vue'

// Wrapping tag labels; long names are ellipsized, long lists are cut to `max` with a "+N" toggle.

const props = withDefaults(
  defineProps<{ tags: string[] | null | undefined; max?: number; expandable?: boolean }>(),
  {
    max: 12,
    expandable: true,
  },
)

const expanded = ref(false)
const all = computed(() => props.tags ?? [])
const visible = computed(() => (expanded.value ? all.value : all.value.slice(0, props.max)))
const hidden = computed(() => all.value.length - visible.value.length)
</script>

<template>
  <ul v-if="all.length" class="tags">
    <li v-for="tag in visible" :key="tag" class="tag" :title="tag">{{ tag }}</li>
    <li v-if="hidden > 0 || expanded">
      <button
        v-if="expandable"
        type="button"
        class="more"
        :aria-expanded="expanded"
        @click.prevent="expanded = !expanded"
      >
        {{ expanded ? $t('common.less') : `+${hidden}` }}
      </button>
      <span v-else class="tag">+{{ hidden }}</span>
    </li>
  </ul>
</template>

<style scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
}
.tags > li {
  max-width: 100%;
  min-width: 0;
}
.more {
  padding: 0.125rem 0.5rem;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius);
  background: none;
  color: var(--c-text-muted);
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
}
</style>
