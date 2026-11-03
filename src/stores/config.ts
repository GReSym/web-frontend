import { ref } from 'vue'
import { defineStore } from 'pinia'
import { configService } from '@/services/configService'
import { mediaUrl, type MediaPreset } from '@/utils/media'

// Site configuration from GET /api/config, loaded once at startup without blocking the first render: until it
// arrives, Steam images show as usual and stored paths show the placeholder.

export const useConfigStore = defineStore('config', () => {
  const mediaBaseUrl = ref('')
  let loading: Promise<void> | null = null

  function load(): Promise<void> {
    loading ??= configService
      .get()
      .then((config) => {
        mediaBaseUrl.value = config.mediaBaseUrl
      })
      .catch(() => {
        // The API is down: Steam images still work, retried on the next load()
        loading = null
      })
    return loading
  }

  function setMediaBaseUrl(value: string) {
    mediaBaseUrl.value = value
  }

  function imageUrl(reference: string | null | undefined, preset: MediaPreset): string | null {
    return mediaUrl(reference, preset, mediaBaseUrl.value)
  }

  return { mediaBaseUrl, load, setMediaBaseUrl, imageUrl }
})
