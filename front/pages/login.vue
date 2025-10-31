<template>
  <div class="min-h-screen flex flex-col sm:flex-row">
    <!-- Left Section -->
    <div class="sm:w-1/2 flex flex-col justify-between bg-cover bg-center text-white p-6 sm:p-8 rounded-tr-[30px] rounded-br-[30px] sm:rounded-tr-[40px] sm:rounded-br-[40px] md:rounded-tr-[50px] md:rounded-br-[50px]" style="background-image: url('/Background01 1.png')">
      <!-- Logo Top Left -->
      <div class="flex items-center space-x-2">
        <img src="/logowhite.png" alt="arrangemeet logo" class="h-6 sm:h-7 md:h-8" >
        <span class="font-bold text-white text-base sm:text-lg md:text-xl">arrangemeet.</span>
      </div>

      <!-- Centered Text -->
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center space-y-4 max-w-xs sm:max-w-sm">
          <h1 class="text-3xl sm:text-4xl font-bold">Welcome!<br>Who’s signing in today?</h1>
          <p class="text-sm sm:text-base">To continue with us please select which role suits you the most!</p>
        </div>
      </div>
    </div>

    <!-- Right Section -->
    <div class="sm:w-1/2 flex flex-col justify-center items-center p-6 sm:p-10 bg-white">
      <div class="w-full max-w-md space-y-6">
        <!-- Back Button -->
        <LoginTypeSelector v-if="selected === ''" @select="selected = $event" />

        <!-- Forms -->
        <div class="pt-4">
          <GuestForm v-if="selected === 'guest'" @back="selected = ''" />
          <EmployeeLogin v-if="selected === 'employee'" @back="selected = ''" />

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import GuestForm from '~/components/login/GuestForm.vue'
import EmployeeLogin from '~/components/login/EmployeeLogin.vue'
import LoginTypeSelector from '~/components/login/LoginTypeSelector.vue'

definePageMeta({
  layout: 'blank',
})
const selected = ref('')
</script>

<style scoped>
/* Responsive fallback for very small screens */
@media (max-width: 640px) {
  h1 {
    font-size: 1.5rem;
  }
}
</style>
