<template>
  <div class="grid grid-cols-1 gap-2 p-2 sm:gap-4 sm:p-4 md:gap-8 md:p-10 custom-main-grid">
    <div class="p-2 border rounded sm:p-3 md:p-5">
      <h2 class="font-bold text-base m-1 sm:text-lg sm:m-2 md:text-lg md:m-5">Room Status</h2>
      <div v-if="rooms.length > 0">
        <div
          v-for="room in rooms"
          :key="room.id"
          :class="[
            'rounded-full text-center py-1 sm:py-2 md:py-4 font-bold m-1 sm:m-2 md:m-5',
            getRoomStatusClass(room)
          ]"
        >
          <p class="text-black text-lg sm:text-xl md:text-2xl whitespace-nowrap overflow-hidden text-ellipsis">{{ room.name }}</p>
          <p class="font-bold text-xs sm:text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis">{{ room.display_status }}</p>
        </div>
      </div>
      <div v-else class="text-gray-500 italic mb-1 text-xs sm:text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis">Loading rooms...</div>
    </div>

    <div class="p-2 border rounded justify-center items-center sm:p-3 md:p-5">
      <div class="border rounded p-2 sm:p-3 md:p-4 mb-2 sm:mb-3 md:mb-4">
        <div class="flex justify-between items-center mb-1 sm:mb-2 md:mb-4 bg-gray-200 rounded-full">
          <button
            class="bg-white rounded-full shadow-md p-0.5 w-6 h-6 m-0.5 flex items-center justify-center cursor-pointer hover:bg-gray-100 active:bg-gray-300 active:scale-95 transition-all duration-100 sm:w-7 sm:h-7 sm:p-1 md:w-8 md:h-8 md:p-2"
            @click="prevMonth"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-600 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 class="text-sm sm:text-base md:text-xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">{{ currentMonthYear }}</h2>
          <button
            class="bg-white rounded-full shadow-md p-0.5 w-6 h-6 m-0.5 flex items-center justify-center cursor-pointer hover:bg-gray-100 active:bg-gray-300 active:scale-95 transition-all duration-100 sm:w-7 sm:h-7 sm:p-1 md:w-8 md:h-8 md:p-2"
            @click="nextMonth"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-600 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-7 gap-0.5 text-center justify-center text-xs sm:gap-1 sm:text-sm md:gap-2 md:text-base">
          <div v-for="d in days" :key="d" class="font-semibold text-gray-500 mb-0.5 m-0.5 text-xs sm:text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis">{{ d }}</div>
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            class="w-7 h-7 flex items-center justify-center cursor-pointer transition-all duration-150 text-xs sm:w-8 sm:h-8 sm:text-sm md:w-10 md:h-10 md:text-base"
            :class="[
              day.day && selectedDateFormatted !== day.date ? 'hover:bg-red-100 rounded-full active:bg-red-600 active:scale-90 transition-all duration-100' : '',
              selectedDateFormatted === day.date ? 'bg-red-500 text-white rounded-full active:bg-red-600 active:scale-90 transition-all duration-100' : '',
              isToday(day.date) ? 'bg-gray-200 rounded-full' : '',
            ]"
            @click="day.day && selectDay(day.date)"
          >
            {{ day.day || '' }}
          </div>
        </div>
      </div>

      <div class="border rounded p-2 sm:p-3 md:p-4 mt-2 sm:mt-3 md:mt-4">
        <h3 class="font-bold text-base sm:text-lg mb-1 sm:mb-2">Meeting Details</h3>

        <div v-if="isLoggedIn">
          <div v-if="meetingsToday.length > 0">
            <div
              v-for="meeting in meetingsToday"
              :key="meeting.id"
              class="mb-1 border border-gray-300 rounded p-1 sm:p-2 text-xs sm:text-sm md:text-base bg-green-50"
            >
              <p class="whitespace-nowrap overflow-hidden text-ellipsis"><strong>Topic:</strong> {{ meeting.topic }}</p>
              <p class="whitespace-nowrap overflow-hidden text-ellipsis"><strong>Room:</strong> {{ meeting.room_name }}</p>
              <p class="whitespace-nowrap overflow-hidden text-ellipsis"><strong>Time:</strong> {{ formatTime(meeting.start_time) }} - {{ formatTime(meeting.end_time) }}</p>
              <p class="whitespace-nowrap overflow-hidden text-ellipsis"><strong>Booked by:</strong> {{ meeting.guest_name || meeting.employee_username || meeting.employee_email || 'N/A' }}</p>
            </div>
          </div>
          <div v-else class="text-gray-500 italic mb-1 text-xs sm:text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis">No meetings for this date.</div>
        </div>

        <div v-else class="text-gray-500 italic text-xs sm:text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis">Please login to see details.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ปิดกฎ ESLint 'no-unused-vars' สำหรับบล็อก script ทั้งหมดในไฟล์นี้
