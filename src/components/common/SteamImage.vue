<script setup lang="ts">
import { ref, watch } from 'vue'

// A lazily loaded image from the Steam CDN inside a fixed-ratio frame (no layout shift), with a placeholder
// when there's no URL or the image fails. Never eager: only images near the viewport are requested.

const props = withDefaults(
  defineProps<{
    src: string | null | undefined
    alt: string
    ratio?: string
    fit?: 'cover' | 'contain'
  }>(),
  { ratio: '460 / 215', fit: 'cover' },
)

const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false),
)
</script>

<template>
  <div class="img-frame" :style="{ aspectRatio: ratio }">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      :style="{ objectFit: fit }"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="failed = true"
    />
    <div v-else class="placeholder" role="img" :aria-label="alt">
      <span>{{ alt }}</span>
    </div>
  </div>
</template>

<style scoped>
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: var(--sp-1);
  color: var(--c-text-muted);
  font-size: 0.875rem;
  text-align: center;
  overflow: hidden;
}
</style>
