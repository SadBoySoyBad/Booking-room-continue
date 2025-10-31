<!-- <template>
  <div class="p-2 sm:p-4 lg:p-6 w-full h-full">
    <div class="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 class="text-2xl font-bold mb-6">Settings</h2>

      <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Notification Preferences</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label for="emailMeetingBooked" class="text-gray-700 text-base w-full flex-grow flex items-center">Email me when a meeting is booked.</label>
            <div class="custom-toggle-container relative inline-block w-10 h-6 select-none transition duration-200 ease-in">
              <input type="checkbox" v-model="settings.emailMeetingBooked" id="emailMeetingBooked"
                     class="custom-toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
              <label for="emailMeetingBooked" class="custom-toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <label for="emailReminders" class="text-gray-700 text-base w-full flex-grow mr-4 flex items-center">
              Email me reminders
              <input 
                type="number" 
                v-model="settings.reminderMinutes" 
                id="reminderMinutes" 
                class="w-16 px-2 py-1 border border-gray-300 rounded-md text-center mx-2 text-sm"
                min="0"
              >
              minutes before meetings.
            </label>
            <div class="custom-toggle-container relative inline-block w-10 h-6 select-none transition duration-200 ease-in">
              <input type="checkbox" v-model="settings.emailReminders" id="emailReminders"
                     class="custom-toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
              <label for="emailReminders" class="custom-toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Calendar Sync</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label for="autoAddCalendar" class="text-gray-700 text-base w-full flex-grow flex items-center">Automatically add meetings to my calendar.</label>
            <div class="custom-toggle-container relative inline-block w-10 h-6 select-none transition duration-200 ease-in">
              <input type="checkbox" v-model="settings.autoAddCalendar" id="autoAddCalendar"
                     class="custom-toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
              <label for="autoAddCalendar" class="custom-toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <label for="updateCalendar" class="text-gray-700 text-base w-full flex-grow flex items-center">Update calendar if meeting changes.</label>
            <div class="custom-toggle-container relative inline-block w-10 h-6 select-none transition duration-200 ease-in">
              <input type="checkbox" v-model="settings.updateCalendar" id="updateCalendar"
                     class="custom-toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
              <label for="updateCalendar" class="custom-toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

definePageMeta({ layout: 'admin-layout' });
useHead({ title: "Settings Admin" });

const settings = ref({
  emailMeetingBooked: true,
  emailReminders: false,
  reminderMinutes: 30,
  autoAddCalendar: true,
  updateCalendar: true,
});
</script>

<style scoped>
/* Custom styles for the Toggle Switch */

/* Container for the toggle switch */
.custom-toggle-container {
  /* No additional styles needed here beyond Tailwind's w-10 h-6, relative, etc. */
}

/* The actual checkbox (the movable knob) */
.custom-toggle-checkbox {
  left: 0; /* Initial position: start of the track */
  top: 0; /* Align to top of track */
  border-color: #E2E8F0; /* Default border color for off state (gray-200) */
  transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

/* The track (the background bar) */
.custom-toggle-label {
  background-color: #CBD5E0; /* Default track color for off state (gray-300) */
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

/* Checked state for the knob */
.custom-toggle-checkbox:checked {
  transform: translateX(1rem); /* Move knob by 10 (w-10 for container - w-6 for knob = 4, so move by 4+6 = 10px or 1rem) */
  border-color: #A78BFA; /* Active border color (purple-400) */
  background-color: #FFFFFF; /* Knob color when active */
}

/* Checked state for the track */
.custom-toggle-checkbox:checked + .custom-toggle-label {
  background-color: #8B5CF6; /* Active track color (purple-500) */
}

/* Ensure appearance-none is applied effectively */
.custom-toggle-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.5); /* Focus ring */
}
</style> -->

<template>
  <div class="p-2 sm:p-4 lg:p-6 w-full h-full">
    <div class="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 class="text-2xl font-bold mb-6">Settings</h2>

      <div v-if="loadingSettings" class="text-center text-gray-500 py-8">Loading settings...</div>
      <div v-else-if="errorSettings" class="text-center text-red-500 py-8">Error loading settings: {{ errorSettings }}</div>
      <div v-else>
        <div class="mb-8">
          <h3 class="text-xl font-semibold mb-4">Notification Preferences</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <label for="emailMeetingBooked" class="text-gray-700 text-base w-full flex-grow flex items-center">Email me when a meeting is booked.</label>
              <div class="custom-toggle-container relative inline-block w-10 h-6 select-none transition duration-200 ease-in">
                <input type="checkbox" v-model="settings.emailMeetingBooked" id="emailMeetingBooked"
                       class="custom-toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                       @change="saveSettings" /> <label for="emailMeetingBooked" class="custom-toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label for="emailReminders" class="text-gray-700 text-base w-full flex-grow mr-4 flex items-center">
                Email me reminders
                <input 
                  type="number" 
                  v-model="settings.reminderMinutes" 
                  id="reminderMinutes" 
                  class="w-16 px-2 py-1 border border-gray-300 rounded-md text-center mx-2 text-sm"
                  min="0"
                  @change="saveSettings" @input="saveSettings" /> minutes before meetings.
              </label>
              <div class="custom-toggle-container relative inline-block w-10 h-6 select-none transition duration-200 ease-in">
                <input type="checkbox" v-model="settings.emailReminders" id="emailReminders"
                       class="custom-toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                       @change="saveSettings" /> <label for="emailReminders" class="custom-toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-xl font-semibold mb-4">Calendar Sync</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <label for="autoAddCalendar" class="text-gray-700 text-base w-full flex-grow flex items-center">Automatically add meetings to my calendar.</label>
              <div class="custom-toggle-container relative inline-block w-10 h-6 select-none transition duration-200 ease-in">
                <input type="checkbox" v-model="settings.autoAddCalendar" id="autoAddCalendar"
                       class="custom-toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                       @change="saveSettings" /> <label for="autoAddCalendar" class="custom-toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label for="updateCalendar" class="text-gray-700 text-base w-full flex-grow flex items-center">Update calendar if meeting changes.</label>
              <div class="custom-toggle-container relative inline-block w-10 h-6 select-none transition duration-200 ease-in">
                <input type="checkbox" v-model="settings.updateCalendar" id="updateCalendar"
                       class="custom-toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                       @change="saveSettings" /> <label for="updateCalendar" class="custom-toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';

