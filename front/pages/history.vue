<!-- <template>
  <div class="bg-gray-100 min-h-screen p-4 flex flex-col items-center">
    <div class="relative w-full flex justify-center items-center mb-6 mt-8">
      <h1
        class="text-6xl sm:text-7xl md:text-[6rem] font-bold bg-clip-text text-transparent bg-gradient-to-b from-black/20 to-transparent absolute w-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-none tracking-widest"
      >
        MANAGE
      </h1>
      <h1
        class="text-4xl sm:text-5xl md:text-[3rem] font-bold text-black relative z-10 text-center leading-none mt-4 sm:mt-0"
      >
        My Booking History
      </h1>
    </div>

    <div class="w-full max-w-4xl bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8">
      <div v-if="loading" class="text-center text-gray-500 py-8">
        <p>Loading booking history...</p>
      </div>
      <div v-else-if="!isLoggedIn" class="text-center text-gray-600 py-8">
        <p>กรุณาเข้าสู่ระบบเพื่อดูประวัติการจองของคุณ</p>
        <NuxtLink to="/">
          <button class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-150">
            กลับไปหน้าแรก
          </button>
        </NuxtLink>
      </div>
      <div v-else-if="bookings.length === 0" class="text-center text-gray-600 py-8">
        <p>ไม่พบประวัติการจองของคุณ</p>
      </div>
      <div v-else>
        <h2 class="text-xl font-bold mb-4">ประวัติการจองของฉัน</h2>
        <div class="space-y-4">
          <div
            v-for="booking in bookings"
            :key="booking.id"
            class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
              <h3 class="text-lg font-semibold text-gray-800">{{ booking.topic || 'Untitled Meeting' }}</h3>
              <span class="text-sm text-gray-500">{{ formatDateTime(booking.start_time) }} - {{ formatTime(booking.end_time) }}</span>
            </div>
            <p class="text-gray-700 mb-1">
              <span class="font-medium">ห้อง:</span> {{ booking.room_name || `Room ID: ${booking.room_id}` }}
            </p>
            <p class="text-gray-700 mb-1">
              <span class="font-medium">ผู้จอง:</span> {{ booking.guest_name }} ({{ booking.guest_email }})
            </p>
            <p v-if="booking.guest_phone" class="text-gray-700 mb-1">
              <span class="font-medium">เบอร์โทร:</span> {{ booking.guest_phone }}
            </p>
            <p v-if="booking.guest_company" class="text-gray-700 mb-1">
              <span class="font-medium">บริษัท:</span> {{ booking.guest_company }}
            </p>
            <p v-if="booking.participants_emails && booking.participants_emails.length" class="text-gray-700 mb-1">
              <span class="font-medium">ผู้เข้าร่วม:</span> {{ booking.participants_emails.join(', ') }}
            </p>
            <p v-if="booking.requirements && booking.requirements.length" class="text-gray-700">
              <span class="font-medium">ข้อกำหนด:</span> {{ booking.requirements.join(', ') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink to="/">
      <button class="mt-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-full transition-all duration-150">
        กลับไปหน้า Booking
      </button>
    </NuxtLink>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// ref สำหรับเก็บข้อมูล
const bookings = ref([]);
const loading = ref(true);
const currentUser = ref(null); // เก็บข้อมูลผู้ใช้ที่ตรวจสอบแล้ว
const isLoggedIn = ref(false);

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้จาก Token
async function fetchUserFromToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    isLoggedIn.value = false;
    currentUser.value = null;
    return; // ถ้าไม่มี token จะหยุดการทำงาน
  }

  try {
    const response = await const config = useRuntimeConfig()\n    fetch(${config.public.apiBaseURL}/auth/verify', { // Endpoint สำหรับตรวจสอบ token
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}` // ส่ง token ไปกับ request
      }
    });

    if (response.ok) {
      const data = await response.json();
      currentUser.value = data.user; // ตั้งค่าข้อมูลผู้ใช้
      isLoggedIn.value = true;
      console.log('User verified in history page:', currentUser.value);
    } else {
      console.error('Token verification failed in history page:', response.statusText);
      localStorage.removeItem('token'); // ลบ token ที่ไม่ถูกต้อง
      isLoggedIn.value = false;
      currentUser.value = null;
    }
  } catch (error) {
    console.error('Error fetching user from token in history page:', error);
    localStorage.removeItem('token');
    isLoggedIn.value = false;
    currentUser.value = null;
  }
}

// ฟังก์ชันสำหรับดึงประวัติการจองของผู้ใช้ที่เข้าสู่ระบบ
async function fetchMyBookings() {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // ผู้ใช้ไม่ได้ล็อกอิน ไม่ต้องดึงข้อมูล
      isLoggedIn.value = false;
      loading.value = false;
      return;
    }

    // เรียก Endpoint ที่เราสร้างใหม่สำหรับดึงประวัติการจองของผู้ใช้ที่เข้าสู่ระบบ
    // URL: /api/bookings/my-history
    const response = await fetch('/api/bookings/my-history', {
      headers: {
        'Authorization': `Bearer ${token}` // ส่ง token ไปกับ request
      }
    });

    if (response.ok) {
      const data = await response.json();
      bookings.value = data;
      console.log('My booking history:', data);
    } else if (response.status === 401 || response.status === 403) {
      // ถ้าไม่ได้รับอนุญาต (Unauthorized/Forbidden)
      console.warn('Unauthorized to view booking history. User might not be logged in or lack permissions.');
      bookings.value = [];
      isLoggedIn.value = false; // ตั้งค่าเป็น false หากไม่ได้รับอนุญาต
      localStorage.removeItem('token'); // ลบ token ที่อาจหมดอายุ/ไม่ถูกต้อง
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    bookings.value = [];
  } finally {
    loading.value = false; // ไม่ว่าจะสำเร็จหรือล้มเหลว ให้หยุดสถานะ loading
  }
}

// Helper function สำหรับจัดรูปแบบวันที่และเวลา (ตัวอย่าง: 11 กรกฎาคม 2568, 14:30)
function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('th-TH', { // ใช้ locale 'th-TH' สำหรับภาษาไทย
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // ใช้รูปแบบ 24 ชั่วโมง
  });
}

// Helper function สำหรับจัดรูปแบบเวลาเท่านั้น (ตัวอย่าง: 14:30)
function formatTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('th-TH', { // ใช้ locale 'th-TH' สำหรับภาษาไทย
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // ใช้รูปแบบ 24 ชั่วโมง
  });
}

onMounted(async () => {
  if (import.meta.client) { // ตรวจสอบว่ารันฝั่ง client
    await fetchUserFromToken(); // ดึงข้อมูลผู้ใช้ก่อน
    await fetchMyBookings(); // แล้วค่อยดึงประวัติการจอง
  }
});
</script>

<style scoped>
/* Tailwind CSS classes are mostly used, but you can add custom styles here if needed */
</style> -->

<template>
  <div class="bg-gray-100 min-h-screen p-4 flex flex-col items-center">
    <div class="relative w-full flex justify-center items-center mb-6 mt-8">
      <h1
        class="text-6xl sm:text-7xl md:text-[6rem] font-bold bg-clip-text text-transparent bg-gradient-to-b from-black/20 to-transparent absolute w-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-none tracking-widest"
      >
        MANAGE
      </h1>
      <h1
        class="text-4xl sm:text-5xl md:text-[3rem] font-bold text-black relative z-10 text-center leading-none mt-4 sm:mt-0"
      >
        My Booking History
      </h1>
    </div>

    <div class="w-full max-w-4xl bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8">
      <div v-if="loading" class="text-center text-gray-500 py-8">
        <p>Loading booking history...</p>
      </div>
      <div v-else-if="!isLoggedIn" class="text-center text-gray-600 py-8">
        <p>กรุณาเข้าสู่ระบบเพื่อดูประวัติการจองของคุณ</p>
        <NuxtLink to="/">
          <button class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-150">
            กลับไปหน้าแรก
          </button>
        </NuxtLink>
      </div>
      <div v-else-if="bookings.length === 0" class="text-center text-gray-600 py-8">
        <p>ไม่พบประวัติการจองของคุณ</p>
      </div>
      <div v-else>
        <h2 class="text-xl font-bold mb-4">ประวัติการจองของฉัน</h2>
        <div class="space-y-4">
          <div
            v-for="booking in bookings"
            :key="booking.id"
            class="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
              <h3 class="text-lg font-semibold text-gray-800">{{ booking.topic || 'Untitled Meeting' }}</h3>
              <span class="text-sm text-gray-500">{{ formatDateTime(booking.start_time) }} - {{ formatTime(booking.end_time) }}</span>
            </div>
            <p class="text-gray-700 mb-1">
              <span class="font-medium">ห้อง:</span> {{ booking.room_name || `Room ID: ${booking.room_id}` }}
            </p>
            <p class="text-gray-700 mb-1">
              <span class="font-medium">ผู้จอง:</span> {{ booking.guest_name }} ({{ booking.guest_email }})
            </p>
            <p v-if="booking.guest_phone" class="text-gray-700 mb-1">
              <span class="font-medium">เบอร์โทร:</span> {{ booking.guest_phone }}
            </p>
            <p v-if="booking.guest_company" class="text-gray-700 mb-1">
              <span class="font-medium">บริษัท:</span> {{ booking.guest_company }}
            </p>
            <p v-if="booking.participants_emails && booking.participants_emails.length" class="text-gray-700 mb-1">
              <span class="font-medium">ผู้เข้าร่วม:</span> {{ booking.participants_emails.join(', ') }}
            </p>
            <p v-if="booking.requirements && booking.requirements.length" class="text-gray-700">
              <span class="font-medium">ข้อกำหนด:</span> {{ booking.requirements.join(', ') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi'; // Import useApi

const api = useApi(); // Use the composable

// ref สำหรับเก็บข้อมูล
const bookings = ref([]);
const loading = ref(true);
const currentUser = ref(null);
const isLoggedIn = ref(false);

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้จาก Token
async function fetchUserFromToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    isLoggedIn.value = false;
    currentUser.value = null;
    return;
  }

  try {
    const response = await api('/auth/verify', { method: 'GET' }); // Use api()
    if (response.user) {
      currentUser.value = response.user;
      isLoggedIn.value = true;
      console.log('User verified in history page:', currentUser.value);
    } else {
      console.error('Token verification failed in history page:', response.statusText);
      localStorage.removeItem('token');
      isLoggedIn.value = false;
      currentUser.value = null;
    }
  } catch (error) {
    console.error('Error fetching user from token in history page:', error);
    localStorage.removeItem('token');
    isLoggedIn.value = false;
    currentUser.value = null;
  }
}

// ฟังก์ชันสำหรับดึงประวัติการจองของผู้ใช้ที่เข้าสู่ระบบ
async function fetchMyBookings() {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      isLoggedIn.value = false;
      loading.value = false;
      return;
    }

    // Use api() for the correct URL and authorization
    const response = await api('/bookings/my-history');

    if (response) {
      bookings.value = response;
      console.log('My booking history:', response);
    } else if (response.status === 401 || response.status === 403) {
      console.warn('Unauthorized to view booking history. User might not be logged in or lack permissions.');
      bookings.value = [];
      isLoggedIn.value = false;
      localStorage.removeItem('token');
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    bookings.value = [];
  } finally {
    loading.value = false;
  }
}

// Helper function สำหรับจัดรูปแบบวันที่และเวลา (ตัวอย่าง: 11 กรกฎาคม 2568, 14:30)
function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Helper function สำหรับจัดรูปแบบเวลาเท่านั้น (ตัวอย่าง: 14:30)
function formatTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

onMounted(async () => {
  if (import.meta.client) {
    console.log('--- onMounted start ---');
    await fetchUserFromToken();
    console.log('After fetchUserFromToken - isLoggedIn:', isLoggedIn.value);
    console.log('After fetchUserFromToken - currentUser:', currentUser.value);

    if (isLoggedIn.value) {
      console.log('isLoggedIn is TRUE, calling fetchMyBookings...');
      await fetchMyBookings();
      console.log('fetchMyBookings call finished.');
    } else {
      console.log('isLoggedIn is FALSE, NOT calling fetchMyBookings.');
    }
    console.log('--- onMounted end ---');
  }
  
});

definePageMeta({
  middleware: ['auth']
});


</script>

<style scoped>
/* Tailwind CSS classes are mostly used, but you can add custom styles here if needed */
</style>