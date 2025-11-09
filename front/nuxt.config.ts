// potter
// import { defineNuxtConfig } from 'nuxt/config'

// export default defineNuxtConfig({
//   ssr: true,

//   compatibilityDate: '2025-05-15',

//   devtools: { enabled: false }, // ✅ ปิด devtools ใน production

//   devServer: {
//     host: '0.0.0.0',
//     port: 3000,
//   },

//   runtimeConfig: {
//     public: {
//       apiBaseURL: process.env.NUXT_PUBLIC_API_BASE_URL,
//     },
//   },

//   modules: [
//     '@nuxtjs/tailwindcss',
//     '@nuxt/content',
//     '@nuxt/fonts',
//     '@nuxt/icon',
//     '@nuxt/image',
//     '@nuxt/scripts',
//     '@nuxt/ui'
//   ]
// })


// Nine
// front\nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },

  devServer: { // <--- devServer บล็อกเริ่มต้น
    host: '0.0.0.0',
    port: 3000,
    // hmr: false // ปิด HMR เพื่อหลีกเลี่ยง WebSocket Error
  }, // <--- devServer บล็อกปิด (มีคอมมา)

  runtimeConfig: { // <--- runtimeConfig บล็อกเริ่มต้น (อยู่ระดับเดียวกับ devServer)
    public: {
      apiBaseURL: process.env.NUXT_PUBLIC_API_BASE_URL, // จะถูกโอเวอร์ไรด์โดย NUXT_PUBLIC_API_BASE_URL
      authURL: process.env.NUXT_PUBLIC_AUTH_URL, // default value
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID, // จะถูกโอเวอร์ไรด์โดย NUXT_PUBLIC_GOOGLE_CLIENT_ID
    },
    googleClientSecret: process.env.NUXT_GOOGLE_CLIENT_SECRET, // จะถูกโอเวอร์ไรด์โดย NUXT_GOOGLE_CLIENT_SECRET
  }, // <--- runtimeConfig บล็อกปิด (มีคอมมา)

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui'
  ]
})