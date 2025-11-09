<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Date
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Time
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Name
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Role
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Action
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(item, index) in activityLogData" :key="index">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ item.date }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ item.time }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ item.name }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ item.role }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button
              :class="getActionBadgeClass(item.actionType)"
              class="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1"
            >
              <svg v-if="item.actionType === 'login'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <svg v-if="item.actionType === 'reserved'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-if="item.actionType === 'logout'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <svg v-if="item.actionType === 'request'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <svg v-if="item.actionType === 'canceled' || item.actionType === 'denied'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-if="item.actionType === 'edited'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <svg v-if="item.actionType === 'approved'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ item.action }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="activityLogData.length === 0" class="text-center text-gray-500 py-4">No activities found.</div>
  </div>
</template>

<script setup>
const props = defineProps({
  activityLogData: {
    type: Array,
    required: true,
  },
});

const getActionBadgeClass = (actionType) => {
  switch (actionType) {
    case "login":
      return "bg-blue-100 text-blue-800"; // Changed to blue as per image
    case "logout":
      return "bg-gray-100 text-gray-800"; // Changed to gray as per image
    case "request":
      return "bg-yellow-100 text-yellow-800";
    case "reserved":
      return "bg-green-100 text-green-800";
    case "canceled":
      return "bg-red-100 text-red-800"; // Added for Canceled
    case "edited":
      return "bg-orange-100 text-orange-800"; // Changed to orange as per image
    case "approved":
      return "bg-green-100 text-green-800";
    case "denied":
      return "bg-red-100 text-red-800"; // Added for Denied
    default:
      return "bg-gray-100 text-gray-800";
  }
};
</script>

<style scoped>
/* No specific styles needed */
</style>