const api = useApi();

// definePageMeta({ layout: 'admin-layout', middleware: ['auth-admin'] }); // เพิ่ม middleware
definePageMeta({ layout: 'admin-layout'}); 

useHead({ title: "Settings Admin" });

const settings = ref({
  emailMeetingBooked: true,
  emailReminders: false,
  reminderMinutes: 30,
  autoAddCalendar: true,
  updateCalendar: true,
});

const loadingSettings = ref(true);
const errorSettings = ref(null);

// ฟังก์ชันสำหรับดึง Settings จาก Backend
const fetchSettings = async () => {
  loadingSettings.value = true;
  errorSettings.value = null;
  try {
    // สมมติว่ามี Endpoint สำหรับดึง settings ของ user ที่ล็อกอินอยู่: /api/users/settings หรือ /api/settings/me
    const response = await api('/users/settings'); 
    if (response) {
      settings.value = {
        emailMeetingBooked: response.email_meeting_booked === 1, // แปลง tinyint(1) เป็น boolean
        emailReminders: response.email_reminders === 1,
        reminderMinutes: response.reminder_minutes || 30,
        autoAddCalendar: response.auto_add_calendar === 1,
        updateCalendar: response.update_calendar === 1,
      };
      console.log('Fetched settings:', settings.value);
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    errorSettings.value = error.message;
  } finally {
    loadingSettings.value = false;
  }
};

// ฟังก์ชันสำหรับบันทึก Settings ไปยัง Backend
const saveSettings = async () => {
  try {
    // สมมติว่ามี Endpoint สำหรับอัปเดต settings ของ user ที่ล็อกอินอยู่: PUT /api/users/settings
    const response = await api('/users/settings', {
      method: 'PUT',
      body: {
        email_meeting_booked: settings.value.emailMeetingBooked ? 1 : 0, // แปลง boolean เป็น tinyint(1)
        email_reminders: settings.value.emailReminders ? 1 : 0,
        reminder_minutes: settings.value.reminderMinutes,
        auto_add_calendar: settings.value.autoAddCalendar ? 1 : 0,
        update_calendar: settings.value.updateCalendar ? 1 : 0,
      }
    });
    if (response && response.message) {
      console.log('Settings saved:', response.message);
      // อาจจะแสดง notification ให้ผู้ใช้ทราบว่าบันทึกสำเร็จ
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    // อาจจะแสดง error message ให้ผู้ใช้ทราบ
  }
};

onMounted(() => {
  if (import.meta.client) {
    fetchSettings();
  }
});
</script>

<style scoped>
/* Custom styles for the Toggle Switch (คงเดิม) */
/* Container for the toggle switch */
.custom-toggle-container {
  /* No additional styles needed here beyond Tailwind's w-10 h-6, relative, etc. */
}

/* The actual checkbox (the movable knob) */
.custom-toggle-checkbox {
  left: 0; /* Initial position: start of the track */
  top: 0; /* Align to top of track */
  border-color: #E2E8F0; /* Default border color for off state (gray-200) */
  transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

/* The track (the background bar) */
.custom-toggle-label {
  background-color: #CBD5E0; /* Default track color for off state (gray-300) */
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

/* Checked state for the knob */
.custom-toggle-checkbox:checked {
  transform: translateX(1rem); /* Move knob by 10 (w-10 for container - w-6 for knob = 4, so move by 4+6 = 10px or 1rem) */
  border-color: #A78BFA; /* Active border color (purple-400) */
  background-color: #FFFFFF; /* Knob color when active */
}

/* Checked state for the track */
.custom-toggle-checkbox:checked + .custom-toggle-label {
  background-color: #8B5CF6; /* Active track color (purple-500) */
}

/* Ensure appearance-none is applied effectively */
.custom-toggle-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.5); /* Focus ring */
}
</style>