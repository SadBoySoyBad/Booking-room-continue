<template>
  <div class="flex flex-col items-center justify-center h-full p-4">
    <div class="text-black text-sm font-bold mb-2">Add Admin Form</div>
    <div class="text-black text-sm font-bold mb-2">
      Insert required information below:
    </div>
    <button
      class="text-red-600 text-sm font-bold underline cursor-pointer hover:text-red-800 transition-colors duration-200"
      @click="showAddAdminModal = true"
    >
      **Click to EXPAND as a POP-UP window for full info to edit**
    </button>

    <AdminPopup
    type="admin"
    title="Add Admin Form"
    confirm-button-text="Confirm"
    :visible="showAddAdminModal"
    @close="showAddAdminModal = false"
    @submit="handleAddAdmin"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";

import AdminPopup from "../AdminPopup.vue";

const showAddAdminModal = ref(false);

const handleAddAdmin = (formData) => {
  alert("Admin Added: " + JSON.stringify(formData));
  console.log("Admin Data:", formData);
  showAddAdminModal.value = false;
};
</script>

<style scoped>
/* เพิ่มสไตล์เฉพาะสำหรับคอมโพเนนต์นี้ถ้าจำเป็น */
</style>
