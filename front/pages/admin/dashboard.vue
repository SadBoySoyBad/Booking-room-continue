<template>
  <div>
    <div class="p-2 sm:p-4 lg:p-6 w-full h-full">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

        <div class="col-span-1 lg:col-span-2 grid grid-cols-1 gap-4">
          
          <div class="bg-white p-4 rounded-lg shadow-md">
            <h3 class="text-lg font-bold mb-4 text-center">Meeting Status</h3>
            <div class="grid grid-cols-2 gap-4">
              <RoomStatusCard
                v-for="room in rooms" :key="room.id"
                :room-name="room.name"
                :status="room.display_status"
                :time="formatBookingTime(room.current_booking)"
                :topic="room.current_booking ? room.current_booking.topic : 'No current booking'"
                :user="room.current_booking ? `${room.current_booking.guest_name} (${room.current_booking.guest_company || 'N/A'})` : 'N/A'"
              />
              <div v-if="rooms.length === 0 && !loadingRooms" class="col-span-2 text-center text-gray-500">
                No rooms found.
              </div>
              <div v-if="loadingRooms" class="col-span-2 text-center text-gray-500">
                Loading room statuses...
              </div>
            </div>
          </div>

          <div class="bg-white p-4 rounded-lg shadow-md flex flex-col">
            <h3 class="text-lg font-bold mb-2 text-center">Monthly Attendance</h3>
            <div class="flex items-center justify-center space-x-2 text-sm text-gray-700 mb-2">
              <span class="font-bold">{{ analyticsData.totalAttendance || 0 }}</span>
              <span class="text-[#54694E] bg-[#E3F6DF] flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  N/A% </span>
            </div>
            <div v-if="loadingAnalytics" class="text-center text-gray-500 mt-2">Loading graph...</div>
            <MonthlyAttendanceGraph v-else :data="analyticsData.monthlyBookings" /> </div>
        </div>

        <div class="col-span-1 lg:col-span-1 grid grid-cols-1 gap-4">
          <div class="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
            <ClockWidget />
          </div>
          <div class="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
            <TotalEventsChart
              :total-events="analyticsData.totalReservations"
              :events-by-role="analyticsData.eventsByRole"
              :loading="loadingAnalytics"
            /> </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 class="text-lg font-bold mb-2 text-center">Recent Activities</h3>
        <RecentActivitiesTable :activity-log-data="activityLogData" />
        <div v-if="loadingActivities" class="text-center text-gray-500 mt-2">
          Loading recent activities...
        </div>
        <div v-if="activityLogData.length === 0 && !loadingActivities" class="text-center text-gray-500 mt-2">
          No recent activities.
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg shadow-md">
        <h3 class="text-lg font-bold mb-2 text-center">Statistic</h3>
        <StatisticTable :statistic-data="analyticsData.leaderboard" /> <div v-if="loadingAnalytics" class="text-center text-gray-500 mt-2">
          Loading statistics...
        </div>
        <div v-if="analyticsData.leaderboard.length === 0 && !loadingAnalytics" class="text-center text-gray-500 mt-2">
          No statistics available.
        </div>
      </div>
    </div>

    <AdminPopup
      :visible="showRequestsApprovalModal"
      title="Requests Approval (POP-UP)"
      confirm-button-text="Close"
      type="custom-content"
      :full-screen="true"
      @close="showRequestsApprovalModal = false"
      @submit="showRequestsApprovalModal = false"
    >
      <template v-if="showRequestsApprovalModal">
        <RequestsApprovalTable
          :requests-data="requestsApprovalData"
          :is-modal="true"
          @update-requests="handleUpdateRequests"
        />
        <div v-if="loadingRequests" class="text-center text-gray-500 mt-2">
          Loading pending requests...
        </div>
        <div v-if="requestsApprovalData.length === 0 && !loadingRequests" class="text-center text-gray-500 mt-2">
          No pending requests for approval.
        </div>
      </template>
    </AdminPopup>

    <AdminPopup
      :visible="showActivityLogModal"
      title="Activity Log (POP-UP)"
      confirm-button-text="Close"
      type="custom-content"
      :full-screen="true"
      @close="showActivityLogModal = false"
      @submit="showActivityLogModal = false"
    >
      <template v-if="showActivityLogModal">
        <ActivityLogTable
          :activity-log-data="activityLogData"
          :is-modal="true"
        />
      </template>
    </AdminPopup>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useApi } from '~/composables/useApi'; // Import useApi

