// FILE: composables/useAuth.ts
import { useRuntimeConfig } from '#app'
import { computed } from 'vue'
import { useState } from '#imports'

export const useAuth = () => {
  const user = useState<Record<string, any> | null>('user', () => null)
  const isLoggedIn = computed(() => !!user.value)
  const config = useRuntimeConfig()

  const request = useRequestFetch()
  const fetchUser = async () => {
    try {
      const headers: Record<string, string> = {}
      const token = import.meta.client ? localStorage.getItem('token') : null
      if (token) headers.Authorization = `Bearer ${token}`
      const data = await request<{ user: Record<string, any> | null }>(`${config.public.apiBaseURL}/auth/myinfo`, {
        credentials: 'include', headers,
      })
      user.value = data.user
    } catch { user.value = null }
  }

  const logout = async () => {
    try {
      if (import.meta.client) localStorage.removeItem('token')
      await fetch(`${config.public.apiBaseURL}/auth/logout?ts=${Date.now()}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      })
    } catch {}
    user.value = null
  }

  return {
    user,
    isLoggedIn,
    fetchUser,
    logout
  }
}
