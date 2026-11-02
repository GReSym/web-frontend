<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import JsonNode from './JsonNode.vue'

const props = withDefaults(
  defineProps<{ value: unknown; openDepth?: number; maxHeight?: string }>(),
  {
    openDepth: 2,
    maxHeight: '32rem',
  },
)

const toast = useToast()
const { t } = useI18n()
const text = computed(() => JSON.stringify(props.value, null, 2))

async function copy() {
  try {
    await navigator.clipboard.writeText(text.value)
    toast.success(t('common.copied'))
  } catch {
    toast.error(t('common.clipboardFailed'))
  }
}
</script>

<template>
  <div class="json" :style="{ maxHeight }">
    <button type="button" class="btn btn-sm btn-ghost copy" @click="copy">
      {{ $t('common.copy') }}
    </button>
    <JsonNode :value="value" :open-depth="openDepth" />
  </div>
</template>

<style scoped>
.json {
  position: relative;
  overflow: auto;
  padding: var(--sp-2);
  border-radius: var(--radius);
  background: var(--c-surface-2);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}
.copy {
  position: sticky;
  top: 0;
  float: right;
  background: var(--c-bg);
}
</style>
