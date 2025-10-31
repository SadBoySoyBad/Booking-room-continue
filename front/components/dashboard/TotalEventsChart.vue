<!-- <template>
  <div class="flex flex-col items-center justify-center w-full">
    <div class="relative w-32 h-32 mb-4">
      <div
        class="absolute inset-0 rounded-full bg-gray-200"
        style="
          background: conic-gradient(
            #f9a8d4 0% 65%,
            #e2e8f0 65% 100%
          ); /* Approximation */
        "
      ></div>
      <div
        class="absolute inset-4 rounded-full bg-white flex items-center justify-center text-lg font-bold"
      >
        1000
      </div>
    </div>
    <div class="text-lg font-semibold mb-2">Total Events</div>
    <ul class="text-sm text-gray-700">
      <li>Guests: 650</li>
      <li>Users: 250</li>
      <li>Admin: 100</li>
    </ul>
  </div>
</template>

<script setup></script> -->

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <div class="relative w-32 h-32 mb-4">
      <div
        v-if="!loading"
        class="absolute inset-0 rounded-full bg-gray-200"
        :style="{ background: conicGradientStyle }"
      ></div>
      <div
        v-if="!loading"
        class="absolute inset-4 rounded-full bg-white flex items-center justify-center text-lg font-bold"
      >
        {{ totalEvents }} </div>
      <div v-else class="absolute inset-0 flex items-center justify-center text-gray-500">
        Loading...
      </div>
    </div>
    <div class="text-lg font-semibold mb-2">Total Events</div>
    <div v-if="!loading">
      <ul class="text-sm text-gray-700">
        <li>Guests: {{ guestEvents }}</li> <li>Employees: {{ employeeEvents }}</li> <li>Admin: {{ adminEvents }}</li> </ul>
    </div>
    <div v-else class="text-sm text-gray-500">
      Loading event details...
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  totalEvents: {
    type: [Number, String],
    default: 0,
  },
  eventsByRole: {
    type: Object,
    default: () => ({ guest: 0, employee: 0, admin: 0 }),
  },
  loading: {
    type: Boolean,
    default: false,
  }
});

const guestEvents = computed(() => props.eventsByRole.guest || 0);
const employeeEvents = computed(() => props.eventsByRole.employee || 0);
const adminEvents = computed(() => props.eventsByRole.admin || 0);

const conicGradientStyle = computed(() => {
  const total = Number(props.totalEvents);
  if (total === 0 || props.loading) {
    return `conic-gradient(#e2e8f0 0% 100%)`;
  }

  const guestPercentage = (guestEvents.value / total) * 100 || 0;
  const employeePercentage = (employeeEvents.value / total) * 100 || 0;
  const adminPercentage = (adminEvents.value / total) * 100 || 0;

  const guestColor = '#54694E'; // เขียว
  const employeeColor = '#798ECE'; // ชมแดง(ชมพู + แดง)
  const adminColor = '#798ECE'; // น้ำเงินม่วงฟ้า

  let currentStart = 0;
  let gradientParts = [];

  if (guestPercentage > 0) {
    const end = currentStart + guestPercentage;
    gradientParts.push(`${guestColor} ${currentStart}% ${end}%`);
    currentStart = end;
  }
  if (employeePercentage > 0) {
    const end = currentStart + employeePercentage;
    gradientParts.push(`${employeeColor} ${currentStart}% ${end}%`);
    currentStart = end;
  }
  if (adminPercentage > 0) {
    const end = currentStart + adminPercentage;
    gradientParts.push(`${adminColor} ${currentStart}% ${end}%`);
    currentStart = end;
  }

  if (currentStart < 100) {
    gradientParts.push(`#e2e8f0 ${currentStart}% 100%`);
  }
  
  return `conic-gradient(${gradientParts.join(', ')})`;
});
</script>

<style scoped>
/* No specific styles needed */
</style>