<!-- <template>
  <div class="p-2 sm:p-4 lg:p-6 w-full h-full">
    <div class="bg-white p-4 rounded-lg shadow-md mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Activity Log</h2>
        </div>

      <ActivityLogTable :activity-log-data="activityLogData" class="mt-4" />

      <div class="mt-6 flex justify-center">
        <Pagination :current-page="1" :total-pages="99" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

definePageMeta({ layout: 'admin-layout' });
useHead({ title: "Activities Admin" });

// Import existing components
// ตรวจสอบ path อีกครั้งว่าถูกต้องตามที่คุณมี: ../../components/dashboard/ หรือ ../../components/admin/
import ActivityLogTable from '../../components/dashboard/ActivityLogTable.vue'; 
import Pagination from '../../components/admin/Pagination.vue';     

// Mock data for the activity log table (คุณสามารถนำข้อมูลจริงมาแทนที่ได้)
const activityLogData = ref([
  { date: 'DD MM YYYY', time: 'HH:MM:SS', name: 'Name Surname', role: 'User', action: 'Log In', actionType: 'login' },
  { date: 'DD MM YYYY', time: 'HH:MM:SS', name: 'Name Surname', role: 'User', action: 'Reserved', actionType: 'reserved' },
  { date: 'DD MM YYYY', time: 'HH:MM:SS', name: 'Name Surname', role: 'User', action: 'Log Out', actionType: 'logout' },
  { date: 'DD MM YYYY', time: 'HH:MM:SS', name: 'Name Surname', role: 'Guest', action: 'Request', actionType: 'request' },
  { date: 'DD MM YYYY', time: 'HH:MM:SS', name: 'Name Surname', role: 'User', action: 'Canceled', actionType: 'canceled' }, // New actionType
  { date: 'DD MM YYYY', time: 'HH:MM:SS', name: 'Name Surname', role: 'User', action: 'Edited', actionType: 'edited' },
  { date: 'DD MM YYYY', time: 'HH:MM:SS', name: 'Name Surname', role: 'Admin', action: 'Approved', actionType: 'approved' },
  { date: 'DD MM YYYY', time: 'HH:MM:SS', name: 'Name Surname', role: 'Admin', action: 'Denied', actionType: 'denied' }, // New actionType
]);
</script>

<style scoped>
/* No specific styles needed */
</style> -->
<template>
  <div class="p-2 sm:p-4 lg:p-6 w-full h-full">
    <div class="bg-white p-4 rounded-lg shadow-md mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Activity Log</h2>
        </div>

      <div v-if="loadingActivities" class="text-center text-gray-500 py-8">Loading activities...</div>
      <div v-else-if="errorActivities" class="text-center text-red-500 py-8">Error loading activities: {{ errorActivities }}</div>
      <div v-else>
        <ActivityLogTable :activity-log-data="activityLogData" class="mt-4" />
        <div v-if="activityLogData.length === 0" class="text-center text-gray-500 mt-4">No activities found.</div>
      </div>

      <div class="mt-6 flex justify-center">
        <Pagination :current-page="currentPage" :total-pages="totalPages" @page-change="handlePageChange" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';

const api = useApi();

// definePageMeta({ layout: 'admin-layout', middleware: ['auth-admin'] }); // เพิ่ม middleware
definePageMeta({ layout: 'admin-layout'}); 

useHead({ title: "Activities Admin" });

import ActivityLogTable from '../../components/dashboard/ActivityLogTable.vue'; // ตรวจสอบ path อีกครั้ง
import Pagination from '../../components/admin/Pagination.vue';     

const activityLogData = ref([]);
const loadingActivities = ref(true);
const errorActivities = ref(null);

const currentPage = ref(1);
const totalPages = ref(1);

const fetchActivities = async (page = 1) => {
  loadingActivities.value = true;
  errorActivities.value = null;
  try {
    // สมมติว่ามี Endpoint สำหรับดึง Activity Log: /api/activities หรือ /api/bookings/log
    // ถ้ายังไม่มี Backend เฉพาะ อาจใช้ /bookings?page=... แล้วมา map เอง
    const response = await api(`/bookings?page=${page}`); // ใช้ /bookings เป็นตัวอย่าง
    if (response) {
      activityLogData.value = response.map(booking => ({
        date: new Date(booking.created_at).toLocaleDateString('th-TH'),
        time: new Date(booking.created_at).toLocaleTimeString('th-TH'),
        name: booking.guest_name, // หรือชื่อผู้ใช้จริงถ้าผูก user_id ได้
        role: booking.user_id ? 'Employee' : 'Guest',
        action: booking.status, // หรือ map เป็น Reserved, Approved, Canceled, etc.
        actionType: booking.status.toLowerCase(),
        topic: booking.topic,
        room: booking.room_name
      })).sort((a,b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)); // เรียงตามเวลาล่าสุด
      // totalPages.value = response.totalPages; // ถ้า Backend ส่งมา
      // currentPage.value = response.currentPage; // ถ้า Backend ส่งมา
      console.log('Fetched activities:', activityLogData.value);
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    errorActivities.value = error.message;
  } finally {
    loadingActivities.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchActivities(page);
};

onMounted(() => {
  if (import.meta.client) {
    fetchActivities();
  }
});
</script>

<style scoped>
/* No specific styles needed */
</style>