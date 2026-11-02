<script setup lang="ts">
import { useId } from 'vue'

// Recommend: Yes (true / liked) · No (false / disliked) · — (null / not evaluated)

const model = defineModel<boolean | null>({ required: true })
defineProps<{ label?: string; disabled?: boolean }>()

const name = useId()
const options = [
  { value: true, key: 'library.yes', cls: 'yes' },
  { value: false, key: 'library.no', cls: 'no' },
  { value: null, key: 'library.notEvaluated', cls: 'none' },
] as const
</script>

<template>
  <div class="toggle" role="radiogroup" :aria-label="label ?? $t('library.recommend')">
    <label
      v-for="opt in options"
      :key="String(opt.value)"
      class="opt"
      :class="[opt.cls, { on: model === opt.value }]"
    >
      <input
        class="visually-hidden"
        type="radio"
        :name="name"
        :checked="model === opt.value"
        :disabled="disabled"
        @change="model = opt.value"
      />
      {{ $t(opt.key) }}
    </label>
  </div>
</template>

<style scoped>
.toggle {
  display: inline-flex;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  overflow: hidden;
}
.opt {
  padding: 0.25rem 0.75rem;
  background: var(--c-bg);
  color: var(--c-text-muted);
  font-size: 0.875rem;
  cursor: pointer;
  user-select: none;
}
.opt + .opt {
  border-left: 1px solid var(--c-border);
}
.opt:focus-within {
  outline: 2px solid var(--c-focus);
  outline-offset: -2px;
}
.opt.on.yes {
  background: var(--c-positive);
  color: #fff;
}
.opt.on.no {
  background: var(--c-negative);
  color: #fff;
}
.opt.on.none {
  background: var(--c-surface-3);
  color: var(--c-text);
}
</style>
