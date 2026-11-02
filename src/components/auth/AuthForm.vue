<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/services/api'
import { safeRedirect } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useErrorMessage } from '@/composables/useErrorMessage'

// Login and Register are two variants of this form (same panel, fields and spacing).

const props = defineProps<{ mode: 'login' | 'register' }>()

const { t } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const errorMessage = useErrorMessage()

const form = reactive({ email: '', password: '' })
const touched = reactive({ email: false, password: false })
const submitting = ref(false)
const serverError = ref<string | null>(null)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emailError = computed(() => {
  if (!form.email.trim()) return t('auth.emailRequired')
  if (!EMAIL_RE.test(form.email.trim())) return t('auth.emailInvalid')
  if (form.email.trim().length > 100) return t('auth.emailTooLong')
  return null
})
const passwordError = computed(() => {
  if (!form.password) return t('auth.passwordRequired')
  // The API accepts 4–64 characters on registration
  if (props.mode === 'register' && (form.password.length < 4 || form.password.length > 64))
    return t('auth.passwordLength')
  return null
})

const otherLink = computed(() => ({
  name: props.mode === 'login' ? 'register' : 'login',
  query: route.query.redirect ? { redirect: route.query.redirect } : {},
}))

async function submit() {
  touched.email = true
  touched.password = true
  serverError.value = null
  if (emailError.value || passwordError.value) return

  submitting.value = true
  try {
    const credentials = { email: form.email.trim(), password: form.password }
    if (props.mode === 'login') await auth.login(credentials)
    else await auth.register(credentials)
    await router.replace(safeRedirect(route.query.redirect))
  } catch (e) {
    if (e instanceof ApiError && props.mode === 'login' && e.status === 401) {
      serverError.value = t('auth.invalidCredentials')
    } else if (
      e instanceof ApiError &&
      props.mode === 'register' &&
      e.status === 400 &&
      !e.fieldErrors.length
    ) {
      // Domain error, e.g. the email is already registered
      serverError.value = /exist|occupied|taken|занят/i.test(e.message)
        ? t('auth.emailTaken')
        : e.message
    } else {
      serverError.value = errorMessage(e)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <form class="panel auth" novalidate @submit.prevent="submit">
      <div class="brand">
        <span class="logo">GReSym</span>
        <h1>{{ mode === 'login' ? $t('auth.signInTitle') : $t('auth.registerTitle') }}</h1>
      </div>

      <div class="field">
        <label for="auth-email">{{ $t('auth.email') }}</label>
        <input
          id="auth-email"
          v-model="form.email"
          class="input"
          :class="{ invalid: touched.email && emailError }"
          type="email"
          autocomplete="email"
          :placeholder="$t('auth.emailPlaceholder')"
          :aria-invalid="touched.email && !!emailError"
          autofocus
          @blur="touched.email = true"
        />
        <span v-if="touched.email && emailError" class="field-error">{{ emailError }}</span>
      </div>

      <div class="field">
        <label for="auth-password">{{ $t('auth.password') }}</label>
        <input
          id="auth-password"
          v-model="form.password"
          class="input"
          :class="{ invalid: touched.password && passwordError }"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          :placeholder="$t('auth.passwordPlaceholder')"
          :aria-invalid="touched.password && !!passwordError"
          @blur="touched.password = true"
        />
        <span v-if="touched.password && passwordError" class="field-error">{{
          passwordError
        }}</span>
      </div>

      <RouterLink :to="otherLink" class="switch">
        {{ mode === 'login' ? $t('auth.toRegister') : $t('auth.toLogin') }}
      </RouterLink>

      <p v-if="serverError" class="server-error" role="alert">{{ serverError }}</p>

      <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
        {{
          submitting
            ? $t('common.wait')
            : mode === 'login'
              ? $t('auth.signIn')
              : $t('auth.register')
        }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100dvh - var(--header-h));
  padding: var(--sp-2);
}
.auth {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  width: var(--w-auth);
  max-width: calc(100vw - 2rem);
  padding: var(--sp-3);
}
.brand {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.logo {
  color: var(--c-accent);
  font-weight: 800;
}
.brand h1 {
  font-size: 1.25rem;
}
.switch {
  align-self: flex-start;
  font-size: 0.875rem;
}
.server-error {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  background: var(--c-negative-soft);
  color: var(--c-negative);
  font-size: 0.875rem;
}
</style>
