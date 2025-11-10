// FILE: composables/useAuth.ts
import { useRuntimeConfig } from '#app'
import { computed } from 'vue'            
import { useState } from '#imports'          

export const useAuth = () => {
  const user = useState('user', () => null)
  const isLoggedIn = computed(() => !!user.value)
  const config = useRuntimeConfig()

  const fetchUser = async () => {
    try {
      const headers: Record<string, string> = {}
      const t = localStorage.getItem('token')
      if (t) headers['Authorization'] = `Bearer ${t}`
      const res = await fetch(`${config.public.apiBaseURL}/auth/myinfo`, {
        credentials: 'include',
        headers
      })
      if (res.ok) {
        const data = await res.json()
        user.value = data.user
      } else {
        user.value = null
      }
    } catch (err) {
      user.value = null
    }
  }

  const logout = async () => {
    try {
      localStorage.removeItem('token')
      await fetch(`${config.public.apiBaseURL}/auth/logout`, {
        credentials: 'include'
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
