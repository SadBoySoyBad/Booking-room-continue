<template>
  <div>
    <header
      class="flex justify-between items-center px-3 py-3 bg-white text-black shadow-lg border-b border-black sm:px-4 md:px-6"
    >
      <NuxtLink to="/" class="hover:underline transition flex-shrink-0">
        <div class="flex items-center space-x-1">
          <img src="/logo.png" alt="logo" class="h-6 w-auto sm:h-7 md:h-8" >
          <h1
            class="text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis sm:text-xl md:text-2xl"
          >
            arrangemeet.
          </h1>
        </div>
      </NuxtLink>

      <nav
        class="flex flex-nowrap items-center gap-x-1 text-xs font-bold mr-1 sm:gap-x-2 sm:text-sm md:gap-x-4 md:text-md lg:gap-x-6 lg:text-md md:mr-5"
      >
        <div>
          <button
            class="text-red-500 hover:underline transition button-as-link whitespace-nowrap min-w-0"
            @click="openLetterBox"
          >
            <img src="/letterbox.png" alt="letterbox" class="h-4 w-auto mt-2 sm:h-5" >
          </button>

          <LetterBoxPopup
            :is-visible="isLetterBoxPopupVisible"
            @close-letter-box="isLetterBoxPopupVisible = false"
          />
        </div>

        <NuxtLink to="/history" class="hover:underline transition whitespace-nowrap min-w-0">
          History
        </NuxtLink>
        <NuxtLink to="/booking" class="hover:underline transition whitespace-nowrap min-w-0">
          Reservation
        </NuxtLink>

        <template v-if="isLoggedIn">
          <button
            class="px-3 py-1 rounded-full bg-red-600 text-white font-bold whitespace-nowrap min-w-0 hover:bg-red-700 active:bg-red-800 active:scale-95 transition-all duration-150"
            @click="logout"
          >
            Logout
          </button>
        </template>
        <template v-else>
          <NuxtLink
            to="/login"
            class="transition whitespace-nowrap min-w-0 hover:shadow active:scale-95 active:shadow-lg transition-all duration-150 hover:shadow transition cursor-pointer"
          >
            Login
          </NuxtLink>
        </template>
      </nav>
    </header>
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import LetterBoxPopup from '~/components/LetterBoxPopup.vue'

const { user, isLoggedIn, fetchUser, logout: baseLogout } = useAuth()
const logout = async () => {
  await baseLogout()
  router.push('/')  // redirect ไปหน้าแรกหลัง logout
}

const router = useRouter()

const isLetterBoxPopupVisible = ref(false)
const openLetterBox = () => {
  isLetterBoxPopupVisible.value = true
}

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }
})
</script>


<style scoped>
.button-as-link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
</style>
