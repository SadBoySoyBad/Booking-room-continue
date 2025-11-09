// front/middleware/auth.js
export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.client) {
    const config = useRuntimeConfig();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${config.public.apiBaseURL}/auth/myinfo`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token || ''}`
        }
      });

      if (!res.ok) {
        return navigateTo('/login');
      }
    } catch (err) {
      return navigateTo('/login');
    }
  }
});
