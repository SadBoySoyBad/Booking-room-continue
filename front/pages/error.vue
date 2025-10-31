<template>
  <div class="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
    <div class="relative p-8 sm:p-10 md:p-12 text-center max-w-xl w-full">
      <h1
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl sm:text-8xl md:text-[10rem] lg:text-[12rem] xl:text-[14rem] font-bold text-red-300 opacity-50 z-0 tracking-widest pointer-events-none whitespace-nowrap"
      >
        ERROR
      </h1>

      <p class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-8 relative z-10 mt-16 sm:mt-20 md:mt-24 top-6">
        SOMETHING WENT WRONG!
      </p>

      <button
        class="bg-gradient-to-r from-rose-500 to-rose-700 text-white font-semibold py-2 px-6 sm:py-3 sm:px-8 rounded-full shadow-md hover:from-rose-600 hover:to-rose-800 transition duration-300 relative z-10 text-sm sm:text-base"
        @click="goToDashboard"
      >
        RETURN TO DASHBOARD
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToDashboard = () => {
  router.push('/dashboard');
};
</script>

<style scoped>
/* No custom styles needed, Tailwind CSS handles responsiveness */
</style>