<!-- front/components/login/EmployeeLogin.vue -->
<template>
  <div class="w-full flex flex-col items-center justify-center px-4 sm:px-8 py-10">

    <!-- Back Button -->
    <div class="w-full max-w-md text-left mb-6">
      <div class="text-sm text-blue-900 font-semibold cursor-pointer mb-8 hover:underline" @click="goBack">
        ← Back
      </div>
    </div>

    <!-- Title -->
    <div class="w-full max-w-md text-left mb-10">
      <h2 class="text-2xl font-bold text-[#2B2F6F]">Choose how you’d like to sign in.</h2>
    </div>

    <!-- Google Sign-in -->
    <button 
      class="w-full max-w-md flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition border border-gray-200 mb-6"
      @click="loginWithGoogle">
      <img src="/google.png" alt="Google" class="h-5 w-5" >
      <span class="text-[#2B2F6F] font-semibold text-base">Sign in with Google</span>
    </button>

    <!-- Divider -->
    <div class="text-gray-400 text-sm font-medium mb-6">OR</div>

    <!-- Microsoft Sign-in -->
    <button 
      class="w-full max-w-md flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition border border-gray-200"
      @click="loginWithMicrosoft">
      <img src="/microsoft365.png" alt="Microsoft" class="h-5 w-5" >
      <span class="text-[#2B2F6F] font-semibold text-base">Sign in with Microsoft</span>
    </button>

  </div>
</template>


<script setup>
import { useApi } from '~/composables/useApi'
import { useRouter } from 'vue-router'

const api = useApi()
const router = useRouter()

const emit = defineEmits(['back'])

// ✅ สำหรับ Google → redirect ไป OAuth จริง
const config = useRuntimeConfig()

const loginWithGoogle = () => {
  const baseUrl = config.public.authURL;
  const currentPath = window.location.pathname;
  // Store current path for redirect after login
  sessionStorage.setItem('loginRedirectPath', currentPath);
  // Make sure the URL matches the backend route exactly
  window.location.href = `${baseUrl}/api/auth/google`;
  console.log('Redirecting to Google OAuth...');
}


// ❌ สำหรับ Microsoft ยังใช้ mock อยู่
const loginWithMicrosoft = async () => {
  try {
    const response = await api('/users/employee-login', {
      method: 'POST',
      body: {
        email: 'user@outlook.com',
        name: 'Microsoft User',
        provider: 'microsoft',
      },
    })

    if (response.user) {
      // Store in localStorage to align with auth/myinfo checks
      localStorage.setItem('token', response.token)
      router.push('/')
    }
  } catch (err) {
    console.error(err)
    alert('Microsoft login failed')
  }
}

const goBack = () => {
  emit('back')
}
</script>
