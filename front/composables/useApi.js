import { useRuntimeConfig, useRequestHeaders } from '#app'
export const useApi = () => {
  const config = useRuntimeConfig()
  const base = String(config.public.apiBaseURL || '/api').replace(/\/$/, '')
  const forwarded = import.meta.server ? useRequestHeaders(['cookie', 'authorization']) : {}
  return async (url, options = {}) => {
    const headers = { ...forwarded, ...options.headers }
    const token = import.meta.client ? localStorage.getItem('token') : null
    if (token) headers.Authorization = `Bearer ${token}`
    return await $fetch(`${base}/${url.replace(/^\//, '')}`, {
      ...options, headers, credentials: 'include',
      onResponseError({ response }) {
        const error = new Error(response._data?.message || `Request failed (${response.status})`)
        error.status = response.status
        throw error
      },
    })
  }
}
export function getBookingsByDate(date) {
  return useApi()(`/bookings/daily/${date}`)
}
