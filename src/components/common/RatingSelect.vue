<script setup lang="ts">
// Optional 1–10 rating (null = none). The ML service weights liked/disliked games by it.
const model = defineModel<number | null>({ required: true })
defineProps<{ id?: string; disabled?: boolean }>()

function onChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  model.value = value === '' ? null : Number(value)
}
</script>

<template>
  <select
    :id="id"
    class="select rating"
    :value="model ?? ''"
    :disabled="disabled"
    @change="onChange"
  >
    <option value="">{{ $t('library.noRating') }}</option>
    <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
  </select>
</template>

<style scoped>
.rating {
  width: auto;
  min-width: 5rem;
  min-height: 2rem;
  padding: 0.125rem 0.5rem;
}
</style>
