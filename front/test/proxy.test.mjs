import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp, defineEventHandler, toNodeListener } from 'h3'
import { forwardToBackend } from '../server/utils/backendProxy.ts'

let backend, proxy, provider, base, providerBase, providerRequests = 0
const listen = async (server) => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${server.address().port}`
}

before(async () => {
  provider = createServer((req, res) => { providerRequests++; res.end('Identity provider') })
  providerBase = await listen(provider)
  backend = createServer(async (req, res) => {
    if (req.url === '/api/auth/google') {
      res.writeHead(302, {
        Location: `${providerBase}/authorize?state=test-state`,
        'Set-Cookie': ['session=test-state; Path=/; HttpOnly; Secure; SameSite=None',
          'session.sig=test-signature; Path=/; HttpOnly; Secure; SameSite=None'],
      })
      return res.end()
    }
    if (req.url === '/api/auth/google/callback?code=test-code&state=test-state') {
      res.writeHead(302, { Location: '/booking', 'Set-Cookie': [
        'auth_token=test-token; Path=/; HttpOnly; Secure; SameSite=None',
        'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      ] })
      return res.end()
    }
    let body = ''
    for await (const chunk of req) body += chunk
    res.writeHead(req.url === '/api/unavailable' ? 503 : 200, {
      'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    })
    res.end(JSON.stringify({ method: req.method, url: req.url, body,
      cookie: req.headers.cookie, authorization: req.headers.authorization,
      forwardedProto: req.headers['x-forwarded-proto'] }))
  })
  const backendBase = await listen(backend)
  const app = createApp().use(defineEventHandler(event => forwardToBackend(event, backendBase)))
  proxy = createServer(toNodeListener(app))
  base = await listen(proxy)
})

after(async () => {
  await Promise.all([proxy, backend, provider].filter(Boolean).map(server =>
    new Promise(resolve => { server.closeAllConnections(); server.close(resolve) })))
})

test('OAuth start preserves redirect and both state cookies without contacting the provider', async () => {
  const response = await fetch(`${base}/api/auth/google`, { redirect: 'manual',
    headers: { Cookie: 'auth_token=private-session' } })
  assert.equal(response.status, 302)
  assert.equal(response.headers.get('location'), `${providerBase}/authorize?state=test-state`)
  assert.equal(response.headers.getSetCookie().length, 2)
  assert.match(response.headers.getSetCookie()[0], /HttpOnly; Secure; SameSite=None/)
  assert.equal(providerRequests, 0)
})

test('OAuth callback preserves login cookie, state clearing, and booking redirect', async () => {
  const response = await fetch(`${base}/api/auth/google/callback?code=test-code&state=test-state`, { redirect: 'manual' })
  assert.equal(response.status, 302)
  assert.equal(response.headers.get('location'), '/booking')
  assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith('auth_token=test-token;')))
  assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith('session=;')))
})

test('API forwarding preserves method, query, JSON body, credentials, and HTTPS information', async () => {
  const body = JSON.stringify({ topic: 'Proxy booking', participants_emails: ['guest@example.test'] })
  const response = await fetch(`${base}/api/bookings?date=2099-01-02`, { method: 'POST', body,
    headers: { 'Content-Type': 'application/json', Cookie: 'auth_token=test-token',
      Authorization: 'Bearer test-token', 'X-Forwarded-Proto': 'https' } })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { method: 'POST', url: '/api/bookings?date=2099-01-02',
    body, cookie: 'auth_token=test-token', authorization: 'Bearer test-token', forwardedProto: 'https' })
})

test('backend unavailability remains an HTTP error through the proxy', async () => {
  const response = await fetch(`${base}/api/unavailable`)
  assert.equal(response.status, 503)
})
