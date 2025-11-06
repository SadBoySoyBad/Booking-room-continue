<!-- front\pages\auth\callback.vue -->
<script setup>
// import { useRouter, useRoute } from 'vue-router'
import { onMounted } from 'vue'
// import { useRouter } from 'vue-router'
import { useRouter } from 'vue-router'

const router = useRouter()
// const route = useRoute()

onMounted(async () => {
  if (import.meta.client) {
    // ไม่ต้องใช้ token จาก query แล้ว
    try {
      const config = useRuntimeConfig()
      const apiBase = config.public.apiBaseURL
      const res = await fetch(`${apiBase}/auth/verify`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        console.log('User:', data.user)
        // แนะนำ: เก็บ data.user ใน store เช่น pinia หรือ sessionStorage ถ้าต้องการ
        // 🔥🔥🔥 เพิ่มตรงนี้เพื่อล้าง sessionStorage ที่อาจทำให้ redirect ผิด
        sessionStorage.removeItem('loginRedirectPath')
        // ✅ เปลี่ยนเส้นทางหลัง login สำเร็จ
        router.replace('/booking')
      } else {
        router.replace('/login')
      }
    } catch (e) {
      console.error('Callback error:', e)
      router.replace('/login')
    }

  }
})
</script>


<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-black text-white">
    <h1 class="text-2xl font-bold mb-4">กำลังเข้าสู่ระบบ...</h1>
    <p class="text-gray-300">กรุณารอสักครู่</p>
  </div>
</template>
