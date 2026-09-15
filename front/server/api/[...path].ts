// Same-origin proxy keeps OAuth cookies available on browsers that block third-party cookies.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  return forwardToBackend(event, String(config.backendURL))
})
