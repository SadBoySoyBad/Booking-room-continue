<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-gray-500/40 transition-all duration-150">
    <div
        :class="{ 'max-w-full h-full rounded-none': fullScreen, 'max-w-2xl': !fullScreen }"
        class="bg-white/90 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-xl w-full relative overflow-hidden flex flex-col"> <h2 class="text-2xl font-bold mb-6 text-center">{{ title }}</h2>

      <button class="absolute top-3 right-3 text-gray-500 hover:text-red-500 cursor-pointer transition-all duration-150" @click="close">✕</button>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-y-auto pr-2"> <template v-if="type === 'admin'">
          <div class="space-y-4 col-span-2">
            <div>
              <label class="text-sm font-medium">Name</label>
              <input v-model="form.name" type="text" required class="w-full rounded-md border border-gray-300 px-3 py-2 mt-1 bg-gray-100" placeholder="Name Surname">
            </div>

            <div>
              <label class="text-sm font-medium">Phone</label>
              <input v-model="form.phone" type="tel" placeholder="+00 012-345-6789" class="w-full rounded-md border border-gray-300 px-3 py-2 mt-1 bg-gray-100">
            </div>

            <div>
              <label class="text-sm font-medium">Email</label>
              <input v-model="form.email" type="email" placeholder="example@email.com" class="w-full rounded-md border border-gray-300 px-3 py-2 mt-1 bg-gray-100">
            </div>
          </div>
        </template>

        <template v-else-if="type === 'booking'">
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">Name</label>
              <input v-model="form.name" type="text" required class="w-full rounded-md border border-gray-300 px-3 py-2 mt-1 bg-gray-100" placeholder="Name">
            </div>

            <div>
              <label class="text-sm font-medium">Room</label>
              <select v-model="form.room" required class="w-full rounded-md border border-gray-300 px-3 py-2 mt-1 bg-gray-100">
                <option value="">Select Room</option>
                <option value="A">Room A</option>
                <option value="B">Room B</option>
                <option value="C">Room C</option>
                <option value="D">Room D</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium">Participants (Email)</label>
              <input v-model="form.participants" type="email" placeholder="example@gmail.com" class="w-full rounded-md border border-gray-300 px-3 py-2 mt-1 bg-gray-100">
            </div>

            <div>
              <label class="text-sm font-medium">Equipment</label>
              <div class="flex flex-col space-y-1 mt-1">
                <label><input v-model="form.equipment" type="checkbox" value="Projector"> Projector</label>
                <label><input v-model="form.equipment" type="checkbox" value="Whiteboard"> Whiteboard</label>
                <label><input v-model="form.equipment" type="checkbox" value="Microphone"> Microphone</label>
                <label><input v-model="form.equipment" type="checkbox" value="Speaker"> HDMI cable</label>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">Date</label>
              <input v-model="form.selectedDate" type="date" required class="w-full rounded-md border border-gray-300 px-3 py-2 mt-1 bg-white cursor-pointer">
            </div>

            <div class="flex space-x-2">
              <div class="flex-1">
                <label class="text-sm font-medium">Start</label>
                <input v-model="form.start" type="time" min="10:00" max="18:00" required class="w-full rounded-md border border-gray-300 px-3 py-2 mt-1 hover:bg-gray-100 cursor-pointer">
              </div>
              <div class="flex-1">
                <label class="text-sm font-medium">End</label>
                <input v-model="form.end" type="time" min="10:00" max="18:00" required class="w-full rounded-md border border-gray-300 px-3 py-2 mt-1 hover:bg-gray-100 cursor-pointer">
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="type === 'confirm'">
          <div class="col-span-2 text-center text-lg">
            <p>{{ confirmationMessage || 'Are you sure?' }}</p>
          </div>
        </template>

        <template v-else-if="type === 'custom-content'">
            <slot/> </template>
      </div>

      <div class="mt-6">
        <div v-if="type === 'confirm'" class="flex justify-center space-x-4">
            <button class="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 active:scale-95 transition-all" @click="confirm">
                Yes
            </button>
            <button class="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 active:scale-95 transition-all" @click="cancel">
                No
            </button>
        </div>
        <button v-else class="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 active:scale-95 transition-all" @click="submitForm">
          {{ confirmButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, reactive, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'booking',
    validator: (value) => ['booking', 'admin', 'confirm', 'custom-content'].includes(value) // เพิ่ม 'custom-content'
  },
  title: {
    type: String,
    default: 'Reservation'
  },
  confirmButtonText: {
    type: String,
    default: 'Confirm Booking'
  },
  selectedDate: {
    type: String,
    default: ''
  },
  initialData: {
    type: Object,
    default: null
  },
  confirmationMessage: {
    type: String,
    default: 'Are you sure?'
  },
  fullScreen: { // Prop ใหม่: ถ้าเป็น true Modal จะเต็มจอ
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'submit', 'confirm', 'cancel']);

const form = reactive({
  name: '',
  room: '',
  participants: '',
  selectedDate: props.selectedDate,
  start: '',
  end: '',
  equipment: [],
  phone: '',
  email: ''
});

// Watch สำหรับ props.initialData เพื่อเติมฟอร์ม (Admin หรือ Booking)
watch(() => props.initialData, (newData) => {
  if (newData && (props.type === 'admin' || props.type === 'booking')) {
    if (props.type === 'admin') {
      form.name = newData.name || '';
      form.phone = newData.phone || '';
      form.email = newData.email || '';
    } else if (props.type === 'booking') {
      form.name = newData.name || '';
      form.room = newData.room || '';
      form.participants = newData.participants || '';
      form.selectedDate = newData.date || '';
      const [start, end] = (newData.time || '').split(' - ');
      form.start = start || '';
      form.end = end || '';
      form.equipment = newData.equipment || [];
    }
  } else {
    resetForm();
  }
}, { immediate: true });

// Watch สำหรับ props.selectedDate (เฉพาะ booking form)
watch(() => props.selectedDate, (newDate) => {
  if (props.type === 'booking') {
    form.selectedDate = newDate;
  }
});

function resetForm() {
  Object.assign(form, {
    name: '', room: '', participants: '', selectedDate: props.selectedDate,
    start: '', end: '', equipment: [], phone: '', email: ''
  });
}

function close() {
  emit('close');
  // ไม่รีเซ็ตฟอร์มทันทีเมื่อปิด เพื่อให้ข้อมูลยังคงอยู่หากผู้ใช้เปิดใหม่
}

function submitForm() {
  if (props.type === 'admin') {
    if (!form.name || !form.email) {
      alert('Please fill in Name and Email.');
      return;
    }
    emit('submit', { name: form.name, phone: form.phone, email: form.email });
  } else if (props.type === 'booking') {
    const [startHour, startMin] = form.start.split(':').map(Number);
    const [endHour, endMin] = form.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    if (endTime <= startTime) {
      alert('End time must be later than start time.');
      return;
    }
    if (!form.name || !form.room || !form.selectedDate || !form.start || !form.end) {
      alert('Please fill in all required fields (Name, Room, Date, Start, End).');
      return;
    }
    emit('submit', { ...form, date: form.selectedDate, time: `${form.start} - ${form.end}` });
  }
  // ถ้า type เป็น 'custom-content' submitForm จะทำหน้าที่แค่ close (ถ้า confirmButtonText ไม่ใช่ "Close" สามารถปรับได้)
  close();
}

function confirm() {
    emit('confirm');
    close();
}

function cancel() {
    emit('cancel');
    close();
}
</script>

<style scoped>
/* คุณสามารถเพิ่มหรือปรับแต่ง CSS เพิ่มเติมที่นี่ได้ */
</style>
