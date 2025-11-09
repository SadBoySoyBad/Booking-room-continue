<template>
  <div class="flex min-h-screen bg-[#E3E9FF]"> 

    <aside
      id="admin-sidebar"  :class="[
        // Base styling (always apply)
        'bg-[#FFFFFF] text-[#000000] flex-col p-4 shadow-lg z-40 transition-transform duration-300 ease-in-out', // Sidebar background and text
        'w-64', // Fixed width for sidebar

        // --- Mobile specific display and positioning (managed by JS directly) ---
        'hidden', // Default hidden on small screens. JS will add/remove classes.
        'fixed inset-y-0 left-0', // Fixed positioning for mobile overlay
        '-translate-x-full', // Hidden state for mobile

        // --- Desktop specific styles (md breakpoint and up) ---
        // Overrides mobile hidden/fixed/transform to be always visible and static
        'md:flex md:relative md:translate-x-0 md:flex-shrink-0' // Show as flex, relative, no transform, fixed width
      ]"
    >
      <div class="flex items-center mb-8 overflow-hidden">
        <img src="/logo.png" alt="arrangemeet logo" class="h-8 w-auto mr-2 flex-shrink-0">
        <h1 class="text-xl font-bold truncate">arrangemeet.</h1>
      </div>

      <button @click="closeMobileSidebar" class="md:hidden absolute top-4 right-4 text-[#48494E] hover:text-[#FFFFFF] p-1 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <nav class="flex-grow">
        <ul>
          <li class="mb-2">
            <NuxtLink
              to="/admin/dashboard"
              class="flex items-center p-2 rounded-lg transition-colors hover:bg-[#526AA8]" 
              active-class="bg-[#526AA8] text-[#FFFFFF] border-l-4 border-[#526AA8] font-semibold -ml-4 pl-4 py-2" 
              style="margin-left: -1rem; padding-left: 1rem;"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1H11m-4 0a1 1 0 001 1h2m-4-2h4"
                />
              </svg>
              Dashboard
            </NuxtLink>
          </li>
          <li class="mb-2">
            <NuxtLink
              to="/admin/analytics"
              class="flex items-center p-2 rounded-lg transition-colors hover:bg-[#526AA8]"
              active-class="bg-[#526AA8] text-[#FFFFFF] border-l-4 border-[#526AA8] font-semibold -ml-4 pl-4 py-2"
              style="margin-left: -1rem; padding-left: 1rem;"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
              Analytics
            </NuxtLink>
          </li>
          <li class="mb-2">
            <NuxtLink
              to="/admin/requests"
              class="flex items-center p-2 rounded-lg transition-colors hover:bg-[#526AA8]"
              active-class="bg-[#526AA8] text-[#FFFFFF] border-l-4 border-[#526AA8] font-semibold -ml-4 pl-4 py-2"
              style="margin-left: -1rem; padding-left: 1rem;"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              Requests
              <span
                v-if="pendingRequestsCount > 0" 
                class="ml-auto bg-[#D2758D] text-white text-xs font-semibold px-2 py-0.5 rounded-full" >
                {{ pendingRequestsCount }}
              </span>
            </NuxtLink>
          </li>
          <li class="mb-2">
            <NuxtLink
              to="/admin/manage-accounts"
              class="flex items-center p-2 rounded-lg transition-colors hover:bg-[#526AA8]"
              active-class="bg-[#526AA8] text-[#FFFFFF] border-l-4 border-[#526AA8] font-semibold -ml-4 pl-4 py-2"
              style="margin-left: -1rem; padding-left: 1rem;"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.942 3.313.823 2.306 2.306a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.942 1.543-.823 3.313-2.306 2.306a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.942-3.313-.823-2.306-2.306a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.942-1.543.823-3.313 2.306-2.306a1.724 1.724 0 002.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Manage Accounts
            </NuxtLink>
          </li>
          <li class="mb-2">
            <NuxtLink
              to="/admin/manage-rooms" 
              class="flex items-center p-2 rounded-lg transition-colors hover:bg-[#526AA8]"
              active-class="bg-[#526AA8] text-[#FFFFFF] border-l-4 border-[#526AA8] font-semibold -ml-4 pl-4 py-2"
              style="margin-left: -1rem; padding-left: 1rem;"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Manage Rooms
            </NuxtLink>
          </li>
          <li class="mb-2">
            <NuxtLink
              to="/admin/activities"
              class="flex items-center p-2 rounded-lg transition-colors hover:bg-[#526AA8]"
              active-class="bg-[#526AA8] text-[#FFFFFF] border-l-4 border-[#526AA8] font-semibold -ml-4 pl-4 py-2"
              style="margin-left: -1rem; padding-left: 1rem;"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Activities 
            </NuxtLink>
          </li>
          <li class="mb-2">
            <NuxtLink
              to="/admin/settings"
              class="flex items-center p-2 rounded-lg transition-colors hover:bg-[#526AA8]"
              active-class="bg-[#526AA8] text-[#FFFFFF] border-l-4 border-[#526AA8] font-semibold -ml-4 pl-4 py-2"
              style="margin-left: -1rem; padding-left: 1rem;"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.942 3.313.823 2.306 2.306a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.942 1.543-.823 3.313-2.306 2.306a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.942-3.313-.823-2.306-2.306a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.942-1.543.823-3.313 2.306-2.306a1.724 1.724 0 002.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>

    <div v-if="isSidebarOpen && windowWidth < 768" @click="closeMobileSidebar" class="fixed inset-0 z-30 backdrop-blur-md"></div>

    <div class="flex-grow flex flex-col">
      <header :class="[
        'bg-[#E3E9FF] p-4 shadow-md flex items-center justify-between w-full z-20',
        {'md:fixed md:top-0 md:left-64 md:z-30 md:w-[calc(100%-16rem)]': windowWidth >= 768}
      ]">
        <button @click="openMobileSidebar" class="md:hidden text-[#48494E] hover:text-[#000000] p-2 rounded-full flex-shrink-0 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <nav class="text-lg font-bold flex-grow flex items-center space-x-1 min-w-0 overflow-hidden">
          <span class="text-[#000000] text-sm sm:text-base">Admin</span> <span class="text-[#48494E] text-sm sm:text-base"> > </span>
          <span class="text-[#526AA8] text-sm sm:text-base truncate">{{ currentBreadcrumbPageName }}</span> </nav>

        <nav class="flex items-center space-x-2 sm:space-x-4 ml-auto flex-shrink-0 flex-wrap">
          <button @click="openLetterBox" class="text-[#A9B5DF] hover:text-[#526AA8] p-2 rounded-full bg-[#FFFFFF] flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.928-3.416A2 2 0 0113 6.305V7h2V6.305a2 2 0 012.072-1.721L21 8m0 0v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8m18 0L12 15M3 8l9 7 9-7" />
            </svg>
          </button>

          <NuxtLink to="/booking" class="text-[#FFFFFF] bg-[#526AA8] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:bg-[#798ECE] transition-colors text-sm sm:text-base flex-shrink-0">
            Reservation </NuxtLink>

          <div class="relative flex-shrink-0">
            <span
              class="text-[#526AA8] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#FFFFFF] flex items-center cursor-pointer text-sm sm:text-base" @click="toggleAdminDropdown"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Admin01
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 ml-1 transition-transform duration-200"
                :class="{'rotate-180': isAdminDropdownOpen}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>

            <div v-if="isAdminDropdownOpen" class="absolute top-full right-0 mt-2 w-32 bg-[#FFFFFF] rounded-md shadow-lg z-10 overflow-hidden">
              <NuxtLink to="/admin/history" class="block w-full text-left px-4 py-2 text-[#526AA8]  hover:text-[#3C3F9D]" @click="isAdminDropdownOpen = false"> History
              </NuxtLink>
              <button @click="logout" class="block w-full text-left px-4 py-2 text-[#526AA8] hover:text-[#3C3F9D]"> Log Out
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main class="flex-grow  md:pt-16 p-4"> <div class="mx-auto max-w-screen-xl w-full h-full"> <slot></slot>
        </div>
      </main>
    </div>
  </div>

  <LetterBoxPopup
    :isVisible="isLetterBoxPopupVisible"
    @close-letter-box="isLetterBoxPopupVisible = false"
  />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from "vue-router";
