import { request } from './api'
import type { AuthResponse } from '@/types/api'

export interface Credentials {
  email: string
  password: string
}

export const authService = {
  login: (body: Credentials) => request<AuthResponse>('/auth/login', { method: 'POST', body }),
  register: (body: Credentials) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body }),
}
