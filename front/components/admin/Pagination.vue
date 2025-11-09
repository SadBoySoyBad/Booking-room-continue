<template>
  <nav class="flex items-center justify-center space-x-2">
    <button
      class="p-2 rounded-full bg-[#DDDEDF] text-gray-700 hover:bg-gray-300 transition-colors"
      :disabled="currentPage <= 1"
      @click="goToPage(currentPage - 1)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <button
      v-for="page in visiblePages"
      :key="page"
      class="px-4 py-2 rounded-full font-semibold text-sm transition-colors"
      :class="{
        'bg-[#3C3F9D] text-[#FFFFFF]': page === currentPage,
        'bg-[#FFFFFF] text-[#3C3F9D] hover:bg-gray-300': page !== currentPage,
      }"
      @click="goToPage(page)"
    >
      {{ page }}
    </button>

    <button
      class="p-2 rounded-full bg-[#DDDEDF] text-[#3C3F9D] hover:bg-gray-300 transition-colors"
      :disabled="currentPage >= totalPages"
      @click="goToPage(currentPage + 1)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  // สามารถเพิ่ม prop สำหรับจำนวนปุ่มที่แสดง เช่น visibleButtons: 5
});

const emit = defineEmits(['page-changed']);

const goToPage = (page) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('page-changed', page);
  }
};

// Logic เพื่อคำนวณปุ่มหน้าที่ควรแสดงผล (เช่น 1 2 3 ... 99)
const visiblePages = computed(() => {
  const pages = [];
  const maxVisibleButtons = 5; // จำนวนปุ่มตัวเลขสูงสุดที่จะแสดง
  const half = Math.floor(maxVisibleButtons / 2);

  let startPage = Math.max(1, props.currentPage - half);
  let endPage = Math.min(props.totalPages, props.currentPage + half);

  // ปรับให้แสดงปุ่มครบจำนวนถ้าหน้าสุดท้ายหรือหน้าแรกอยู่ใกล้ๆ
  if (endPage - startPage + 1 < maxVisibleButtons) {
    if (startPage === 1) {
      endPage = Math.min(props.totalPages, startPage + maxVisibleButtons - 1);
    } else if (endPage === props.totalPages) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // เพิ่ม ... ถ้าจำเป็น
  if (startPage > 1) {
    if (startPage > 2) pages.unshift('...');
    pages.unshift(1);
  }
  if (endPage < props.totalPages) {
    if (endPage < props.totalPages - 1) pages.push('...');
    pages.push(props.totalPages);
  }

  return pages;
});
</script>

<style scoped>
/* No specific styles needed */
</style>