const api = useApi(); // Initialize useApi

// definePageMeta({ layout: 'admin-layout', middleware: ['auth-admin'] }); // เพิ่ม middleware
definePageMeta({ layout: 'admin-layout'}); 


// Components ที่ใช้ในหน้านี้ - ตรวจสอบ path ให้ถูกต้อง: '../../' เพราะอยู่ลึก 2 ชั้น (pages/admin/dashboard.vue)
import RoomStatusCard from "../../components/dashboard/RoomStatusCard.vue"; 
import MonthlyAttendanceGraph from "../../components/dashboard/MonthlyAttendanceGraph.vue";
import ClockWidget from "../../components/dashboard/ClockWidget.vue";
import TotalEventsChart from "../../components/dashboard/TotalEventsChart.vue";
import RecentActivitiesTable from "../../components/dashboard/RecentActivitiesTable.vue";
import StatisticTable from "../../components/dashboard/StatisticTable.vue";

// Components ที่ใช้ใน modals
import RequestsApprovalTable from "../../components/dashboard/RequestsApprovalTable.vue";
import ActivityLogTable from "../../components/dashboard/ActivityLogTable.vue"; 

import AdminPopup from "~/components/AdminPopup.vue";

useHead({
  title: "Dashboard Admin",
});

// Reactive states for data from backend
const rooms = ref([]);
const requestsApprovalData = ref([]);
const activityLogData = ref([]);

// New analytics data state
const analyticsData = ref({
  totalReservations: 0, // Initialize as number, will be from Backend
  totalAttendance: 0, // Initialize as number, will be from Backend
  leaderboard: [], // From Backend
  monthlyBookings: [], // From Backend
  eventsByRole: { guest: 0, employee: 0, admin: 0 }, // From Backend
});


// Loading states
const loadingRooms = ref(true);
const loadingRequests = ref(true);
const loadingActivities = ref(true);
const loadingAnalytics = ref(true); // Renamed from loadingStatistics, covers all analytics data

// Modals visibility
const showRequestsApprovalModal = ref(false);
const showActivityLogModal = ref(false);

// --- Fetching Data from Backend ---

// Fetch room statuses
const fetchRoomStatuses = async () => {
  loadingRooms.value = true;
  try {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const response = await api(`/rooms?date=${today}`); // Assuming API endpoint for rooms with status by date
    if (response) {
      rooms.value = response;
      console.log('Fetched room statuses:', rooms.value);
    }
  } catch (error) {
    console.error('Error fetching room statuses:', error);
  } finally {
    loadingRooms.value = false;
  }
};

