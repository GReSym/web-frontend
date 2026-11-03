<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { MediaPreset } from '@/utils/media'

// A lazily loaded game image (media store or Steam CDN, see utils/media.ts) inside a fixed-ratio frame (no layout
// shift), with a placeholder when there's no image or it fails. Never eager: only images near the viewport load.

const props = withDefaults(
  defineProps<{
    /** Image reference from the API: a Steam URL or a media store path. */
    src: string | null | undefined
    alt: string
    preset?: MediaPreset
    ratio?: string
    fit?: 'cover' | 'contain'
  }>(),
  { preset: 'header', ratio: '460 / 215', fit: 'cover' },
)

const config = useConfigStore()
const url = computed(() => config.imageUrl(props.src, props.preset))

const failed = ref(false)
watch(url, () => (failed.value = false))
</script>

<template>
  <div class="img-frame" :style="{ aspectRatio: ratio }">
    <img
      v-if="url && !failed"
      :src="url"
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
