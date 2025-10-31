<template>
  <div class="p-2 sm:p-4 lg:p-6 w-full h-full">
    <div class="bg-white p-4 rounded-lg shadow-md mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-x-1 items-center mb-4">
        
        <h2 class="text-2xl font-bold col-span-1 md:col-start-1 md:col-span-1 text-center md:text-left min-w-0">
          Management Details
        </h2>

        <div class="inline-flex bg-gray-200 rounded-full p-0.5 space-x-1 flex-shrink-0 col-span-1 md:col-start-2 md:col-span-1 justify-center mx-auto min-w-0">
          <button
            v-for="tab in roleTabs"
            :key="tab.value"
            @click="activeRoleTab = tab.value"
            class="px-4 py-2 rounded-full text-sm font-semibold transition-colors min-w-0"
            :class="{
              'bg-[#526AA8] text-white shadow': activeRoleTab === tab.value, 
              'text-gray-600 hover:bg-gray-300': activeRoleTab !== tab.value
            }"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="flex space-x-2 flex-shrink-0 col-span-1 md:col-start-3 md:col-span-1 justify-center md:justify-end min-w-0">
          <button class="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors text-sm font-semibold min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          <button class="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors text-sm font-semibold min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <div v-if="loadingAccounts" class="text-center text-gray-500 py-8">Loading accounts...</div>
      <div v-else-if="errorAccounts" class="text-center text-red-500 py-8">Error loading accounts: {{ errorAccounts }}</div>
      <div v-else>
        <AccountsTable :accounts-data="allAccounts" /> <div v-if="allAccounts.length === 0" class="text-center text-gray-500 mt-4">No accounts found.</div>
      </div>

      <div class="mt-6 flex justify-center">
        <Pagination :current-page="currentPage" :total-pages="totalPages" @page-change="handlePageChange" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'; // เพิ่ม watch
import { useApi } from '~/composables/useApi';

const api = useApi();

// definePageMeta({ layout: 'admin-layout', middleware: ['auth-admin'] }); // เพิ่ม middleware
definePageMeta({ layout: 'admin-layout'}); 

useHead({ title: "Manage Accounts Admin" });

import AccountsTable from '../../components/admin/AccountsTable.vue'; 
import Pagination from '../../components/admin/Pagination.vue';     

const roleTabs = ref([
  { label: 'All', value: 'all' }, // เพิ่ม All tab เพื่อดึงผู้ใช้ทั้งหมด
  { label: 'Guest', value: 'guest' },
  { label: 'Employee', value: 'employee' }, // เปลี่ยนจาก User เป็น Employee (ตาม role ใน DB)
  { label: 'Admin', value: 'admin' },
]);
const activeRoleTab = ref('all'); // เริ่มต้นที่ 'all'

const allAccounts = ref([]); // จะเก็บข้อมูลที่ได้จาก Backend
const loadingAccounts = ref(true);
const errorAccounts = ref(null);

const currentPage = ref(1);
const totalPages = ref(1);

// ฟังก์ชันสำหรับดึงข้อมูล Accounts
const fetchAccounts = async (page = 1) => {
  loadingAccounts.value = true;
  errorAccounts.value = null;
  try {
    let url = `/users?page=${page}`; // Endpoint สำหรับดึง users ทั้งหมด
    if (activeRoleTab.value !== 'all') {
      url += `&role=${activeRoleTab.value}`; // เพิ่ม query parameter สำหรับ role
    }
    
    const response = await api(url);
    if (response) {
      allAccounts.value = response.map(user => ({ // Map data from Backend to fit AccountsTable props
        email: user.email,
        name: user.username, // Assuming username is name
        phone: user.phone || 'N/A',
        signUpAt: new Date(user.created_at).toLocaleDateString('th-TH'), // Assuming created_at
        role: user.role,
      }));
      // totalPages.value = response.totalPages; // ถ้า Backend ส่งมา
      // currentPage.value = response.currentPage; // ถ้า Backend ส่งมา
      console.log('Fetched accounts:', allAccounts.value);
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    errorAccounts.value = error.message;
  } finally {
    loadingAccounts.value = false;
  }
};

// Watch สำหรับ activeRoleTab ที่เปลี่ยนไป
watch(activeRoleTab, (newRole) => {
  currentPage.value = 1; // รีเซ็ตหน้าเมื่อเปลี่ยน Tab
  fetchAccounts(1);
});

// Handle pagination page change
const handlePageChange = (page) => {
  currentPage.value = page;
  fetchAccounts(page);
};

onMounted(() => {
  if (import.meta.client) {
    fetchAccounts();
  }
});

// ไม่ต้องใช้ filteredAccounts แล้ว ถ้า Backend กรองให้
// const filteredAccounts = computed(() => {
//   if (activeRoleTab.value === 'all') { 
//     return allAccounts.value;
//   }
//   return allAccounts.value.filter(account => account.role === activeRoleTab.value);
// });
</script>

<style scoped>
/* No specific styles needed */
</style>