// Fetch pending booking requests for approval
const fetchPendingRequests = async () => {
  loadingRequests.value = true;
  try {
    // Assuming a backend endpoint for pending bookings
    const response = await api('/bookings?status=PENDING'); // Adjust endpoint as per your backend
    if (response) {
      requestsApprovalData.value = response.map(req => ({
        id: req.id,
        date: new Date(req.created_at).toLocaleDateString('th-TH'), // Adjust date format as needed
        name: req.guest_name,
        reqDate: new Date(req.start_time).toLocaleDateString('th-TH'),
        reqRoom: req.room_name,
        reqTime: `${new Date(req.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(req.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
        status: req.status.toLowerCase(),
      }));
      console.log('Fetched pending requests:', requestsApprovalData.value);
    }
  } catch (error) {
    console.error('Error fetching pending requests:', error);
  } finally {
    loadingRequests.value = false;
  }
};

// Fetch recent activities (e.g., all bookings, updates)
const fetchRecentActivities = async () => {
  loadingActivities.value = true;
  try {
    // This might be a general booking list or a dedicated activity log endpoint
    // For now, let's assume it's fetching all bookings for simplicity
    const response = await api('/bookings'); // Adjust this endpoint to your actual activity log API
    if (response) {
      // Map bookings to activity log format
      activityLogData.value = response.map(booking => ({
        time: new Date(booking.created_at).toLocaleTimeString('th-TH'),
        name: booking.guest_name,
        role: booking.user_id ? 'Employee' : 'Guest', // Differentiate based on user_id presence
        action: booking.status === 'APPROVED' ? 'Approved' : 'Reserved', // Simplified action type
        actionType: booking.status === 'APPROVED' ? 'approved' : 'reserved', // For styling/icon
        topic: booking.topic, // Add topic for better context in log
        room: booking.room_name // Add room name
      })).sort((a,b) => new Date(b.time) - new Date(a.time)); // Sort by time, newest first
      console.log('Fetched recent activities:', activityLogData.value);
    }
  } catch (error) {
    console.error('Error fetching recent activities:', error);
  } finally {
    loadingActivities.value = false;
  }
};

// Fetch all analytics data
const fetchAnalyticsData = async () => {
  loadingAnalytics.value = true;
  try {
    const response = await api('/analytics/summary'); // This is the new endpoint
    if (response) {
      analyticsData.value.totalReservations = response.totalReservations || 0;
      analyticsData.value.totalAttendance = response.totalAttendance || 0;
      analyticsData.value.leaderboard = response.leaderboard || [];
      analyticsData.value.monthlyBookings = response.monthlyBookings || [];
      analyticsData.value.eventsByRole = response.eventsByRole || { guest: 0, employee: 0, admin: 0 };
      console.log('Fetched analytics data:', analyticsData.value);
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    // errorAnalytics.value = error.message; // Removed as it causes display issue for chart
  } finally {
    loadingAnalytics.value = false;
  }
};


// --- Modal related functions ---
const openRequestsApprovalPopup = () => { showRequestsApprovalModal.value = true; };
const openActivityLogPopup = () => { showActivityLogModal.value = true; };

// Handle updates from RequestsApprovalTable (e.g., approve/reject)
const handleUpdateRequests = async ({ action, id }) => {
  console.log(`Action: ${action} for Request ID: ${id} received in DashboardAdmin`);
  try {
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const response = await api(`/bookings/${id}/status`, {
      method: 'PUT',
      body: { status: newStatus }
    });
    if (response.message) {
      console.log(response.message);
      // Re-fetch all relevant data after an update
      await fetchPendingRequests();
      await fetchRecentActivities(); 
      await fetchRoomStatuses();
      await fetchAnalyticsData(); // Re-fetch analytics data as counts might change
    }
  } catch (error) {
    console.error(`Error updating booking status for ID ${id}:`, error);
  }
};

// --- Helper Functions ---
const formatBookingTime = (booking) => {
  if (!booking) return "HH:MM - HH:MM";
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
};

// --- Lifecycle Hook ---
onMounted(async () => {
  if (import.meta.client) {
    console.log('Dashboard: onMounted - Client side detected.');
    await fetchRoomStatuses();
    console.log('Dashboard: fetchRoomStatuses called.');
    await fetchPendingRequests();
    console.log('Dashboard: fetchPendingRequests called.');
    await fetchRecentActivities();
    console.log('Dashboard: fetchRecentActivities called.');
    await fetchAnalyticsData(); // Call the new analytics data fetcher
    console.log('Dashboard: fetchAnalyticsData called.'); // Log the call
  }
});
</script>

<style scoped>
/* No custom styles needed, Tailwind CSS handles most responsiveness */
</style>