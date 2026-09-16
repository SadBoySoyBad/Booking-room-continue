<template>
  <div class="w-full h-48 flex items-end justify-around space-x-2">
    <div v-for="row in chartData" :key="row.month" class="flex flex-col items-center justify-end" :data-month="row.month">
      <div class="h-40 flex items-end gap-1">
        <div
          class="rounded-t-sm transition-all duration-300"
          :class="showAttendance ? 'w-3 bg-[#798ECE]' : ['w-8', row.current ? 'bg-[#526AA8]' : 'bg-gray-300']"
          :style="{ height: row.count / maxCount * 144 + 'px' }"
          :title="row.month + ': ' + row.count + ' reservations'"
          role="img" :aria-label="row.month + ': ' + row.count + ' reservations'"
        />
        <div v-if="showAttendance" class="w-3 bg-[#93B689] rounded-t-sm transition-all duration-300"
          :style="{ height: row.attendance / maxCount * 144 + 'px' }"
          :title="row.month + ': ' + row.attendance + ' approved reservations'"
          role="img" :aria-label="row.month + ': ' + row.attendance + ' approved reservations'"
        />
      </div>
      <span class="text-xs mt-1">{{ row.month }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  data: { type: Array, default: () => [] },
  showAttendance: { type: Boolean, default: false },
})
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit' }).formatToParts(new Date())
const year = today.find(part => part.type === 'year').value
const currentMonth = Number(today.find(part => part.type === 'month').value) - 1
const chartData = computed(() => months.slice(0, currentMonth + 1).map((month, index) => {
  const key = year + '-' + String(index + 1).padStart(2, '0')
  const row = props.data.find(item => item.month === key)
  return { month, count: row?.count || 0, attendance: row?.attendance || 0, current: index === currentMonth }
}))
const maxCount = computed(() => Math.max(1, ...chartData.value.map(row => row.count)))
</script>
