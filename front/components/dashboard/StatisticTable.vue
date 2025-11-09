<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            scope="col"
            class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            District
          </th>
          <th
            scope="col"
            class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Total
          </th>
          <th
            scope="col"
            class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Company
          </th>
          <th
            scope="col"
            class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Total Events
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(item, index) in statisticData" :key="index">
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
            {{ item.district }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
            {{ item.total }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
            {{ item.company }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
            {{ item.totalEvents }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps({
  statisticData: {
    type: Array,
    required: true,
  },
});
</script>