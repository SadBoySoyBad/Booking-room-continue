// composables/usePendingRequestsCount.js
import { ref, onMounted, onUnmounted } from 'vue';
import { useApi } from '~/composables/useApi';

export const usePendingRequestsCount = () => {
    const api = useApi();
    const count = useState('pendingRequestsCount', () => 0); // Global state for the count
    let interval = null; // สำหรับเก็บ id ของ setInterval

    const fetchCount = async () => {
        try {
            // Endpoint ที่ดึงเฉพาะคำขอที่รออนุมัติ
            const response = await api('/bookings?status=PENDING'); // Endpoint ที่ใช้ใน requests.vue
            if (response && Array.isArray(response)) {
                count.value = response.length; // อัปเดต global state ด้วยจำนวนคำขอที่ได้
            } else {
                count.value = 0;
            }
        } catch (error) {
            console.error('Error fetching pending requests count:', error);
            count.value = 0; // ในกรณีที่เกิด Error ก็ให้เป็น 0
        }
    };

    // ฟังก์ชันสำหรับเริ่มต้นการดึงข้อมูลและ Polling
    const startPolling = (intervalMs = 30000) => { // ดึงข้อมูลทุก 30 วินาที
        stopPolling(); // ตรวจสอบให้แน่ใจว่าไม่มี polling เก่าทำงานอยู่
        fetchCount(); // ดึงข้อมูลครั้งแรกทันที
        interval = setInterval(fetchCount, intervalMs);
    };

    // ฟังก์ชันสำหรับหยุด Polling
    const stopPolling = () => {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    };

    onMounted(() => {
        // เมื่อ Component ที่ใช้ composable นี้ถูก Mount ให้เริ่ม Polling
        startPolling();
    });

    onUnmounted(() => {
        // เมื่อ Component ถูก Unmount ให้หยุด Polling เพื่อป้องกัน memory leaks
        stopPolling();
    });

    return {
        pendingRequestsCount: count, // คืนค่า global state ให้ Component ใช้
        fetchCount // คืนฟังก์ชัน fetchCount ให้ Component เรียกใช้เองได้ (เช่น ตอน reset)
    };
};