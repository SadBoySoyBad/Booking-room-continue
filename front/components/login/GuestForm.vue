<template>
  <!-- Back -->
  <div class="text-sm text-blue-900 font-semibold cursor-pointer mb-8 hover:underline" @click="goBack">
    ← Back
  </div>

  <!-- Title -->
  <h2 class="text-2xl font-bold text-blue-900 mb-8  text-center">Let’s get started.</h2>
  <div class="flex flex-col justify-center items-center w-full">
    <div class="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100 space-y-6">

      <!-- OAuth icons -->
      <div class="flex justify-center items-center space-x-6">
        <img
          src="/microsoft365.png" 
          alt="Microsoft 365" 
          class="h-6 w-6 cursor-pointer hover:scale-110 transition"
          @click="loginWithMicrosoft" >
        <img 
          src="/google.png" 
          alt="Google" 
          class="h-6 w-6 cursor-pointer hover:scale-110 transition"
          @click="loginWithGoogle" >
      </div>


      <!-- Divider -->
      <div class="flex items-center space-x-4">
        <div class="h-px flex-1 bg-blue-900/20"/>
        <span class="text-blue-900 font-semibold text-sm">OR</span>
        <div class="h-px flex-1 bg-blue-900/20"/>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="text-sm font-medium text-blue-900 block mb-1">Name</label>
          <input
            v-model="guest.name" required type="text" placeholder="Enter your name"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" >
        </div>

        <div>
          <label class="text-sm font-medium text-blue-900 block mb-1">Phone</label>
          <input 
            v-model="guest.phone" required type="tel" inputmode="numeric" placeholder="+00  Placeholder"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
            @input="guest.phone = guest.phone.replace(/\D/g, '')">
        </div>

        <div>
          <label class="text-sm font-medium text-blue-900 block mb-1">Company</label>
          <input 
            v-model="guest.company" type="text" placeholder="Placeholder"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" >
        </div>

        <!-- Terms -->
        <div class="text-xs text-gray-600 flex items-start gap-2">
          <input type="checkbox" v-model="accepted" required class="mt-1.5 accent-blue-600" >
          <span>
            By continuing, you agree to <strong class="text-blue-800">Arrangemeet’s</strong>
            <a href="/terms" class="underline text-blue-800">Terms of Service</a> and
            <a href="/privacy" class="underline text-blue-800">Privacy Policy</a>
          </span>
        </div>

        <button 
          type="submit"
          :disabled="!accepted"
          class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
          Sign In
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const config = useRuntimeConfig()
const guest = ref({ name: '', phone: '', company: '' })
const accepted = ref(false)
const api = useApi()
const router = useRouter()
const { fetchUser } = useAuth()

const emit = defineEmits(['back'])

const loginWithGoogle = () => {
  const baseUrl = config.public.authURL
  const currentPath = window.location.pathname
  sessionStorage.setItem('loginRedirectPath', currentPath)
  window.location.href = `${baseUrl}/api/auth/google`
}

const loginWithMicrosoft = () => {
  const baseUrl = config.public.authURL
  const currentPath = window.location.pathname
  sessionStorage.setItem('loginRedirectPath', currentPath)
  window.location.href = `${baseUrl}/api/auth/microsoft`
}

const handleGuestLogin = async () => {
  try {
    const response = await api('/users/guest-login', {
      method: 'POST',
      body: {
        name: guest.value.name,
        phone: guest.value.phone,
        company: guest.value.company,
      },
    })

    if (response.user && response.token) {
      localStorage.setItem('token', response.token)
      await fetchUser()
      router.push('/')
    } else {
      alert('เข้าสู่ระบบ Guest ไม่สำเร็จ')
    }
  } catch (err) {
    alert(`เข้าสู่ระบบ Guest ไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`)
  }
}

const handleSubmit = () => {
  handleGuestLogin()
}

const goBack = () => {
  // กลับไปหน้าเลือก role
  emit('back')
}
</script>
