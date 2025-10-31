<!-- <template>
  <div class="w-full h-48 flex items-end justify-around space-x-2">
    <div
      v-for="(data, index) in monthlyData"
      :key="index"
      class="flex flex-col items-center justify-end"
    >
      <div
        class="bg-blue-500 w-8 rounded-t-sm transition-all duration-300"
        :class="{ 'bg-blue-500': data.month === 'Apr', 'bg-gray-300': data.month !== 'Apr' }"
        :style="{ height: (data.value / 100) * 100 + '%' }"
        />
        <span class="text-xs mt-1">{{ data.month }}</span>
        
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const monthlyData = ref([
  { month: "Jan", value: 60 },
  { month: "Feb", value: 70 },
  { month: "Mar", value: 80 },
  { month: "Apr", value: 100 }, // Highlighted in the image
  { month: "May", value: 50 },
  { month: "Jun", value: 75 },
  { month: "Jul", value: 90 },
]);
</script> -->

<template>
  <div class="w-full h-48 flex items-end justify-around space-x-2">
    <div
      v-for="(data, index) in chartData"
      :key="index"
      class="flex flex-col items-center justify-end"
    >
      <div
        class="w-8 rounded-t-sm transition-all duration-300"
        :class="{ 'bg-[#526AA8]': data.month === 'Jul', 'bg-gray-300': data.month !== 'Jul' }"
        :style="{ height: (data.count / maxCount) * 100 + '%' }" 
      />
      <span class="text-xs mt-1">{{ data.month }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"; // เพิ่ม computed

// กำหนด props ที่จะรับข้อมูลจาก dashboard.vue
const props = defineProps({
  data: {
    type: Array,
    default: () => [], // default เป็น Array ว่าง
  },
});

// กำหนดเดือนทั้งหมดในปี
const allMonths = [
  { month: 'Jan', count: 0 },
  { month: 'Feb', count: 0 },
  { month: 'Mar', count: 0 },
  { month: 'Apr', count: 0 },
  { month: 'May', count: 0 },
  { month: 'Jun', count: 0 },
  { month: 'Jul', count: 0 }, // เดือนปัจจุบัน
  { month: 'Aug', count: 0 },
  { month: 'Sep', count: 0 },
  { month: 'Oct', count: 0 },
  { month: 'Nov', count: 0 },
  { month: 'Dec', count: 0 },
];

// ใช้ computed เพื่อรวมข้อมูลที่รับมากับเดือนทั้งหมด
const chartData = computed(() => {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0 for Jan, 6 for Jul

  // Map ข้อมูลที่ได้รับมาเข้ากับเดือนทั้งหมด
  const mappedData = allMonths.map((monthData, index) => {
    // หาข้อมูลจาก props.data ที่ตรงกับเดือน
    const found = props.data.find(item => {
      // item.month จาก Backend จะเป็น 'YYYY-MM'
      const monthPart = item.month ? item.month.split('-')[1] : null;
      // แปลง monthPart เป็น index ของเดือน (0-11)
      const backendMonthIndex = monthPart ? parseInt(monthPart, 10) - 1 : -1;
      return backendMonthIndex === index;
    });

    return {
      month: monthData.month, // ชื่อเดือน (Jan, Feb)
      count: found ? found.count : 0, // จำนวน event
    };
  }).filter((_, index) => index <= currentMonthIndex); // กรองให้แสดงเฉพาะเดือนปัจจุบันหรือเดือนที่ผ่านมา

  return mappedData;
});


// คำนวณค่าสูงสุดเพื่อกำหนดความสูงของแท่งกราฟ
const maxCount = computed(() => {
  if (chartData.value.length === 0) return 1; // ป้องกันการหารด้วยศูนย์
  return Math.max(...chartData.value.map((d) => d.count));
});
</script>