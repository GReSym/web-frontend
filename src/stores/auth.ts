import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { setAuthToken } from '@/services/api'
import { authService, type Credentials } from '@/services/authService'
import { userService } from '@/services/userService'
import type { UserInfo } from '@/types/api'

const TOKEN_KEY = 'gresym-token'

/** Seconds since epoch when the JWT expires, or null if it can't be read. */
function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.exp === 'number' ? json.exp : null
  } catch {
    return null
  }
}

function isExpired(token: string): boolean {
  const exp = tokenExpiry(token)
  return exp !== null && exp * 1000 <= Date.now()
}

function readStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    return token && !isExpired(token) ? token : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(readStoredToken())
  const user = ref<UserInfo | null>(null)
  let loading: Promise<void> | null = null

  setAuthToken(token.value)

  const isAuthenticated = computed(() => token.value !== null && !isExpired(token.value))
  const isAdmin = computed(() => isAuthenticated.value && user.value?.isAdmin === true)

  function setToken(value: string | null) {
    token.value = value
    setAuthToken(value)
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      // storage unavailable: the session lasts until reload
    }
  }

  /** Loads the current user once per token (the router guard awaits it). */
  function ensureUser(): Promise<void> {
    if (!isAuthenticated.value) {
      user.value = null
      return Promise.resolve()
    }
    if (user.value) return Promise.resolve()
    loading ??= userService
      .getMe()
      .then((me) => {
        user.value = me
      })
      .catch(() => {
        // Invalid token or the API is down: continue as a guest
        logout()
      })
      .finally(() => {
        loading = null
      })
    return loading
  }

  async function authenticate(token: string) {
    setToken(token)
    user.value = null
    await ensureUser()
  }

  async function login(credentials: Credentials) {
    const { token } = await authService.login(credentials)
    await authenticate(token)
  }

  async function register(credentials: Credentials) {
    const { token } = await authService.register(credentials)
    await authenticate(token)
  }

  function logout() {
    setToken(null)
    user.value = null
  }

  function setUser(next: UserInfo) {
    user.value = next
  }

  return { token, user, isAuthenticated, isAdmin, ensureUser, login, register, logout, setUser }
})
