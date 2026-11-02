<script setup lang="ts">
import { computed } from 'vue'
import { useErrorMessage } from '@/composables/useErrorMessage'

const props = defineProps<{ error: unknown; retryable?: boolean }>()
defineEmits<{ retry: [] }>()

const errorMessage = useErrorMessage()
const text = computed(() => errorMessage(props.error))
</script>

<template>
  <div class="error" role="alert">
    <span>{{ text }}</span>
    <button v-if="retryable" type="button" class="btn btn-sm btn-ghost" @click="$emit('retry')">
      {{ $t('common.retry') }}
    </button>
  </div>
</template>

<style scoped>
.error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  flex-wrap: wrap;
  padding: 0.75rem var(--sp-2);
  border-radius: var(--radius);
  background: var(--c-negative-soft);
  color: var(--c-negative);
}
</style>
