// middleware/auth-admin.js
import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useApi } from '~/composables/useApi'; // Assuming useApi is accessible in middleware

export default defineNuxtRouteMiddleware(async (to, from) => {
  // ตรวจสอบว่าโค้ดนี้รันฝั่ง client เท่านั้น
  // Middleware ควรทำงานฝั่ง client เพื่อเข้าถึง localStorage และทำการ redirect ได้
  if (process.client) {
    const token = localStorage.getItem('token');
    
    // 1. ถ้าไม่มี token (ผู้ใช้ไม่ได้ล็อกอิน) ให้ redirect ไปหน้า login
    if (!token) {
      console.warn('Auth-admin middleware: No token found, redirecting to login.');
      return navigateTo('/login');
    }

    try {
      const api = useApi();
      // 2. เรียก Backend Endpoint /auth/verify เพื่อตรวจสอบ token และดึงข้อมูลผู้ใช้ (รวมถึง role)
      // Backend ของคุณมี /auth/verify ที่ส่ง user.role กลับมา
      const response = await api('/auth/verify', { method: 'GET' });

      // 3. ตรวจสอบว่า user object และ role มีอยู่ และ user.role เป็น 'admin'
      if (response && response.user && response.user.role === 'admin') {
        console.log('Auth-admin middleware: Admin user verified. User ID:', response.user.id);
        // ถ้าเป็น Admin ให้ดำเนินการต่อไปยังหน้า Admin (ไม่ต้องทำอะไรใน middleware นี้อีก)
      } else {
        // 4. ถ้าไม่ใช่ Admin หรือการยืนยันล้มเหลว ให้ redirect ไปหน้าอื่น
        console.warn('Auth-admin middleware: User is not admin or verification failed, redirecting to main page.');
        // ลบ token ออกจาก localStorage เพื่อป้องกันการใช้ token ที่ไม่มีสิทธิ์
        localStorage.removeItem('token'); 
        // Redirect ไปยังหน้าหลัก (เช่น หน้า booking หรือหน้า landing page ที่ไม่ใช่ Admin)
        return navigateTo('/'); 
      }
    } catch (error) {
      // 5. หากเกิดข้อผิดพลาดในการเรียก API หรือตรวจสอบ token (เช่น token หมดอายุ/ไม่ถูกต้อง)
      console.error('Auth-admin middleware: Error during token verification:', error);
      // ลบ token ออกจาก localStorage และ redirect ไปหน้า login
      localStorage.removeItem('token');
      return navigateTo('/login');
    }
  }
});