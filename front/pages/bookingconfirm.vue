<template>
  <div class="bg-gray-100 min-h-screen p-4 flex flex-col items-center justify-center">
    <div class="relative w-full flex justify-center items-center mb-6 mt-8">
      <h1
        class="text-6xl sm:text-7xl md:text-[6rem] font-bold bg-clip-text text-transparent bg-gradient-to-b from-black/20 to-transparent absolute w-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-none tracking-widest"
      >
        SUCCESS
      </h1>
      <h1
        class="text-4xl sm:text-5xl md:text-[3rem] font-bold text-black relative z-10 text-center leading-none mt-4 sm:mt-0"
      >
        Booking Confirmed!
      </h1>
    </div>

    <div class="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
      <svg
        class="mx-auto h-24 w-24 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h2 class="text-2xl font-semibold text-gray-800 mt-4 mb-2">การจองของคุณได้รับการยืนยันแล้ว!</h2>
      <p class="text-gray-600 mb-4">รายละเอียดการจองของคุณ:</p>

      <div class="text-left space-y-2 mb-6">
        <p class="text-gray-700"><span class="font-medium">หัวข้อ:</span> {{ bookingDetails.topic }}</p>
        <p class="text-gray-700"><span class="font-medium">ห้อง:</span> {{ bookingDetails.roomName }}</p>
        <p class="text-gray-700"><span class="font-medium">วันที่:</span> {{ formatDateTime(bookingDetails.startTime, 'date') }}</p>
        <p class="text-gray-700"><span class="font-medium">เวลา:</span> {{ formatDateTime(bookingDetails.startTime, 'time') }} - {{ formatDateTime(bookingDetails.endTime, 'time') }}</p>
        <p class="text-gray-700"><span class="font-medium">ผู้จอง:</span> {{ bookingDetails.guestName }} ({{ bookingDetails.guestEmail }})</p>
        <p v-if="bookingDetails.guestPhone" class="text-gray-700"><span class="font-medium">เบอร์โทร:</span> {{ bookingDetails.guestPhone }}</p>
        <p v-if="bookingDetails.guestCompany" class="text-gray-700"><span class="font-medium">บริษัท:</span> {{ bookingDetails.guestCompany }}</p>
        <p v-if="bookingDetails.participantsEmails && bookingDetails.participantsEmails.length" class="text-gray-700"><span class="font-medium">ผู้เข้าร่วม:</span> {{ bookingDetails.participantsEmails.join(', ') }}</p>
        <p v-if="bookingDetails.requirements && bookingDetails.requirements.length" class="text-gray-700"><span class="font-medium">ข้อกำหนด:</span> {{ bookingDetails.requirements.join(', ') }}</p>
      </div>

      <NuxtLink to="/">
        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 shadow-md">
          กลับไปหน้าจอง
        </button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router'; // สำหรับดึง query parameters

const route = useRoute(); // เรียกใช้ useRoute

const bookingDetails = ref({
  topic: '',
  roomName: '',
  startTime: '',
  endTime: '',
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  guestCompany: '',
  participantsEmails: [],
  requirements: []
});

onMounted(() => {
  // ดึงข้อมูลจาก query parameters
  if (route.query) {
    bookingDetails.value = {
      topic: route.query.topic || 'ไม่ระบุหัวข้อ',
      roomName: route.query.roomName || 'ไม่ระบุห้อง',
      startTime: route.query.startTime || '',
      endTime: route.query.endTime || '',
      guestName: route.query.guestName || 'ไม่ระบุชื่อ',
      guestEmail: route.query.guestEmail || 'ไม่ระบุอีเมล',
      guestPhone: route.query.guestPhone || '',
      guestCompany: route.query.guestCompany || '',
      participantsEmails: route.query.participantsEmails ? JSON.parse(route.query.participantsEmails) : [],
      requirements: route.query.requirements ? JSON.parse(route.query.requirements) : []
    };
  }
});

// Helper function to format date and time
function formatDateTime(dateTimeString, type) {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  if (type === 'date') {
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  } else if (type === 'time') {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return '';
}
</script>

<style scoped>
/* Tailwind CSS classes are mostly used, but you can add custom styles here if needed */
</style>