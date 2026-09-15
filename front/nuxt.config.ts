import { defineNuxtConfig } from 'nuxt/config'
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  debug: false,
  devtools: { enabled: false },
  devServer: { host: '0.0.0.0', port: 3000 },
  runtimeConfig: {
    backendURL: process.env.NUXT_BACKEND_URL || 'http://127.0.0.1:3001',
    public: {
      apiBaseURL: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
      authURL: process.env.NUXT_PUBLIC_AUTH_URL || '',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    },
  },
  modules: ['@nuxtjs/tailwindcss'],
})
