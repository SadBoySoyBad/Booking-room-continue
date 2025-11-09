<template>
  <div class="overflow-x-auto flex-grow flex flex-col">
    <div class="min-w-full">
      <div
        class="grid grid-cols-[1fr_1.5fr_1.2fr_1.5fr_1.5fr_1fr] gap-x-4 pb-3 border-b border-gray-400 mb-2"
      >
        <div class="font-bold text-gray-800 text-sm md:text-base">Date</div>
        <div class="font-bold text-gray-800 text-sm md:text-base">Name</div>
        <div class="font-bold text-gray-800 text-sm md:text-base">
          Req. Date
        </div>
        <div class="font-bold text-gray-800 text-sm md:text-base">
          Req. Room
        </div>
        <div class="font-bold text-gray-800 text-sm md:text-base">
          Req. Time
        </div>
        <div class="font-bold text-gray-800 text-sm md:text-base text-center">
          Action
        </div>
      </div>

      <div class="space-y-2 divide-y divide-gray-200">
        <div
          v-for="(request, index) in requestsDataInternal"
          :key="index"
          class="grid grid-cols-[1fr_1.5fr_1.2fr_1.5fr_1.5fr_1fr] gap-x-4 items-center py-3"
        >
          <div class="text-gray-700 text-sm md:text-base break-words">
            {{ request.date }}
          </div>
          <div class="text-gray-700 text-sm md:text-base break-words">
            {{ request.name }}
          </div>
          <div class="text-gray-700 text-sm md:text-base break-words">
            {{ request.reqDate }}
          </div>
          <div class="text-gray-700 text-sm md:text-base break-words">
            {{ request.reqRoom }}
          </div>
          <div class="text-gray-700 text-sm md:text-base break-words">
            {{ request.reqTime }}
          </div>
          <div class="flex flex-col items-center space-y-2">
            <button
              class="bg-green-500 hover:bg-green-600 text-white font-bold py-0.5 px-3 rounded-full text-xs w-[70px] text-center"
              @click="handleAction('approve', request.id)"
            >
              Approve
            </button>
            <button
              class="bg-red-500 hover:bg-red-600 text-white font-bold py-0.5 px-3 rounded-full text-xs w-[70px] text-center"
              @click="handleAction('deny', request.id)"
            >
              Deny
            </button>
          </div>
        </div>
        <div
          v-if="requestsDataInternal.length === 0"
          class="text-center text-gray-500 py-4"
        >
          No pending requests.
        </div>
      </div>
    </div>
  </div>

  <AdminPopup
    :visible="showConfirmationModal"
    title="Confirm Action"
    confirmation-message="Are you sure you want to proceed?"
    type="confirm"
    @close="cancelAction"
    @confirm="confirmAction"
    @cancel="cancelAction"
  />
</template>

<script setup>
import { ref, watch } from "vue";

import AdminPopup from "../AdminPopup.vue";

const props = defineProps({
  requestsData: {
    // รับข้อมูลมาจาก Parent Component
    type: Array,
    default: () => [],
  },
  isModal: {
    // Prop ใหม่: เพื่อระบุว่า Table นี้แสดงอยู่ใน Modal หรือไม่
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update-requests"]); // Emit เมื่อมีการ Approve/Deny

const requestsDataInternal = ref([]);

// Watch prop requestsData และอัปเดต requestsDataInternal
watch(
  () => props.requestsData,
  (newVal) => {
    requestsDataInternal.value = [...newVal];
  },
  { immediate: true }
);

// State สำหรับ Pop-up ยืนยัน
const showConfirmationModal = ref(false);
const pendingRequestId = ref(null);
const pendingActionType = ref(""); // 'approve' or 'deny'

const handleAction = (action, requestId) => {
  pendingRequestId.value = requestId;
  pendingActionType.value = action;
  showConfirmationModal.value = true;
};

const confirmAction = () => {
  if (pendingActionType.value === "approve") {
    alert(`Request ${pendingRequestId.value} Approved!`);
    // ส่ง event กลับไปให้ dashboardadmin.vue จัดการลบข้อมูล
    emit("update-requests", { action: "approve", id: pendingRequestId.value });
  } else if (pendingActionType.value === "deny") {
    alert(`Request ${pendingRequestId.value} Denied!`);
    // ส่ง event กลับไปให้ dashboardadmin.vue จัดการลบข้อมูล
    emit("update-requests", { action: "deny", id: pendingRequestId.value });
  }
  showConfirmationModal.value = false;
  pendingRequestId.value = null;
  pendingActionType.value = "";
};

const cancelAction = () => {
  showConfirmationModal.value = false;
  pendingRequestId.value = null;
  pendingActionType.value = "";
};
</script>

<style scoped>
/* เพิ่มสไตล์เฉพาะสำหรับคอมโพเนนต์นี้ถ้าจำเป็น */
</style>
