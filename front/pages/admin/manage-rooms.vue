<template>
  <div class="p-2 sm:p-4 lg:p-6 w-full h-full">
    <div class="bg-white p-4 rounded-lg shadow-md mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Manage Rooms</h2>
        <button
          class="bg-[#3C3F9D] text-white px-4 py-2 rounded-full hover:bg-[#526AA8] transition-colors text-sm font-semibold"
          @click="openAddRoomModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      <div v-if="loadingRooms" class="text-center text-gray-500 py-8">Loading rooms...</div>
      <div v-else-if="errorRooms" class="text-center text-red-500 py-8">Error loading rooms: {{ errorRooms }}</div>
      <div v-else>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Meeting Room
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                Active
              </th>
              <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manage
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="room in rooms" :key="room.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ room.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getRoomStatusClass(room.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ room.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <label class="inline-flex relative items-center cursor-pointer">
                  <input type="checkbox" :checked="room.status !== 'MAINTENANCE'" class="sr-only peer" @change="toggleRoomStatus(room)">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                <button @click="openEditRoomModal(room)" class="text-yellow-600 hover:text-yellow-900 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button @click="deleteRoom(room.id)" class="text-red-600 hover:text-red-900">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="rooms.length === 0 && !loadingRooms" class="text-center text-gray-500 mt-4">No rooms found.</div>
      </div>
    </div>

    <AdminPopup :visible="showAddRoomModal" title="Add New Room" confirm-button-text="Add Room" @close="showAddRoomModal = false" @submit="handleAddRoom" type="custom-room-form">
      <div class="p-4">
        <div class="mb-4">
          <label for="newRoomName" class="block text-gray-700 text-sm font-bold mb-2">Room Name:</label>
          <input type="text" id="newRoomName" v-model="newRoom.name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>
        <div class="mb-4">
          <label for="newRoomStatus" class="block text-gray-700 text-sm font-bold mb-2">Status:</label>
          <select id="newRoomStatus" v-model="newRoom.status" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>
      </div>
    </AdminPopup>

    <AdminPopup :visible="showEditRoomModal" title="Edit Room" confirm-button-text="Save Changes" @close="showEditRoomModal = false" @submit="handleEditRoom" type="custom-room-form">
      <div class="p-4">
        <div class="mb-4">
          <label for="editRoomName" class="block text-gray-700 text-sm font-bold mb-2">Room Name:</label>
          <input type="text" id="editRoomName" v-model="editingRoom.name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>
        <div class="mb-4">
          <label for="editRoomStatus" class="block text-gray-700 text-sm font-bold mb-2">Status:</label>
          <select id="editRoomStatus" v-model="editingRoom.status" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>
      </div>
    </AdminPopup>

    <AdminPopup :visible="showDeleteConfirmationModal" title="Confirm Delete" confirmation-message="Are you sure you want to delete this room? This action cannot be undone." type="confirm" @close="cancelDelete" @confirm="confirmDelete" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';
import AdminPopup from "~/components/AdminPopup.vue";

const api = useApi();

// definePageMeta({ layout: 'admin-layout', middleware: ['auth-admin'] }); // เพิ่ม middleware
definePageMeta({ layout: 'admin-layout'}); 
useHead({ title: "Manage Rooms Admin" });

const rooms = ref([]);
const loadingRooms = ref(true);
const errorRooms = ref(null);

const showAddRoomModal = ref(false);
const showEditRoomModal = ref(false);
const showDeleteConfirmationModal = ref(false);

const newRoom = ref({ name: '', status: 'AVAILABLE' });
const editingRoom = ref(null);
const roomToDeleteId = ref(null);

const fetchRooms = async () => {
  loadingRooms.value = true;
  errorRooms.value = null;
  try {
    const response = await api('/rooms');
    if (response) rooms.value = response;
  } catch (error) {
    errorRooms.value = error.message;
  } finally {
    loadingRooms.value = false;
  }
};

const openAddRoomModal = () => {
  newRoom.value = { name: '', status: 'AVAILABLE' };
  showAddRoomModal.value = true;
};

const handleAddRoom = async () => {
  if (!newRoom.value.name) return alert('Room name is required.');
  try {
    const res = await api('/rooms', { method: 'POST', body: newRoom.value });
    if (res.room) {
      await fetchRooms();
      showAddRoomModal.value = false;
    } else if (res.message) alert(`Error: ${res.message}`);
  } catch (e) {
    alert(`Failed to add room: ${e.message || 'Unknown error'}`);
  }
};

const openEditRoomModal = (room) => {
  editingRoom.value = { ...room };
  showEditRoomModal.value = true;
};

const handleEditRoom = async () => {
  if (!editingRoom.value.name) return alert('Room name is required.');
  try {
    const res = await api(`/rooms/${editingRoom.value.id}`, {
      method: 'PUT',
      body: { name: editingRoom.value.name, status: editingRoom.value.status }
    });
    if (res.message) {
      await fetchRooms();
      showEditRoomModal.value = false;
    } else if (res.message) alert(`Error: ${res.message}`);
  } catch (e) {
    alert(`Failed to update room: ${e.message || 'Unknown error'}`);
  }
};

const deleteRoom = (id) => {
  roomToDeleteId.value = id;
  showDeleteConfirmationModal.value = true;
};

const confirmDelete = async () => {
  try {
    const res = await api(`/rooms/${roomToDeleteId.value}`, { method: 'DELETE' });
    if (res.message) await fetchRooms();
  } catch (e) {
    alert(`Failed to delete room: ${e.message || 'Unknown error'}`);
  } finally {
    showDeleteConfirmationModal.value = false;
    roomToDeleteId.value = null;
  }
};

const cancelDelete = () => {
  showDeleteConfirmationModal.value = false;
  roomToDeleteId.value = null;
};

const getRoomStatusClass = (status) => {
  return status === 'AVAILABLE' ? 'bg-green-100 text-green-800'
    : status === 'OCCUPIED' ? 'bg-yellow-100 text-yellow-800'
    : status === 'MAINTENANCE' ? 'bg-red-100 text-red-800'
    : 'bg-gray-100 text-gray-800';
};

const toggleRoomStatus = async (room) => {
  const newStatus = room.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
  try {
    const res = await api(`/rooms/${room.id}`, { method: 'PUT', body: { status: newStatus } });
    if (res.message) await fetchRooms();
  } catch (e) {
    alert(`Failed to update room status: ${e.message || 'Unknown error'}`);
  }
};

onMounted(() => import.meta.client && fetchRooms());
</script>

<style scoped>
/* No additional styles */
</style>
