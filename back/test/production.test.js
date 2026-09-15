const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const request = require('supertest');

// Exercise production cookies/Passport with synthetic identities on a local DB.
// Provider network calls are mocked; this does not certify real provider setup.
Object.assign(process.env, {
  NODE_ENV: 'production', JWT_SECRET: 'production-mode-test-secret-only',
  MONGODB_URI: 'mongodb://127.0.0.1:27018/?directConnection=true&replicaSet=rs0',
  MONGODB_DB: `booking_test_production_${process.pid}_${Date.now()}`,
  FRONTEND_URL: 'https://booking.example.test', COOKIE_DOMAIN: '',
  GOOGLE_CLIENT_ID: 'test-google-client', GOOGLE_CLIENT_SECRET: 'test-google-secret',
  GOOGLE_REDIRECT_URI: 'https://booking.example.test/api/auth/google/callback',
  MICROSOFT_CLIENT_ID: 'test-microsoft-client', MICROSOFT_CLIENT_SECRET: 'test-microsoft-secret',
  MICROSOFT_REDIRECT_URI: 'https://booking.example.test/api/auth/microsoft/callback',
  GOOGLE_CALENDAR_ENABLED: 'false',
});
const app = require('../app');
const db = require('../db');
const User = require('../models/User');
const passport = require('passport');
const secure = (req) => req.set('X-Forwarded-Proto', 'https');
const cookieHeader = response => response.headers['set-cookie'].map(value => value.split(';')[0]).join('; ');

before(async () => {
  await db.initializeDatabase();
  for (const model of Object.values(db.models)) await model.createIndexes();
});
after(async () => {
  if (db.connection.name === process.env.MONGODB_DB && db.connection.name.startsWith('booking_test_production_')) await db.connection.dropDatabase();
  await db.disconnect();
});

test('serverless export boots without Mongo config; liveness works and data routes return 503', () => {
  const child = spawnSync(process.execPath, ['-e', `
    const app = require('./app');
    const request = require('supertest');
    (async () => {
      const health = await request(app).get('/api/healthz');
      const ready = await request(app).get('/api/readyz');
      const rooms = await request(app).get('/api/rooms');
      process.stdout.write(JSON.stringify([health.status, ready.status, rooms.status]));
    })().catch(() => { process.exitCode = 1; });
  `], { cwd: path.join(__dirname, '..'), env: { ...process.env, MONGODB_URI: '' },
    encoding: 'utf8', timeout: 15000 });
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), [200, 503, 503]);
});

test('production guest cookie is secure, usable without bearer, and cleared at logout', async () => {
  const login = await secure(request(app).post('/api/auth/guest-login'))
    .send({ name: 'Production Test Guest', phone: '0861112222' }).expect(200);
  const tokenCookie = login.headers['set-cookie'].find(value => value.startsWith('auth_token='));
  for (const attribute of ['HttpOnly', 'Secure', 'SameSite=None', 'Path=/']) assert.ok(tokenCookie.includes(attribute));
  assert.ok(!tokenCookie.includes('Domain='));
  const me = await secure(request(app).get('/api/auth/myinfo')).set('Cookie', cookieHeader(login)).expect(200);
  assert.equal(me.body.user.id, login.body.user.id);
  const logout = await secure(request(app).post('/api/auth/logout')).set('Cookie', cookieHeader(login)).expect(200);
  assert.ok(logout.headers['set-cookie'].some(value => value.startsWith('auth_token=;') && value.includes('Secure')));
});

for (const provider of ['google', 'microsoft']) {
  test(`${provider} production OAuth preserves state, existing admin role and HttpOnly session`, async (t) => {
    const existing = await User.create(`${provider} Admin`, `${provider}-admin@example.test`, null, 'admin');
    const strategy = passport._strategy(provider);
    t.mock.method(strategy._oauth2, 'getOAuthAccessToken', (code, params, done) => {
      assert.equal(code, 'local-provider-code');
      assert.equal(params.redirect_uri, `https://booking.example.test/api/auth/${provider}/callback`);
      done(null, 'fake-access', 'fake-refresh', { expires_in: 3600 });
    });
    t.mock.method(strategy, 'userProfile', (accessToken, done) => done(null, {
      id: `${provider}-test-subject`, displayName: `${provider} Person`,
      emails: [{ value: existing.email }], _json: { email_verified: true },
    }));
    const start = await secure(request(app).get(`/api/auth/${provider}`)).expect(302);
    const state = new URL(start.headers.location).searchParams.get('state');
    assert.match(state, /^[a-f0-9]{64}$/);
    assert.equal(start.headers['set-cookie'].length, 2);
    const callback = await secure(request(app).get(`/api/auth/${provider}/callback`))
      .query({ state, code: 'local-provider-code' }).set('Cookie', cookieHeader(start)).expect(302);
    assert.equal(callback.headers.location, 'https://booking.example.test/booking');
    const me = await secure(request(app).get('/api/auth/myinfo')).set('Cookie', cookieHeader(callback)).expect(200);
    assert.equal(me.body.user.id, existing.id);
    assert.equal(me.body.user.role, 'admin');
    assert.equal(me.body.user[`${provider}_access_token`], undefined);
    const saved = await User.getById(existing.id);
    assert.equal(saved[`${provider}_id`], `${provider}-test-subject`);
    assert.ok(new Date(saved[`${provider}_token_expiry`]).getTime() > Date.now() + 3500000);
  });
}

test('OAuth denies mismatched state and provider before exchanging any authorization code', async (t) => {
  let exchanges = 0;
  t.mock.method(passport._strategy('google')._oauth2, 'getOAuthAccessToken', () => { exchanges++; });
  const start = await secure(request(app).get('/api/auth/google')).expect(302);
  const state = new URL(start.headers.location).searchParams.get('state');
  await secure(request(app).get('/api/auth/google/callback')).query({ state: 'wrong', code: 'test' })
    .set('Cookie', cookieHeader(start)).expect(400);
  await secure(request(app).get('/api/auth/microsoft/callback')).query({ state, code: 'test' })
    .set('Cookie', cookieHeader(start)).expect(400);
  assert.equal(exchanges, 0);
});

test('Google refuses an unverified email instead of linking it to an admin account', async (t) => {
  const strategy = passport._strategy('google');
  t.mock.method(strategy._oauth2, 'getOAuthAccessToken', (code, params, done) => done(null, 'fake', null, {}));
  t.mock.method(strategy, 'userProfile', (token, done) => done(null, {
    id: 'unverified-subject', emails: [{ value: 'google-admin@example.test' }], _json: { email_verified: false },
  }));
  const start = await secure(request(app).get('/api/auth/google')).expect(302);
  const state = new URL(start.headers.location).searchParams.get('state');
  const callback = await secure(request(app).get('/api/auth/google/callback')).query({ state, code: 'test' })
    .set('Cookie', cookieHeader(start)).expect(302);
  assert.equal(callback.headers.location, 'https://booking.example.test/login?error=auth_failed');
  assert.ok(!callback.headers['set-cookie'].some(value => value.startsWith('auth_token=')));
  assert.equal(await User.findByGoogleId('unverified-subject'), null);
});
