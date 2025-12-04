<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-2 sm:p-4">
    <div
      class="bg-white rounded-3xl shadow-2xl max-w-[90vw] lg:max-w-[1000px] p-4 sm:p-6 md:p-8 mt-8 sm:mt-0 relative overflow-y-auto max-h-[89vh]  modal-root-container"
    >
      <button
        class="absolute top-3 right-3 text-gray-500 hover:text-red-500 cursor-pointer transition-all duration-150 font-bold text-lg"
        @click="close"
      >
        ✕
      </button>
      <div class="modal-content-wrapper">
        <div class="flex flex-col gap-3 sm:gap-4">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">
            Reservation
          </h2>
          <div
            class="flex justify-between items-center mb-3 bg-gray-200 rounded-full px-1 py-1"
          >
            <button
              class="bg-white rounded-full shadow-md p-1 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 active:bg-gray-300 active:scale-95 transition-all duration-100"
              @click="prevMonth"
            >
              ❮
            </button>
            <h2 class="text-base sm:text-lg font-bold">
              {{ months[currentMonth] }} {{ currentYear }}
            </h2>
            <button
              class="bg-white rounded-full shadow-md p-1 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 active:bg-gray-300 active:scale-95 transition-all duration-100"
              @click="nextMonth"
            >
              ❯
            </button>
          </div>
          <div class="grid grid-cols-7 gap-1 gap-y-0.5 sm:gap-1 text-center justify-center ">
            <div
              v-for="d in days"
              :key="d"
              class="font-semibold text-gray-500 mb-1 pb-5 text-xs sm:text-sm flex items-center justify-center h-10 w-10 sm:h-8"
            >
              {{ d }}
            </div>
            
              <div
                v-for="(day, idx) in calendarDays"
                :key="idx"
                class="day-cell-wrapper w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-150 text-xs sm:text-sm leading-[2.5rem]"
                :class="[
                  day.day && form.date !== day.date
                    ? 'hover:bg-red-100 rounded-full active:bg-red-600 active:scale-90'
                    : '',
                  day.day && form.date === day.date
                    ? 'bg-red-500 text-white rounded-full'
                    : '',
                  day.isToday && form.date !== day.date && day.day
                    ? 'bg-gray-200 text-gray-700 rounded-full'
                    : '',
                  !day.day ? 'pointer-events-none' : '',
                ]"
                @click="day.day && selectDate(day.date)"
              >
                {{ day.day || '' }}
              </div>
            
          </div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3 text-sm">
            <label class="font-medium text-gray-700 whitespace-nowrap">Time :</label>
            <div class="flex gap-2 w-full">
              <input
                v-model="form.startTime"
                type="time"
                class="border px-2 py-1 rounded-md cursor-pointer flex-grow min-w-0"
              >
              <span>-</span>
              <input
                v-model="form.endTime"
                type="time"
                class="border px-2 py-1 rounded-md cursor-pointer flex-grow min-w-0"
              >
            </div>
          </div>
          <div class="flex flex-col gap-2 text-sm">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label class="text-gray-700 font-medium whitespace-nowrap">Start :</label>
              <input
                v-model="form.date"
                type="date"
                class="border px-2 py-1 rounded-md flex-grow cursor-pointer w-full"
                readonly
              >
            </div>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label class="text-gray-700 font-medium whitespace-nowrap">End :</label>
              <input
                v-model="form.date"
                type="date"
                class="border px-2 py-1 rounded-md flex-grow cursor-pointer w-full"
                readonly
              >
            </div>
          </div>
        </div>
        <div class="mt-0 md:mt-16 flex flex-col gap-2 text-sm">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label class="w-auto sm:w-24 font-medium whitespace-now-wrap">Topic :</label>
            <input
              v-model="form.topic"
              type="text"
              class="border px-3 py-1 rounded-md flex-grow w-full"
              placeholder="Meeting Topic"
            >
          </div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label class="w-auto sm:w-24 font-medium whitespace-nowrap">Name :</label>
            <input
              v-model="form.guestName"
              type="text"
              class="border px-3 py-1 rounded-md flex-grow w-full"
              placeholder="Name Surname"
            >
          </div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label class="w-auto sm:w-24 font-medium whitespace-nowrap">Email :</label>
            <input
              v-model="form.guestEmail"
              type="email"
              inputmode="email"
              pattern="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
              class="border px-3 py-1 rounded-md flex-grow w-full"
              placeholder="example@email.com"
            >
          </div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label class="w-auto sm:w-24 font-medium whitespace-nowrap">Phone :</label>
            <input
              v-model="form.guestPhone"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              class="border px-3 py-1 rounded-md flex-grow w-full"
              placeholder="000-000-0000"
              @input="guest.phone = guest.phone.replace(/\D/g, '')"
            >
          </div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label class="w-auto sm:w-24 font-medium whitespace-nowrap">Company :</label>
            <input
              v-model="form.guestCompany"
              type="text"
              class="border px-3 py-1 rounded-md flex-grow w-full"
              placeholder="Company Name (Optional)"
            >
          </div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label class="w-auto sm:w-24 font-medium whitespace-nowrap">Room :</label>
            <div class="flex gap-2 flex-grow">
              <button
                v-for="roomOpt in roomOptions"
                :key="roomOpt.id"
                :class="[
                  'px-3 py-1 rounded-full border text-xs font-semibold active:bg-red-100 active:scale-95 transition-all duration-150 cursor-pointer ',
                  form.roomId === roomOpt.id ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-100',
                  roomOpt.display_status === 'OCCUPIED' || roomOpt.status === 'MAINTENANCE' ? 'opacity-50 cursor-not-allowed' : ''
                ]"
                :disabled="roomOpt.display_status === 'OCCUPIED' || roomOpt.status === 'MAINTENANCE'"
                @click="selectRoom(roomOpt)"
              >
                {{ roomOpt.name }}
              </button>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label class="w-auto sm:w-24 font-medium whitespace-nowrap">Participants :</label>
            <span class="bg-gray-100 border px-4 py-1 rounded-md">{{
              form.participantsEmails.filter(e => e.trim() !== '').length
            }}</span>
          </div>
          <div
            v-for="(email, i) in form.participantsEmails"
            :key="i"
            class="flex items-center gap-2"
          >
            <input
              v-model="form.participantsEmails[i]"
              type="email"
              inputmode="email"
              pattern="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
              class="border px-3 py-1 rounded-md flex-grow min-w-0"
              placeholder="example@email.com"
            >
            <button class="text-red-500 cursor-pointer hover:text-red-600 transition-all duration-150" @click="form.participantsEmails.splice(i, 1)">
              &ndash;
            </button>
          </div>
          <button
            class="text-sm text-blue-500 hover:underline self-start mt-1 cursor-pointer transition-all duration-150"
            @click="form.participantsEmails.push('')"
          >
            + Add Email
          </button>
          <div class="flex flex-col gap-2">
            <label class="font-medium mb-1">Requirements :</label>
            <label class="flex items-center gap-2">
              <input v-model="form.requirements" type="checkbox" value="Device, Cable" >
              Device, Cable
            </label>
            <label class="flex items-center gap-2">
              <input v-model="form.requirements" type="checkbox" value="Projector" >
              Projector
            </label>
            <label class="flex items-center gap-2">
              <input v-model="form.requirements" type="checkbox" value="Whiteboard" >
              Whiteboard
            </label>
            <label class="flex items-center gap-2">
              <input v-model="form.requirements" type="checkbox" value="HDMI Cable" >
              HDMI Cable
            </label>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              class="flex-1 py-2 rounded-full text-white font-semibold bg-[#b5c887] hover:bg-[#a4ba75] active:scale-95 transition-all duration-150 active:bg-green-1000 cursor-pointer"
              @click="submit"
            >
              Confirm
            </button>
            <button
              class="flex-1 py-2 rounded-full text-white font-semibold bg-red-300 hover:bg-red-400 active:scale-95 transition-all duration-150 active:bg-red-500 cursor-pointer"
              @click="close"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, computed, watch, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

