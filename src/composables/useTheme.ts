import { useColorMode } from '@vueuse/core'

/** light / dark / auto (follows the OS), saved in localStorage; index.html applies it before the first paint. */
export function useTheme() {
  const mode = useColorMode({
    storageKey: 'gresym-theme',
    attribute: 'class',
    modes: { light: '', dark: 'dark' },
    emitAuto: true,
  })

  function cycle() {
    mode.value = mode.value === 'auto' ? 'light' : mode.value === 'light' ? 'dark' : 'auto'
  }

  return { mode, cycle }
}
