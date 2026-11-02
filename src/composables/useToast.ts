import { readonly, ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
}

// App-wide: a single <ToastHost> in App.vue renders them
const toasts = ref<Toast[]>([])
let nextId = 1

function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

function show(message: string, kind: ToastKind = 'info', timeoutMs = 4000) {
  const id = nextId++
  toasts.value.push({ id, kind, message })
  if (timeoutMs > 0) setTimeout(() => dismiss(id), timeoutMs)
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    dismiss,
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error', 7000),
    info: (message: string) => show(message, 'info'),
  }
}
