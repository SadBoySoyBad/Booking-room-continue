<template>
  <div>
    <div class="p-2 sm:p-4 lg:p-6 w-full h-full">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
          <h3 class="text-lg font-bold mb-2">Total Reservation</h3>
          <p class="text-4xl font-extrabold text-gray-800">{{ analyticsData.totalReservations }}</p>
          <div v-if="loadingAnalytics" class="text-sm text-gray-500">Loading...</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
          <h3 class="text-lg font-bold mb-2">Total Attendance</h3>
          <p class="text-4xl font-extrabold text-gray-800">{{ analyticsData.totalAttendance }}</p>
          <div v-if="loadingAnalytics" class="text-sm text-gray-500">Loading...</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-md">
          <h3 class="text-lg font-bold mb-2 text-center">Leaderboard Reservation</h3>
          <div v-if="loadingAnalytics" class="text-center text-gray-500">Loading leaderboard...</div>
          <ul v-else-if="analyticsData.leaderboard.length > 0" class="space-y-2 text-gray-700">
            <li v-for="(item, index) in analyticsData.leaderboard" :key="index" class="flex justify-between items-center text-sm">
              <span class="flex items-center">
                <span :class="['w-2 h-2 rounded-full mr-2', getLeaderboardColor(index)]"></span> {{ item.company }}
              </span>
              <span class="font-semibold">{{ item.reservations }}</span>
            </li>
          </ul>
          <div v-else class="text-center text-gray-500 text-sm mt-2">No leaderboard data.</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div class="col-span-1 lg:col-span-2 bg-white p-4 rounded-lg shadow-md flex flex-col">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-lg font-bold text-center">Attendance and Reservation</h3>
            <div class="flex items-center space-x-4 text-sm text-gray-700">
              <span class="flex items-center">
                <span class="w-2 h-2 rounded-full bg-[#798ECE] mr-1"></span> Reservation
              </span>
              <span class="flex items-center">
                <span class="w-2 h-2 rounded-full bg-[#93B689] mr-1"></span> Attendance
              </span>
            </div>
          </div>
          <div v-if="loadingAnalytics" class="text-center text-gray-500 mt-2">Loading graph...</div>
          <MonthlyAttendanceGraph v-else :data="analyticsData.monthlyBookings" />
        </div>

        <div class="col-span-1 lg:col-span-1 grid grid-cols-1 gap-4">
          <div class="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
            <TotalEventsChart 
              :total-events="analyticsData.totalReservations"
              :events-by-role="analyticsData.eventsByRole"
              :loading="loadingAnalytics"
            />
          </div>
          <div class="bg-white p-4 rounded-lg shadow-md flex flex-col">
            <h3 class="text-lg font-bold mb-2 text-center">Donut Graph ของบริษัทต่างๆ ที่มาใช้บริการ</h3>
            <p class="text-sm text-gray-600 text-center">Lists / Percentage ของบริษัท</p>
            <div v-if="loadingAnalytics" class="text-center text-gray-500 flex-grow flex items-center justify-center">Loading...</div>
            <div v-else class="flex-grow flex items-center justify-center border border-dashed border-gray-300 rounded-lg mt-2 p-4">
                <p class="text-gray-500 text-sm">กราฟและรายการจะแสดงที่นี่ (ยังไม่มีข้อมูลหรือ component)</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';

const api = useApi();

// definePageMeta({
//   layout: 'admin-layout',
//   middleware: ['auth-admin'], // เพิ่ม middleware
// });

definePageMeta({ layout: 'admin-layout'}); 


useHead({
  title: "Analytics Admin",
});

// Import existing components that can be reused
import MonthlyAttendanceGraph from '../../components/dashboard/MonthlyAttendanceGraph.vue';
import TotalEventsChart from '../../components/dashboard/TotalEventsChart.vue';

const analyticsData = ref({
  totalReservations: '000',
  totalAttendance: '000',
  leaderboard: [],
  // เพิ่ม monthlyBookings และ eventsByRole ที่นี่
  monthlyBookings: [],
  eventsByRole: { guest: 0, employee: 0, admin: 0 },
});

const loadingAnalytics = ref(true);
const errorAnalytics = ref(null);

const fetchAnalyticsData = async () => {
  loadingAnalytics.value = true;
  errorAnalytics.value = null; // Reset error on new fetch
  try {
    // สมมติว่ามี Endpoint สำหรับดึงข้อมูล Analytics ทั้งหมด: /api/analytics/summary
    const response = await api('/analytics/summary'); 
    if (response) {
      analyticsData.value.totalReservations = response.totalReservations || 0; // ควรเป็น Number
      analyticsData.value.totalAttendance = response.totalAttendance || 0; // ควรเป็น Number
      analyticsData.value.leaderboard = response.leaderboard || [];
      // ตั้งค่าข้อมูลสำหรับกราฟด้วยถ้า Backend ส่งมา
      analyticsData.value.monthlyBookings = response.monthlyBookings || []; // อัปเดต monthlyBookings
      analyticsData.value.eventsByRole = response.eventsByRole || { guest: 0, employee: 0, admin: 0 }; // อัปเดต eventsByRole

      console.log('Fetched analytics data:', analyticsData.value);
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    errorAnalytics.value = error.message;
  } finally {
    loadingAnalytics.value = false;
  }
};

const getLeaderboardColor = (index) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
  return colors[index % colors.length]; // วนสี
};

onMounted(() => {
  if (import.meta.client) {
    fetchAnalyticsData();
  }
});
</script>

<style scoped>
/* No specific styles needed here, Tailwind CSS handles most responsiveness */
</style>