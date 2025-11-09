<!-- <template>
  <div class="space-y-4 text-center">
    <h2 class="text-xl font-bold mb-4">กรุณาเลือกประเภทผู้ใช้งาน</h2>

    <button
      class="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 active:scale-98 active:shadow-lg transition-all duration-100 hover:shadow transition"
      @click="emit('select', 'guest')"
    >
      Login as Guest
    </button>

    <button
      class="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 active:scale-98 active:shadow-lg transition-all duration-110 hover:shadow transition"
      @click="emit('select', 'employee')"
    >
      Login as Employee
    </button>
  </div>
</template>

<script setup>
const emit = defineEmits(['select'])
</script> -->


<template>
  <div class="space-y-4">
    <h2 class="text-2xl font-bold text-center text-blue-900">Just a quick role check.</h2>

    <button
      @click="emit('select', 'guest')"
      class="w-full flex items-center justify-between border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left"
    >
      <div class="flex items-center gap-3">
        <img src="/Guest.png" alt="Guest" class="w-10 h-10 rounded-full" />
        <div>
          <div class="font-bold text-gray-700">GUEST</div>
          <div class="text-sm text-gray-500">When dreams and people meet, magic happens.</div>
        </div>
      </div>
      <div class="text-gray-400 text-2xl">›</div>
    </button>

    <button
      @click="emit('select', 'employee')"
      class="w-full flex items-center justify-between border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left"
    >
      <div class="flex items-center gap-3">
        <img src="/Staff.png" alt="Staff" class="w-10 h-10 rounded-full" />
        <div>
          <div class="font-bold text-gray-700">STAFF</div>
          <div class="text-sm text-gray-500">My organization will start something big, just from meetings.</div>
        </div>
      </div>
      <div class="text-gray-400 text-2xl">›</div>
    </button>
  </div>
</template>

<script setup>
const emit = defineEmits(['select', 'back'])
</script>
