import { useAuth } from '~/composables/useAuth'
export default defineNuxtPlugin(async (nuxtApp) => {
  const { fetchUser } = useAuth()
  if (import.meta.server || !nuxtApp.payload.serverRendered) await fetchUser()
  if (import.meta.client) {
    nuxtApp.hook('app:mounted', fetchUser)
    window.addEventListener('storage', (event) => { if (event.key === 'token') fetchUser() })
  }
})
