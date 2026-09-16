<template>
  <div class="flex-grow flex flex-col items-center justify-center mt-2 p-4">
    <div v-if="total" class="w-full flex flex-col items-center">
      <div class="relative w-32 h-32 mb-4" role="img" :aria-label="`Reservations by company: ${total}`">
        <div class="absolute inset-0 rounded-full" :style="{ background: gradient }" />
        <div class="absolute inset-4 rounded-full bg-white flex items-center justify-center text-lg font-bold">{{ total }}</div>
      </div>
      <ul class="text-sm text-gray-700 space-y-2 w-full">
        <li v-for="row in rows" :key="JSON.stringify(row.company)" class="flex justify-between items-center gap-2">
          <span class="flex items-center min-w-0">
            <span class="w-2 h-2 rounded-full mr-2 shrink-0" :style="{ backgroundColor: row.color }" />
            <span class="break-words">{{ row.company || 'ไม่ระบุบริษัท' }}</span>
          </span>
          <span class="font-semibold whitespace-nowrap">{{ row.reservations }} ({{ row.percentage.toFixed(1) }}%)</span>
        </li>
      </ul>
    </div>
    <p v-else class="text-gray-500 text-sm">ยังไม่มีข้อมูลการจอง</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ companies: { type: Array, default: () => [] } })
const colors = ['#798ECE', '#93B689', '#E4BC70', '#D89090', '#AB92C3', '#7EADB6']
const total = computed(() => props.companies.reduce((sum, row) => sum + row.reservations, 0))
const rows = computed(() => props.companies.map((row, index) => ({
  ...row,
  color: row.company ? colors[index % colors.length] : '#CBD5E1',
  percentage: total.value ? row.reservations / total.value * 100 : 0,
})))
const gradient = computed(() => {
  let start = 0
  return `conic-gradient(${rows.value.map(row => {
    const end = start + row.percentage
    const segment = `${row.color} ${start}% ${end}%`
    start = end
    return segment
  }).join(', ')})`
})
</script>
