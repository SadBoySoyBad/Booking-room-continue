<template>
  <div class="text-center">
    <div class="text-4xl font-bold mb-2">{{ currentTime }}</div>
    <div class="text-xl text-gray-600">{{ currentDate }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const currentTime = ref("");
const currentDate = ref("");
let intervalId;

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  currentDate.value = now.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

onMounted(() => {
  updateTime();
  intervalId = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>