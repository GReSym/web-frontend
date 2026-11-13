/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** "false" hides the reassurance notice on the registration form (RegisterNotice.vue) */
  readonly VITE_REGISTER_NOTICE?: string
}
