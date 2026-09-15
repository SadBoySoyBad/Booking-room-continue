import { proxyRequest, type H3Event } from 'h3'

export const forwardToBackend = (event: H3Event, backendURL: string) => {
  const target = `${backendURL.replace(/\/$/, '')}${event.path}`
  // OAuth redirects belong to the browser: following them here loses the state
  // cookies and can forward application cookies to the identity provider.
  return proxyRequest(event, target, { fetchOptions: { redirect: 'manual' } })
}
