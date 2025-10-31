<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Date
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Name
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Req. Date
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Room
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Req. Time
          </th>
          <th scope="col" class="px-6 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">
            Action
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(request, index) in requestsData" :key="index">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ request.date }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ request.name }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ request.reqDate }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ request.room }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ request.reqTime }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex items-center justify-center space-x-2">
              <button @click="approveRequest(index)" class="text-green-600 hover:text-green-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button @click="denyRequest(index)" class="text-red-600 hover:text-red-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="requestsData.length === 0" class="text-center text-gray-500 py-4">No requests found.</div>
  </div>
</template>

<script setup>
const props = defineProps({
  requestsData: {
    type: Array,
    required: true,
  },
});

// ฟังก์ชันสำหรับอนุมัติการร้องขอ (ตัวอย่าง)
const approveRequest = (index) => {
  alert(`Request ${index + 1} approved!`);
  // คุณสามารถ emit event ไปยัง parent component เพื่ออัปเดตข้อมูลจริงได้
  // emit('approve', index);
};

// ฟังก์ชันสำหรับปฏิเสธการร้องขอ (ตัวอย่าง)
const denyRequest = (index) => {
  alert(`Request ${index + 1} denied!`);
  // คุณสามารถ emit event ไปยัง parent component เพื่ออัปเดตข้อมูลจริงได้
  // emit('deny', index);
};
</script>

<style scoped>
/* Custom style for specific table column widths if needed, but Tailwind should handle flex-grow */
</style>