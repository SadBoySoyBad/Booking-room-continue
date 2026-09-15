<template>
  <AdminPopup :visible="visible" type="custom-content" title="Filter" confirm-button-text="Apply" @close="apply">
    <div class="col-span-2">
      <label class="text-sm font-medium">Search</label>
      <input v-model="query" type="search" placeholder="Name, email, room or date"
        class="w-full rounded-md border border-gray-300 px-3 py-2 mt-1 bg-gray-100" @keyup.enter="apply">
    </div>
  </AdminPopup>
</template>
<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ visible: Boolean, modelValue: { type: String, default: '' } });
const emit = defineEmits(['apply']);
const query = ref(props.modelValue);
watch(() => props.visible, () => { query.value = props.modelValue; });
const apply = () => emit('apply', query.value.trim());
</script>