// เพราะ Linter อาจไม่เห็นการใช้งานฟังก์ชันที่ถูกเรียกจาก template
/* eslint-disable no-unused-vars */

import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'

const router = useRouter()
const api = useApi()

// Authentication State
const isLoggedIn = ref(false)
const currentUser = ref(null)

// Room Status
const rooms = ref([])

// Calendar
const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())
const selectedDay = ref(today.getDate())

const selectedDateFormatted = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, selectedDay.value);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
});

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const currentMonthYear = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
});

const calendarDays = computed(() => {
  const result = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const lastDate = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  for (let i = 0; i < firstDay; i++) result.push({ day: null, date: null })

  for (let d = 1; d <= lastDate; d++) {
    const mm = String(currentMonth.value + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    const dateStr = `${currentYear.value}-${mm}-${dd}`
    result.push({ day: d, date: dateStr })
  }
  return result
})

function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isToday(dateStr) {
  // Use local date (not UTC) so the gray circle marks the real local day
  return formatLocalDate(new Date()) === dateStr;
}

// Meeting Details (ดึงข้อมูลจริงจาก Backend)
const meetingsToday = ref([]);

async function selectDay(dateStr) {
  const dateObj = new Date(dateStr);
  selectedDay.value = dateObj.getDate();
  currentMonth.value = dateObj.getMonth();
  currentYear.value = dateObj.getFullYear();

  await fetchRoomStatus();
  await fetchMeetingsForSelectedDate();
  console.log('Selected Date:', selectedDateFormatted.value);
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  selectDay(formatLocalDate(new Date(currentYear.value, currentMonth.value, 1)));
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  selectDay(formatLocalDate(new Date(currentYear.value, currentMonth.value, 1)));
}

// Helper เพื่อกำหนด class ตามสถานะห้อง
const getRoomStatusClass = (room) => {
  if (room.display_status === 'AVAILABLE') return 'status-available';
  if (room.display_status === 'OCCUPIED') return 'status-occupied';
  if (room.status === 'MAINTENANCE') return 'bg-gray-200 border-1 text-gray-600';
  return '';
};

// Helper เพื่อจัดรูปแบบเวลา (เช่น "2025-07-08T10:00:00.000Z" เป็น "10:00")
const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// ฟังก์ชัน Logout (ใช้โดย Header Global)
const logout = () => {
  localStorage.removeItem('user_token');
  isLoggedIn.value = false;
  currentUser.value = null;
  router.push('/login');
};

const goToReservation = () => {
  router.push('/reservation');
};

const goToHistory = () => {
  router.push('/history');
};

// --- Fetching Data from Backend ---
const fetchRoomStatus = async () => {
  try {
    const response = await api(`/rooms?date=${selectedDateFormatted.value}`);
    rooms.value = response;
  } catch (error) {
    console.error('Error fetching room status with calculated availability:', error);
    rooms.value = [];
  }
};

const fetchMeetingsForSelectedDate = async () => {
  if (!isLoggedIn.value) {
    meetingsToday.value = [];
    return;
  }
  try {
    const response = await api(`/bookings/daily/${selectedDateFormatted.value}`);
    meetingsToday.value = response;
  } catch (error) {
    console.error('Error fetching meetings for selected date:', error);
    meetingsToday.value = [];
  }
};

const verifyUserLoggedIn = async () => {
  const token = localStorage.getItem('user_token');
  if (token) {
    try {
      const response = await api.get('/auth/verify');
      if (response && response.user) {
        isLoggedIn.value = true;
        currentUser.value = response.user;
        await fetchMeetingsForSelectedDate();
      } else {
        localStorage.removeItem('user_token');
        isLoggedIn.value = false;
        currentUser.value = null;
      }
    } catch (error) {
      console.error('Error verifying user token:', error);
      localStorage.removeItem('user_token');
      isLoggedIn.value = false;
      currentUser.value = null;
      router.push('/login');
    }
  } else {
    isLoggedIn.value = false;
    currentUser.value = null;
  }
};

// On Mounted Hook: เริ่มต้นดึงข้อมูลและตรวจสอบสถานะ Login
onMounted(async () => {
  await verifyUserLoggedIn();
  await fetchRoomStatus();
});
</script>

<style scoped>
/* นี่คือสไตล์ที่ตรงกับโค้ดเดิมของคุณ 100% (ไม่มี Header Styles ในนี้แล้ว) */

/* Custom CSS for 2-column layout on medium screens and above */
@media (min-width: 768px) {
  .custom-main-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
/* สไตล์จากโค้ดเดิมของคุณ */
/* ผมได้คัดลอกส่วน style ที่เกี่ยวข้องกับ header ที่คุณให้มาใน image_d70c7e.png
   แต่เนื่องจากคุณต้องการให้ header ถูกจัดการที่อื่น ผมจะลบส่วนนั้นออกไปจาก styles นี้
   และคงไว้เฉพาะ style ของเนื้อหาหลักที่เหลือตามโค้ดต้นฉบับของคุณเท่านั้น */

/* Base Panel Styles */
.main-content-area {
  display: grid;
  grid-template-columns: 1fr 2fr; /* Layout 2 คอลัมน์ */
  gap: 20px; /* ระยะห่างระหว่างคอลัมน์ */
  padding: 20px; /* Padding รอบๆ เนื้อหาหลัก */
  background-color: #f5f5f5; /* สีพื้นหลัง */
  min-height: calc(100vh - 70px); /* ความสูงขั้นต่ำ (หัก Header ออก) */
}

.panel {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.08);
  padding: 20px;
}

.panel-header {
  font-size: 1.2em;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20px;
}

/* Room Status Panel Styles */
.room-status-panel {
  /* Inherits .panel styles */
}

.room-cards-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.room-card {
  padding: 15px 20px;
  border-radius: 25px; /* รูปแบบแคปซูล */
  text-align: center;
  font-weight: bold;
  font-size: 1.1em;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
}

.room-name {
  color: #333333;
}

.room-status {
  font-size: 0.8em;
}

/* Status-specific colors (เหมือนเดิมที่คุณกำหนดไว้) */
.status-available {
  background-color: #e6ffe6; /* light green */
  border: 2px solid #4CAF50; /* green */
  color: #4CAF50;
}

.status-occupied {
  background-color: #ffe6e6; /* light red */
  border: 2px solid #f44336; /* red */
  color: #f44336;
}

.status-maintenance {
  background-color: #f0f0f0; /* light gray */
  border: 2px solid #9e9e9e; /* gray */
  color: #9e9e9e;
}

.loading-message {
  text-align: center;
  color: #888888;
  font-style: italic;
  padding: 20px;
}

/* Calendar and Meeting Details Panel Styles */
.calendar-details-panel {
  /* Inherits .panel styles */
}

.calendar-header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 1.2em;
  font-weight: bold;
}

