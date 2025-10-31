<template>
  <div v-if="isVisible" class="fixed inset-0 backdrop-blur-sm bg-gray-600/20 bg-opacity-50 flex justify-center items-center z-50" @click.self="closePopup">
    <div class="bg-white rounded-lg p-6 shadow-xl w-11/12 max-w-md">
      <div class="flex items-center justify-center mb-5 text-lg font-bold text-gray-800 relative">
        <hr class="flex-grow border-t-2 border-gray-300 mx-2">
        <span>Letter Box</span>
        <hr class="flex-grow border-t-2 border-gray-300 mx-2">
        <button class="absolute top-0 right-0 -mt-2 -mr-2 text-gray-500 hover:text-gray-700 focus:outline-none" @click="closePopup">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div v-if="loading" class="text-center text-gray-500 py-4">Loading notifications...</div>
      <div v-else-if="notifications.length === 0" class="text-center text-gray-500 py-4">No new notifications.</div>
      <ul v-else class="space-y-4">
        <li v-for="notification in notifications" :key="notification.id" class="flex items-start">
          <span class="w-2 h-2 bg-gray-600 rounded-full flex-shrink-0 mt-2 mr-3"/>
          <div class="flex-grow">
            <span :class="['font-medium', {'text-green-600': notification.status === 'approved', 'text-red-600': notification.status === 'canceled', 'text-blue-600': notification.status === 'upcoming'}]">
              {{ notification.message }}
            </span>
            <span class="block text-right text-sm text-gray-500 mt-1">{{ formatDate(notification.date) }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  isLoggedIn: { // เพิ่ม prop เพื่อรับสถานะการล็อกอิน
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close-letter-box']);

const notifications = ref([]);
const loading = ref(false);

// ฟังก์ชันสำหรับดึงข้อมูลการแจ้งเตือนจาก Backend
async function fetchNotifications() {
  if (!props.isLoggedIn) {
    notifications.value = [];
    return;
  }
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. User not logged in.');
    }

    const response = await fetch('/api/bookings/notifications', { // เรียก Endpoint ที่สร้างใหม่
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      notifications.value = data;
      console.log('Fetched notifications:', data);
    } else if (response.status === 401 || response.status === 403) {
      console.warn('Unauthorized to fetch notifications.');
      notifications.value = [];
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    notifications.value = [];
  } finally {
    loading.value = false;
  }
}

// Watch props.isVisible เพื่อดึงข้อมูลเมื่อ Popup เปิด
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    fetchNotifications();
  }
}, { immediate: true }); // เรียก fetch ทันทีเมื่อ component ถูก mount หาก isVisible เป็น true ตั้งแต่แรก

// Helper function สำหรับจัดรูปแบบวันที่
function formatDate(dateTimeString) {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

const closePopup = () => {
  emit('close-letter-box');
};
</script>

<style scoped>
/* TailwindCSS จัดการเรื่อง style ให้ส่วนใหญ่ */
/* ถ้ามี custom style ที่ Tailwind ทำไม่ได้ค่อยเพิ่มตรงนี้ */
</style>