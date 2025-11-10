import { useAuth } from '~/composables/useAuth'

export default defineNuxtPlugin(async () => {
  const { user, fetchUser } = useAuth()

  // Fetch once on app start so navbar reflects current session (cookie/local token)
  try {
    if (!user.value) {
      await fetchUser()
    }
  } catch {}

  // React to token changes across tabs
  if (process.client) {
    window.addEventListener('storage', (e) => {
      if (e.key === 'token') {
        fetchUser()
      }
    })
  }
})

