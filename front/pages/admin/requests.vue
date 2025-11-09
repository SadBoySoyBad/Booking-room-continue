<template>
  <div class="p-2 sm:p-4 lg:p-6 w-full h-full">
    <div class="bg-white p-4 rounded-lg shadow-md mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Requests Lists</h2>
        <div class="flex space-x-2">
          <button class="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors text-sm font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          <button class="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors text-sm font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <div v-if="loadingRequests" class="text-center text-gray-500 py-8">Loading requests...</div>
      <div v-else-if="errorRequests" class="text-center text-red-500 py-8">Error loading requests: {{ errorRequests }}</div>
      <div v-else>
        <RequestsTable :requests-data="requestsData" @update-request-status="handleUpdateRequestStatus" /> <div v-if="requestsData.length === 0" class="text-center text-gray-500 mt-4">No requests found.</div>
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
import { usePendingRequestsCount } from '~/composables/usePendingRequestsCount'; // <--- เพิ่มตรงนี้

const api = useApi();

// definePageMeta({ layout: 'admin-layout', middleware: ['auth-admin'] }); // เพิ่ม middleware
definePageMeta({ layout: 'admin-layout'}); 

useHead({ title: "Requests Admin" });

import RequestsTable from '../../components/admin/RequestsTable.vue'; 
import Pagination from '../../components/admin/Pagination.vue';     

const requestsData = ref([]);
const loadingRequests = ref(true);
const errorRequests = ref(null);

const currentPage = ref(1);
const totalPages = ref(1); // จะได้จาก Backend

// ดึงฟังก์ชัน fetchCount จาก composable เพื่ออัปเดตตัวเลข Badge
const { fetchCount: refetchPendingCount } = usePendingRequestsCount(); // <--- เพิ่มตรงนี้

const fetchRequests = async (page = 1) => {
  loadingRequests.value = true;
  errorRequests.value = null;
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await api(`/bookings/daily/${today}?page=${page}`);

    if (response) {
      requestsData.value = response.map(req => ({
        id: req.id,
        date: new Date(req.created_at).toLocaleDateString('th-TH'),
        name: req.guest_name,
        reqDate: new Date(req.start_time).toLocaleDateString('th-TH'),
        room: req.room_name,
        reqTime: `${new Date(req.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(req.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
        status: req.status.toLowerCase(),
      }));
      // totalPages.value = response.totalPages; // ถ้า Backend ส่งมา
      // currentPage.value = response.currentPage; // ถ้า Backend ส่งมา
      console.log('Fetched requests:', requestsData.value);
    }
  } catch (error) {
    console.error('Error fetching requests:', error);
    errorRequests.value = error.message;
  } finally {
    loadingRequests.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchRequests(page);
};

const handleUpdateRequestStatus = async ({ id, status }) => {
  try {
    const newStatus = status.toUpperCase();
    const response = await api(`/bookings/${id}/status`, {
      method: 'PUT',
      body: { status: newStatus }
    });
    if (response.message) {
      console.log(response.message);
      await fetchRequests(currentPage.value); // Re-fetch current page data
      refetchPendingCount(); // <--- เรียกอัปเดตตัวเลข Badge หลังจากอัปเดตสถานะ
    }
  } catch (error) {
    console.error(`Error updating booking status for ID ${id}:`, error);
  }
};

onMounted(async () => {
  if (import.meta.client) {
    await fetchRequests();
    refetchPendingCount(); // <--- เรียกอัปเดตตัวเลข Badge เมื่อหน้านี้ถูก Mount (จะรีเซ็ตหรือแสดงค่า 0 ถ้าไม่มีคำขอค้าง)
  }
});
</script>

<style scoped>
/* ... (โค้ด style เดิม) ... */
</style>