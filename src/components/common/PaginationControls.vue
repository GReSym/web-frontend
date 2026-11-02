<script setup lang="ts">
// Previous / next page buttons. The API doesn't return totals, so "next" is enabled while a page is full.
defineProps<{ page: number; hasNext: boolean; disabled?: boolean }>()
defineEmits<{ change: [page: number] }>()
</script>

<template>
  <nav class="pagination" :aria-label="$t('common.pagination')">
    <span class="muted small">{{ $t('common.page', { n: page }) }}</span>
    <button
      type="button"
      class="btn btn-sm"
      :disabled="disabled || page <= 1"
      @click="$emit('change', page - 1)"
    >
      ← {{ $t('common.prevPage') }}
    </button>
    <button
      type="button"
      class="btn btn-sm"
      :disabled="disabled || !hasNext"
      @click="$emit('change', page + 1)"
    >
      {{ $t('common.nextPage') }} →
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}
.pagination .muted {
  margin-right: 0.5rem;
}
</style>