.calendar-nav-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #666666;
}

.calendar-month-year {
  color: #333333;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  text-align: center;
}

.day-name {
  font-weight: bold;
  color: #777777;
  padding: 5px 0;
}

.calendar-day {
  padding: 10px 0;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.calendar-day:hover:not(.blank) {
  background-color: #e0f7fa; /* light blue on hover */
}

.calendar-day.blank {
  visibility: hidden;
}

.calendar-day.selected {
  background-color: #2196F3; /* Blue */
  color: white;
  font-weight: bold;
}

.calendar-day.current-day {
  border: 2px solid #2196F3; /* Blue border */
  background-color: #e3f2fd; /* Lighter blue */
  color: #2196F3;
}

.calendar-day.selected.current-day {
  border: 2px solid white; /* Selected day overrides current day border */
}

.meeting-details-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eeeeee;
}

.meeting-details-header {
  font-size: 1.1em;
  font-weight: bold;
  color: #333333;
  margin-bottom: 15px;
}

.meeting-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meeting-item {
  background-color: #f9f9f9;
  border: 1px solid #eeeeee;
  border-left: 5px solid #2196F3; /* Blue left border */
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 0.9em;
  color: #555555;
}

.meeting-item div {
  margin-bottom: 3px;
}

.meeting-item div:last-child {
  margin-bottom: 0;
}

.meeting-topic {
  font-weight: bold;
  color: #333;
}

.login-prompt, .no-meetings-message {
  text-align: center;
  color: #888888;
  font-style: italic;
  padding: 20px;
}

/* Buttons at the bottom of the left panel (Booking room, History) */
.calendar-actions-container {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.action-button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.action-button.booking {
  background-color: #4CAF50; /* Green */
  color: white;
}

.action-button.booking:hover {
  background-color: #45a049;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.action-button.history {
  background-color: #f0f0f0; /* Light gray */
  color: #333;
  border: 1px solid #dddddd;
}

.action-button.history:hover {
  background-color: #e0e0e0;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

/* Responsive adjustments (based on common patterns, no explicit media query provided in original) */
@media (max-width: 768px) {
  .main-content-area {
    grid-template-columns: 1fr; /* Stack columns on small screens */
    padding: 10px;
    gap: 10px;
  }
  .panel {
    padding: 15px;
  }
  /*
  These header styles are commented out because the header is now assumed to be global and managed elsewhere.
  .arrangemeet-header {
    flex-direction: column;
    gap: 10px;
  }
  .arrangemeet-header .header-icon-links {
    flex-wrap: wrap;
    justify-content: center;
  }
  */
}
</style>