const api = useApi()

const props = defineProps({
  visible: Boolean,
  selectedDate: String,
  currentUserEmail: String,
  currentUserName: String,
  currentUserPhone: String,
  currentUserCompany: String,
})

const emit = defineEmits(['close', 'submit'])

const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const roomOptions = ref([]);

async function fetchRooms() {
  try {
    const response = await api('/rooms');
    // normalize to ensure id is present and consistent string type
    roomOptions.value = (response || []).map((r) => ({
      id: String(r.id || r._id || r.room_id || r.name || ''),
      name: r.name || r.room_name || 'Room',
      status: r.status || 'AVAILABLE',
      display_status: r.display_status || r.status || 'AVAILABLE',
    }));
    console.log("Fetched rooms (normalized):", roomOptions.value);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    roomOptions.value = [];
  }
}

const calendarDays = computed(() => {
  const result = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const lastDate = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  for (let i = 0; i < firstDay; i++) {
    result.push({ day: null, date: null, isToday: false })
  }

  for (let d = 1; d <= lastDate; d++) {
    const mm = String(currentMonth.value + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    const dateStr = `${currentYear.value}-${mm}-${dd}`
    result.push({ day: d, date: dateStr, isToday: isCurrentDay(dateStr) })
  }

  return result
})

function isCurrentDay(dateStr) {
  if (!dateStr) return false;
  const checkDate = new Date(dateStr);
  return checkDate.getDate() === today.getDate() &&
         checkDate.getMonth() === today.getMonth() &&
         checkDate.getFullYear() === today.getFullYear()
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const selectDate = (date) => {
  form.value.date = date;
}

const selectRoom = (roomOpt) => {
  if (!roomOpt || roomOpt.display_status === 'OCCUPIED' || roomOpt.status === 'MAINTENANCE') return;
  form.value.roomId = roomOpt.id;
};

const form = ref({
  topic: '',
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  guestCompany: '',
  roomId: null,
  startTime: '',
  endTime: '',
  participantsEmails: [''],
  requirements: [],
  date: ''
})

watch(() => props.visible, async (val) => {
  if (val) {
    form.value.date = props.selectedDate || new Date().toISOString().split('T')[0];
    
    const dateToDisplay = new Date(form.value.date);
    currentMonth.value = dateToDisplay.getMonth();
    currentYear.value = dateToDisplay.getFullYear();

    form.value.guestName = props.currentUserName || '';
    form.value.guestEmail = props.currentUserEmail || '';
    form.value.guestPhone = props.currentUserPhone || '';
    form.value.guestCompany = props.currentUserCompany || '';
    
    form.value.topic = '';
    form.value.roomId = null;
    form.value.startTime = '';
    form.value.endTime = '';
    form.value.requirements = [];
    form.value.participantsEmails = [''];
    
    await fetchRooms();
  }
}, { immediate: true });

// const submit = () => {
//   if (!form.value.topic.trim()) {
//     alert('กรุณากรอกหัวข้อการประชุม');
//     return;
//   }
//   if (!form.value.guestName.trim()) {
//     alert('กรุณากรอกชื่อ');
//     return;
//   }
//   if (!form.value.guestEmail.trim()) {
//     alert('กรุณากรอกอีเมล');
//     return;
//   }
//   if (!form.value.guestPhone.trim()) {
//     alert('กรุณากรอกเบอร์โทรศัพท์');
//     return;
//   }
//   if (!form.value.roomId) {
//     alert('กรุณาเลือกห้อง');
//     return;
//   }
//   if (!form.value.date) {
//     alert('กรุณาเลือกวันที่');
//     return;
//   }
//   if (!form.value.startTime) {
//     alert('กรุณาเลือกเวลาเริ่มต้น');
//     return;
//   }
//   if (!form.value.endTime) {
//     alert('กรุณาเลือกเวลาสิ้นสุด');
//     return;
//   }

//   const startDateTime = new Date(`${form.value.date}T${form.value.startTime}:00`);
//   const endDateTime = new Date(`${form.value.date}T${form.value.endTime}:00`);

//   if (endDateTime <= startDateTime) {
//     alert('เวลาสิ้นสุดต้องหลังจากเวลาเริ่มต้น');
//     return;
//   }
//   if (startDateTime < new Date()) {
//     alert('เวลาเริ่มต้นไม่สามารถเป็นอดีตได้');
//     return;
//   }

//   const filteredParticipantsEmails = form.value.participantsEmails.filter(email => email.trim() !== '');

//   emit('submit', {
//     roomId: form.value.roomId,
//     topic: form.value.topic,
//     date: form.value.date,
//     startTime: form.value.startTime,
//     endTime: form.value.endTime,
//     guestName: form.value.guestName,
//     guestEmail: form.value.guestEmail,
//     guestPhone: form.value.guestPhone,
//     guestCompany: form.value.guestCompany,
//     participantsEmails: filteredParticipantsEmails,
//     requirements: form.value.requirements,
//   })

//   close()
// }

const submit = () => {
  // เพิ่ม console.log ตรงนี้ เพื่อตรวจสอบว่าฟังก์ชันถูกเรียกหรือไม่
  console.log('--- Submit function started ---');
  console.log('Current form values:', form.value);

  // ตรวจสอบข้อมูลในฟอร์ม
  if (!form.value.topic || !form.value.topic.trim()) {
    console.log('Validation Failed: Topic is missing or empty');
    alert('กรุณากรอกหัวข้อการประชุม');
    return;
  }
  if (!form.value.guestName || !form.value.guestName.trim()) {
    console.log('Validation Failed: Name is missing or empty');
    alert('กรุณากรอกชื่อ');
    return;
  }
  if (!form.value.guestEmail || !form.value.guestEmail.trim()) {
    console.log('Validation Failed: Email is missing or empty');
    alert('กรุณากรอกอีเมล');
    return;
  }
  if (!form.value.guestPhone || !form.value.guestPhone.trim()) {
    console.log('Validation Failed: Phone is missing or empty');
    alert('กรุณากรอกเบอร์โทรศัพท์');
    return;
  }
  if (!form.value.roomId) {
    console.log('Validation Failed: Room is not selected');
    alert('กรุณาเลือกห้อง');
    return;
  }
  if (!form.value.date) {
    console.log('Validation Failed: Date is not selected');
    alert('กรุณาเลือกวันที่');
    return;
  }
  if (!form.value.startTime) {
    console.log('Validation Failed: Start time is not selected');
    alert('กรุณาเลือกเวลาเริ่มต้น');
    return;
  }
  if (!form.value.endTime) {
    console.log('Validation Failed: End time is not selected');
    alert('กรุณาเลือกเวลาสิ้นสุด');
    return;
  }

  const startDateTime = new Date(`${form.value.date}T${form.value.startTime}:00`);
  const endDateTime = new Date(`${form.value.date}T${form.value.endTime}:00`);

  if (endDateTime <= startDateTime) {
    console.log('Validation Failed: End time is before or equal to start time');
    alert('เวลาสิ้นสุดต้องหลังจากเวลาเริ่มต้น');
    return;
  }
  if (startDateTime < new Date()) {
    console.log('Validation Failed: Start time is in the past');
    alert('เวลาเริ่มต้นไม่สามารถเป็นอดีตได้');
    return;
  }

  const filteredParticipantsEmails = form.value.participantsEmails.filter(email => email.trim() !== '');

  console.log('Validation Passed! Emitting submit event with payload...');
  emit('submit', {
    roomId: form.value.roomId,
    topic: form.value.topic,
    date: form.value.date,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    guestName: form.value.guestName,
    guestEmail: form.value.guestEmail,
    guestPhone: form.value.guestPhone,
    guestCompany: form.value.guestCompany,
    participantsEmails: filteredParticipantsEmails,
    requirements: form.value.requirements,
  });

  close();
};


const close = () => {
  form.value = {
    topic: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCompany: '',
    roomId: null,
    startTime: '',
    endTime: '',
    participantsEmails: [''],
    requirements: [],
    date: ''
  };
  emit('close');
}

onMounted(() => {
  // onMounted will not be triggered for modal components,
  // the watch on 'visible' prop is the correct approach.
});
</script>

<style scoped>
/* Ensure the scoped styles are properly processed by Vue/Nuxt */

/* Main content wrapper within the modal */
.modal-content-wrapper {
  display: flex; /* Default to flex for column stacking on small screens */
  flex-direction: column; /* Stack columns vertically by default */
  gap: 1rem; /* Adjust gap for smaller screens */
}

/* On medium screens and up, switch to a two-column grid layout */
@media (min-width: 768px) { /* This corresponds to Tailwind's 'md' breakpoint */
  .modal-content-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Two equal columns */
    gap: 2rem; /* Match md:gap-8 (2 * 0.5rem = 1rem; 4 * 0.5rem = 2rem) */
  }
  /* Since we are using grid directly, we don't need md:w-1/2 on children */
}

/* Optional: If you want to refine spacing for very small screens */
@media (max-width: 639px) { /* Below sm breakpoint */
  .modal-root-container {
    padding: 0.75rem; /* Even smaller padding on very small screens */
    padding-top: 1rem;
  }
  .modal-content-wrapper {
    gap: 0.75rem; /* Smaller gap */
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
