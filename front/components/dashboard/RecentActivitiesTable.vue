<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            scope="col"
            class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Time
          </th>
          <th
            scope="col"
            class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Name
          </th>
          <th
            scope="col"
            class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Role
          </th>
          <th
            scope="col"
            class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Action
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(item, index) in activityLogData" :key="index">
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
            {{ item.time }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
            {{ item.name }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
            {{ item.role }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
            <span
              :class="getActionBadgeClass(item.actionType)"
              class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
            >
              {{ item.action }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const { activityLogData } = defineProps({
  activityLogData: {
    type: Array,
    required: true,
  },
});


const getActionBadgeClass = (actionType) => {
  switch (actionType) {
    case "login":
      return "bg-[#3C3F9D] text-[#D7D8FF]";
    case "logout":
      return "bg-[#9D3C3E] text-[#FFD9D9]";
    case "request":
      return "bg-[#F3FFD8] text-[#809D3C]";
    case "reserved":
      return "bg-[#FFF8D7] text-[#9D8B3C]";
    case "add":
      return "bg-[#FFC0CB] text-[#000000]";
    case "edited":
      return "bg-[#87CEEB] text-[#0047AB]";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
</script>