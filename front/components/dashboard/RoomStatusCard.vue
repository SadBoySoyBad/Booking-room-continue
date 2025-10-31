<template>
  <div
    class="rounded-lg p-3 text-center border-2"
    :class="getStatusClass(status)"
  >
    <div
      class="text-sm font-semibold mb-1 rounded-full px-2 py-0.5 inline-block"
      :class="getAvailabilityClass(status)"
    >
      {{ roomName }}
    </div>
    <div class="text-xs text-[#FFFFFF]">{{ time }}</div>
    <div class="text-sm font-medium mt-1">{{ topic }}</div>
    <div class="text-xs text-[#FFFFFF]">{{ user }}</div>
  </div>
</template>

<script setup>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps({
  roomName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    validator: (value) =>
      ["Available", "Occupied", "Maintenance", "Unavailable"].includes(value), // เพิ่ม Unavailable
  },
  time: {
    type: String,
    default: "XX:XX - XX:XX",
  },
  topic: {
    type: String,
    default: "",
  },
  user: {
    type: String,
    default: "",
  },
});

const getStatusClass = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "border-[#728E6B] bg-[#728E6B]"; 
    case "OCCUPIED":
      return "border-[#AC4E69] bg-[#AC4E69]"; 
    case "MAINTENANCE":
      return "border-[#B5B6BA] bg-[#B5B6BA]"; 
    case "UNAVAILABLE": 
      return "border-[#B5B6BA] bg-[#B5B6BA]"; 
    default:
      return "border-[#B5B6BA] bg-[#FFFFFF]";
  }
};

const getAvailabilityClass = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-[#728E6B] text-[#FFFFFF]"; 
    case "OCCUPIED":
      return "bg-[#AC4E69] text-[#FFFFFF]"; 
    case "MAINTENANCE":
      return "bg-[#B5B6BA] text-[#FFFFFF]"; 
    case "UNAVAILABLE": 
      return "bg-[#B5B6BA] text-[#FFFFFF]";
    default:
      return "bg-[#B5B6BA] text-[#FFFFFF]";
  }
};
</script>

<style scoped>
/* No custom styles needed, Tailwind CSS handles most responsiveness */
</style>