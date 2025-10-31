<template>
  <div class="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 grid grid-cols-1 gap-4 sm:gap-6 custom-grid-layout">
    <div
      class="col-span-1 border border-gray-300 rounded-xl p-3 sm:p-4 bg-white shadow h-auto sm:min-h-[calc(100vh-100px)] sm:overflow-y-auto">
      <div class="flex justify-between items-center mb-3 sm:mb-4 bg-gray-200 rounded-full">
        <button
          class="bg-white rounded-full shadow-md p-1 w-6 h-6 sm:w-8 sm:h-8 m-1 flex items-center justify-center cursor-pointer hover:bg-gray-100 active:bg-gray-300 active:scale-95 transition-all duration-100"
          @click="prevMonth">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 class="text-base sm:text-xl font-bold">{{ months[month] }} {{ year }}</h2>

        <button
          class="bg-white rounded-full shadow-md p-1 w-6 h-6 sm:w-8 sm:h-8 m-1 flex items-center justify-center cursor-pointer hover:bg-gray-100 active:bg-gray-300 active:scale-95 transition-all duration-100"
          @click="nextMonth">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-7 gap-0.5 sm:gap-1 text-center justify-center">
        <div v-for="d in days" :key="d"
          class="font-semibold text-gray-500 mb-1 sm:mb-2 m-0.5 text-xs sm:text-base flex justify-center items-center h-6 sm:h-8 w-8 sm:w-10">
          {{ d }}</div>
        <div v-for="(day, idx) in calendarDays" :key="idx"
          class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer transition-all duration-150 text-xs sm:text-base"
          :class="[
            day.day && selectedDate !== day.date ? 'hover:bg-red-100 rounded-full active:bg-red-600 active:scale-90 transition-all duration-100' : '',
            selectedDate === day.date ? 'bg-red-500 text-white rounded-full active:bg-red-600 active:scale-90 transition-all duration-100' : '',
            isToday(day.date) && day.day && selectedDate !== day.date ? 'bg-gray-200 rounded-full' : '', // Apply gray background for today only if not selected and valid day
          ]" @click="day.day && selectDate(day.date)">
          {{ day.day || '' }}
        </div>
      </div>
      <div class="p-2 sm:p-3 flex flex-wrap justify-center items-center mt-3 sm:mt-4 gap-x-2">
        <button
          class="bg-blue-500 hover:bg-blue-700 hover:shadow-lg text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-full active:bg-blue-600 active:scale-95 transition-all duration-100 cursor-pointer text-sm sm:text-base"
          @click="openModal">Booking room</button>

        <NuxtLink to="/history">
          <button
            class="bg-gray-300 hover:bg-gray-400 hover:shadow-lg text-gray-700 font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-full active:bg-gray-500 active:scale-95 transition-all duration-100 cursor-pointer text-sm sm:text-base">
            History
          </button>
        </NuxtLink>
      </div>

      <div class="mt-4 sm:mt-6">
        <h3 class="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Booking details</h3>
        <ul>
          <li v-for="meeting in meetingsOnSelectedDate" :key="meeting.id"
            class="text-xs sm:text-sm border-b py-1.5 sm:py-2">
            <div>
              <span class="font-semibold">{{ formatTimeRange(meeting.start_time, meeting.end_time) }}</span>
              <span> - </span>
              <span>
                {{
                  meeting.guest_name ?
                    meeting.topic + ' @ Room ' + (meeting.room_name || meeting.room_id) :
                    'Room ' + (meeting.room_name || meeting.room_id) + ' - Reserved'
                }}
              </span>
            </div>
          </li>
          <li v-if="meetingsOnSelectedDate.length === 0" class="text-center text-gray-500 text-xs sm:text-sm py-2">No
            bookings for this date.</li>
        </ul>
      </div>
    </div>
    <div
      class="col-span-1 custom-col-span-2-layout border border-gray-300 rounded-xl p-3 sm:p-6 bg-white shadow h-auto max-h-[calc(100vh-160px)] overflow-y-auto sm:min-h-[calc(100vh-100px)]">
      <h2 class="text-base sm:text-xl font-bold mb-3 sm:mb-4">Meetings on {{ selectedDate }}</h2>
      <div class="relative h-full border-l border-gray-300">
        <div v-for="h in 9" :key="h"
          class="h-10 sm:h-12 flex items-center text-xs sm:text-sm text-gray-500 pl-2 sm:pl-4 border-b border-gray-200 meeting-timeline-hourly-line">
          <span class="w-12 sm:w-16 inline-block text-right pr-2 sm:pr-4">{{ (h + 9).toString().padStart(2, '0')
            }}:00</span>
        </div>

        <div v-for="meeting in meetingsOnSelectedDate" :key="meeting.id"
          class="absolute left-14 sm:left-20 right-2 sm:right-4 text-xs rounded px-1.5 py-0.5 sm:px-2 sm:py-1 shadow-md transition-transform duration-150"
          :class="isUserRelated(meeting) ? 'bg-blue-500 text-white hover:scale-[1.01]' : 'bg-gray-200 text-gray-600'"
          :style="getMeetingStyle(meeting.start_time, meeting.end_time)">
          <div class="font-bold text-xs sm:text-sm">
            {{
              isUserRelated(meeting)
                ? meeting.topic
                : 'Room ' + (meeting.room_name || meeting.room_id)
            }}
          </div>
          <div class="text-xxs sm:text-xs">
            {{
              formatTimeRange(meeting.start_time, meeting.end_time)
            }}
            <span v-if="!isUserRelated(meeting)"> - Not Available</span>
          </div>

        </div>
      </div>
    </div>
    <BookingModal :visible="showModal" :selected-date="selectedDate" :current-user-email="currentUser.email"
      :current-user-name="currentUser.username" :current-user-phone="currentUser.phone"
      :current-user-company="currentUser.company" @close="handleCloseModal" @submit="handleBookingSubmit" />

    <LetterBoxPopup :is-visible="showLetterBox" :is-logged-in="isLoggedIn" @close-letter-box="showLetterBox = false" />

    <button class="fixed bottom-4 right-4 bg-gray-700 text-white p-3 rounded-full shadow-lg"
      @click="showLetterBox = true">
      ✉️
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import BookingModal from '../components/BookingModal.vue'
import LetterBoxPopup from '../components/LetterBoxPopup.vue'
import { useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const api = useApi()
const { user, isLoggedIn, fetchUser } = useAuth()

const showModal = ref(false)
const showLetterBox = ref(false)

const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth())
const selectedDate = ref(today.toISOString().split('T')[0])
const currentUser = ref({ id: null, username: '', email: '', role: '', phone: '', company: '' })