import LetterBoxPopup from "~/components/LetterBoxPopup.vue";
import { usePendingRequestsCount } from '~/composables/usePendingRequestsCount';

const router = useRouter();
const route = useRoute();

const { pendingRequestsCount } = usePendingRequestsCount();

const isAdminDropdownOpen = ref(false);
const isLetterBoxPopupVisible = ref(false);
const isSidebarOpen = ref(false); // This controls mobile sidebar display state

const windowWidth = ref(0);

const toggleAdminDropdown = () => {
  isAdminDropdownOpen.value = !isAdminDropdownOpen.value;
};

const openLetterBox = () => {
  isLetterBoxPopupVisible.value = true;
};

// Functions to explicitly open/close mobile sidebar
const openMobileSidebar = () => {
  isSidebarOpen.value = true;
  const sidebarEl = document.getElementById('admin-sidebar');
  if (sidebarEl) {
    sidebarEl.classList.remove('hidden', '-translate-x-full');
    sidebarEl.classList.add('flex', 'translate-x-0');
  }
};

const closeMobileSidebar = () => {
  isSidebarOpen.value = false;
  const sidebarEl = document.getElementById('admin-sidebar');
  if (sidebarEl) {
    sidebarEl.classList.remove('flex', 'translate-x-0');
    sidebarEl.classList.add('hidden', '-translate-x-full');
  }
};

