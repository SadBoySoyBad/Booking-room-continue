<template>
  <div class="relative inline-block text-left">
    <button class="text-gray-500 hover:text-gray-700 font-bold text-xl leading-none" @click="toggleMenu">...</button>

    <div v-if="showMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-30 top-full transform translate-y-2">
      <button class="flex items-center w-full text-left px-4 py-2 text-sm text-yellow-800 hover:bg-yellow-50 rounded-t-lg" @click="selectOption('edit')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>
      <button class="flex items-center w-full text-left px-4 py-2 text-sm text-red-800 hover:bg-red-50 rounded-b-lg" @click="selectOption('cancel')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Cancel
      </button>
    </div>

    <div v-if="showConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40">
      <div class="bg-white p-8 rounded-lg shadow-xl text-center">
        <p class="text-lg font-semibold mb-6">Are you sure?</p>
        <div class="flex justify-center space-x-4">
          <button class="bg-green-100 text-green-800 px-6 py-2 rounded-full flex items-center gap-2 hover:bg-green-200 transition-colors duration-200" @click="confirmAction">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Yes
          </button>
          <button class="bg-red-100 text-red-800 px-6 py-2 rounded-full flex items-center gap-2 hover:bg-red-200 transition-colors duration-200" @click="cancelAction">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            No
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['select-option']); // จะ emit 'edit' หรือ 'cancel'

const showMenu = ref(false); // ควบคุมการแสดง Pop-up เมนู Edit/Cancel
const showConfirmation = ref(false); // ควบคุมการแสดง Pop-up "Are you sure?"
const pendingAction = ref(null); // เก็บ action ที่รอกรยืนยัน (e.g., 'cancel')

// ฟังก์ชันสำหรับเปิด/ปิด Pop-up เมนู Edit/Cancel
const toggleMenu = () => {
  showMenu.value = !showMenu.value;
  // เมื่อเปิดเมนู ให้แน่ใจว่า Pop-up ยืนยันถูกปิด
  if (showMenu.value) {
    showConfirmation.value = false;
  }
};

// ฟังก์ชันเมื่อเลือก Edit หรือ Cancel จากเมนู
const selectOption = (option) => {
  showMenu.value = false; // ปิดเมนู Edit/Cancel ทันที

  if (option === 'cancel') {
    pendingAction.value = 'cancel'; // ตั้งค่าว่ากำลังรอการยืนยันการยกเลิก
    showConfirmation.value = true; // แสดง Pop-up "Are you sure?"
  } else {
    // ถ้าเป็น 'edit' หรือ action อื่นๆ ที่ไม่ต้องยืนยัน
    emit('select-option', option); // ส่ง option กลับไปให้คอมโพเนนต์แม่ทันที
  }
};

// ฟังก์ชันเมื่อยืนยันใน Pop-up "Are you sure?"
const confirmAction = () => {
  if (pendingAction.value === 'cancel') {
    emit('select-option', 'cancel'); // ส่ง 'cancel' กลับไปให้คอมโพเนนต์แม่
  }
  // สามารถเพิ่ม Logic สำหรับ action อื่นๆ ที่อาจจะต้องยืนยันในอนาคตได้ที่นี่
  
  showConfirmation.value = false; // ปิด Pop-up ยืนยัน
  pendingAction.value = null; // ล้าง action ที่รอกรยืนยัน
};

// ฟังก์ชันเมื่อยกเลิกใน Pop-up "Are you sure?"
const cancelAction = () => {
  showConfirmation.value = false; // ปิด Pop-up ยืนยัน
  pendingAction.value = null; // ล้าง action ที่รอกรยืนยัน
};

// ฟังก์ชันสำหรับปิด Pop-up เมนูเมื่อคลิกนอกพื้นที่
const handleClickOutside = (event) => {
  const popupElement = event.target.closest('.relative.inline-block');
  const confirmationElement = event.target.closest('.fixed.inset-0.bg-black');

  // ถ้าคลิกนอกเมนูและนอก Pop-up ยืนยัน
  if (showMenu.value && !popupElement) {
    showMenu.value = false;
  }
  // ถ้าคลิกนอก Pop-up ยืนยัน แต่ Pop-up ยืนยันกำลังแสดงอยู่
  // และไม่ได้คลิกที่ปุ่มที่เปิดเมนูหลัก
  if (showConfirmation.value && !confirmationElement && !popupElement) {
    // ไม่ต้องทำอะไร ถ้าต้องการให้กดภายนอกปิด confirmation popup ให้ uncomment บรรทัดล่าง
    // showConfirmation.value = false;
    // pendingAction.value = null;
  }
};

// Hook to add/remove event listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* สไตล์เฉพาะสำหรับคอมโพเนนต์นี้ */
</style>