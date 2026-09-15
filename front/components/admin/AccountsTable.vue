<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Email
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Name
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Phone
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
            Sign Up At
          </th>
          <th scope="col" class="px-6 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">
            Action
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(account, index) in accountsData" :key="index">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ account.email }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ account.name }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ account.phone }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {{ account.signUpAt }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
            <div class="relative inline-block text-left">
              <button @click="toggleActionsDropdown(index)" class="inline-flex justify-center w-full rounded-md shadow-sm px-2 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
                ...
              </button>
              <div v-if="activeDropdownIndex === index" class="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div class="py-1">
                  <button @click="editAccount(account); activeDropdownIndex = null;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Edit</button>
                  <button @click="deleteAccount(account); activeDropdownIndex = null;" class="block px-4 py-2 text-sm text-red-700 hover:bg-red-100 w-full text-left">Delete</button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="accountsData.length === 0" class="text-center text-gray-500 py-4">No accounts found for this role.</div>
    <AdminPopup type="admin" title="Edit Account" confirm-button-text="Save"
      :require-email="editingAccount?.role !== 'guest'" :visible="!!editingAccount" :initial-data="editingAccount"
      @close="editingAccount = null" @submit="saveAccount" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AdminPopup from '../AdminPopup.vue';
const api = useApi();
const emit = defineEmits(['updated']);
const editingAccount = ref(null);

const props = defineProps({
  accountsData: {
    type: Array,
    required: true,
  },
});

const activeDropdownIndex = ref(null); // To manage which row's dropdown is open

const toggleActionsDropdown = (index) => {
  if (activeDropdownIndex.value === index) {
    activeDropdownIndex.value = null; // Close if already open
  } else {
    activeDropdownIndex.value = index; // Open specific dropdown
  }
};

const editAccount = (account) => { editingAccount.value = { ...account }; };
const saveAccount = async (data) => {
  try {
    const id = editingAccount.value?.id;
    await api(`/users/${id}`, { method: 'PUT', body: { username: data.name, email: data.email, phone: data.phone === 'N/A' ? undefined : data.phone } });
    editingAccount.value = null;
    emit('updated');
  } catch (error) { alert(error.message); }
};
const deleteAccount = async (account) => {
  if (!confirm(`Are you sure you want to delete ${account.name}?`)) return;
  try { await api(`/users/${account.id}`, { method: 'DELETE' }); emit('updated'); }
  catch (error) { alert(error.message); }
};
</script>

<style scoped>
/* No specific styles needed */
</style>