const currentBreadcrumbPageName = computed(() => {
  const pathParts = route.path.split('/');
  let lastPart = pathParts.pop();
  if (!lastPart && pathParts.length > 0) {
    lastPart = pathParts.pop();
  }
  if (lastPart) {
    lastPart = lastPart.replace(/-/g, ' ');
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  }
  return '';
});

// Client-side logic only
if (process.client) {
  const updateWindowWidth = () => {
    windowWidth.value = window.innerWidth;
    const sidebarEl = document.getElementById('admin-sidebar');
    if (!sidebarEl) return;

    if (window.innerWidth >= 768) { // Desktop view (md breakpoint and up)
      sidebarEl.classList.remove('hidden', 'fixed', 'inset-y-0', 'left-0', '-translate-x-full', 'translate-x-0');
      sidebarEl.classList.add('flex', 'relative', 'translate-x-0');
      isSidebarOpen.value = true;
    } else { // Mobile view (below md breakpoint)
      if (isSidebarOpen.value) {
        sidebarEl.classList.add('flex', 'fixed', 'inset-y-0', 'left-0', 'w-64', 'translate-x-0');
        sidebarEl.classList.remove('hidden', 'relative', '-translate-x-full');
      } else {
        sidebarEl.classList.add('hidden', 'fixed', 'inset-y-0', 'left-0', 'w-64', '-translate-x-full');
        sidebarEl.classList.remove('flex', 'relative', 'translate-x-0');
      }
    }
  };

  const handleClickOutside = (event) => {
    const adminDropdownElement = document.querySelector('.relative > span');
    if (isAdminDropdownOpen.value && adminDropdownElement && !adminDropdownElement.contains(event.target) && !event.target.closest('.absolute.top-full')) {
      isAdminDropdownOpen.value = false;
    }

    const sidebarElement = document.getElementById('admin-sidebar');
    const hamburgerButton = document.querySelector('header > button.md\\:hidden');

    if (isSidebarOpen.value && windowWidth.value < 768 && sidebarElement &&
        !sidebarElement.contains(event.target) &&
        !(hamburgerButton && hamburgerButton.contains(event.target))) {
      closeMobileSidebar();
    }
  };

  onMounted(() => {
    updateWindowWidth();
    window.addEventListener('resize', updateWindowWidth);
    document.addEventListener('click', handleClickOutside);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateWindowWidth);
    document.removeEventListener('click', handleClickOutside);
  });
}

const logout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  router.push("/");
};
</script>

<style scoped>
/* No specific styles needed here, Tailwind CSS handles layout */
</style>