const allRooms = ref([]) //store room list for lookup

const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const allMeetings = ref([])
const hourlyLineRenderedHeight = ref(48)

const calendarDays = computed(() => {
  const result = []
  const firstDay = new Date(year.value, month.value, 1).getDay()
  const lastDate = new Date(year.value, month.value + 1, 0).getDate()

  for (let i = 0; i < firstDay; i++) result.push({ day: null, date: null })

  for (let d = 1; d <= lastDate; d++) {
    const mm = String(month.value + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    const dateStr = `${year.value}-${mm}-${dd}`
    result.push({ day: d, date: dateStr })
  }
  return result
})

const meetingsOnSelectedDate = computed(() => {
  return allMeetings.value.filter(meeting => {
    return meeting.start_time?.startsWith(selectedDate.value)
  })
})


const isUserRelated = (booking) => {
  const currentUserId = user.value?.id;
  const currentUserEmail = user.value?.email || '';
  const currentUserPhone = user.value?.phone || '';

  if (booking.user_id && booking.user_id === currentUserId) return true;
  if (booking.guest_email && booking.guest_email === currentUserEmail) return true;
  if (booking.phone && booking.phone === currentUserPhone) return true;

  return false;
};

onMounted(async () => {
  const res = await getBookingsByDate(selectedDate.value);
  allMeetings.value = res || [];
  myBookings.value = allMeetings.value.filter(isUserRelated);
});




async function selectDate(dateStr) {
  selectedDate.value = dateStr
  await fetchBookingsByDate(dateStr)
}

function prevMonth() {
  if (month.value === 0) {
    month.value = 11
    year.value--
  } else {
    month.value--
  }
  selectedDate.value = new Date(year.value, month.value, 1).toISOString().split('T')[0]
}

function nextMonth() {
  if (month.value === 11) {
    month.value = 0
    year.value++
  } else {
    month.value++
  }
  selectedDate.value = new Date(year.value, month.value, 1).toISOString().split('T')[0]
}

function isToday(dateStr) {
  const todayStr = today.toISOString().split('T')[0]
  return todayStr === dateStr
}

function getMeetingStyle(start_time, end_time) {
  const start = new Date(start_time)
  const end = new Date(end_time)

  const localStart = new Date(start.getTime() + start.getTimezoneOffset() * 60000)
  const localEnd = new Date(end.getTime() + end.getTimezoneOffset() * 60000)

  const startH = localStart.getHours()
  const startM = localStart.getMinutes()
  const endH = localEnd.getHours()
  const endM = localEnd.getMinutes()

  const pixelsPerMinute = hourlyLineRenderedHeight.value / 60
  const startHourTimeline = 10
  const startMinutesFromBase = (startH - startHourTimeline) * 60 + startM
  const endMinutesFromBase = (endH - startHourTimeline) * 60 + endM
  const heightMinutes = endMinutesFromBase - startMinutesFromBase
  const top = startMinutesFromBase * pixelsPerMinute
  const height = heightMinutes * pixelsPerMinute

  return `top: ${top}px; height: ${height}px;`
}


function formatTimeRange(start_time, end_time) {
  const start = new Date(start_time)
  const end = new Date(end_time)

  const formatTime = (date) => {
    const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
    return local.toTimeString().substring(0, 5)
  }

  return `${formatTime(start)} - ${formatTime(end)}`
}


function updateHourlyLineHeight() {
  const hourlyLineElement = document.querySelector('.meeting-timeline-hourly-line')
  if (hourlyLineElement) {
    hourlyLineRenderedHeight.value = hourlyLineElement.offsetHeight
  }
}

async function fetchBookingsByDate(date) {
  try {
    const response = await api(`/bookings/daily/${date}`, {
      method: 'GET',
    })
    allMeetings.value = response
    console.log("Fetched bookings for", date, ":", response)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    allMeetings.value = []
  }
}

async function fetchAllRooms() {
  try {
    const response = await api('/rooms')
    allRooms.value = response
  } catch (err) {
    console.error('Error fetching rooms:', err)
  }
}

onMounted(() => {
  if (import.meta.client) {
    updateHourlyLineHeight()
    window.addEventListener('resize', updateHourlyLineHeight)

    fetchUser().then(() => {
      if (user.value) {
        currentUser.value = user.value
      }
      fetchBookingsByDate(selectedDate.value)
      fetchAllRooms() // fetch room list
    })
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', updateHourlyLineHeight)
  }
})

watch(selectedDate, (newDate) => {
  fetchBookingsByDate(newDate)
})

function openModal() {
  if (!isLoggedIn.value) {
    alert('กรุณาเข้าสู่ระบบก่อนทำการจองห้อง')
    return
  }
  showModal.value = true
  console.log('Booking.vue: ปุ่ม "Booking room" ถูกคลิก! showModal.value เปลี่ยนเป็น:', showModal.value)
}

async function handleBookingSubmit(newBooking) {
  try {
    const bookingPayload = {
      room_id: newBooking.roomId,
      topic: newBooking.topic,
      start_time: `${newBooking.date} ${newBooking.startTime}:00`,
      end_time: `${newBooking.date} ${newBooking.endTime}:00`,
      guest_name: newBooking.guestName,
      guest_email: newBooking.guestEmail,
      guest_phone: newBooking.guestPhone,
      guest_company: newBooking.guestCompany,
      participants_emails: newBooking.participantsEmails,
      requirements: newBooking.requirements,
    }

    const response = await api('/bookings', {
      method: 'POST',
      body: bookingPayload,
    })

    alert('การจองสำเร็จ!')
    console.log('Booking successful:', response)
    await fetchBookingsByDate(selectedDate.value)
    showModal.value = false
    console.log("Booking.vue: หลัง Submit, showModal.value เปลี่ยนเป็น:", showModal.value)

    const selectedRoom = allRooms.value.find(room => room.id === newBooking.roomId)
    const roomName = selectedRoom ? selectedRoom.name : 'ไม่ระบุห้อง'

    const queryParams = {
      topic: bookingPayload.topic,
      roomName: roomName,
      startTime: bookingPayload.start_time,
      endTime: bookingPayload.end_time,
      guestName: bookingPayload.guest_name,
      guestEmail: bookingPayload.guest_email,
      guestPhone: bookingPayload.guest_phone,
      guestCompany: bookingPayload.guest_company,
      participantsEmails: JSON.stringify(bookingPayload.participants_emails),
      requirements: JSON.stringify(bookingPayload.requirements)
    }
    router.push({ path: '/bookingconfirm', query: queryParams })

  } catch (error) {
    console.error("Error submitting booking:", error)
    alert(`Failed to book room: ${error.message}`)
  }
}

const handleCloseModal = () => {
  showModal.value = false
  console.log("Booking.vue: Received 'close' event from BookingModal. showModal set to FALSE.")
}

definePageMeta({
  middleware: ['auth']
});
</script>


<style scoped>
/* Custom CSS for Grid Layout (to bypass Tailwind generation issue) */
@media (min-width: 768px) {
  .custom-grid-layout {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .custom-col-span-2-layout {
    grid-column: span 2 / span 2;
  }
}

/* Custom scrollbar styles */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}
</style>