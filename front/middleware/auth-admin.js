export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return;
  const { user, fetchUser } = useAuth();
  await fetchUser();
  if (!user.value) return navigateTo('/login');
  if (user.value.role !== 'admin') return navigateTo('/');
});
