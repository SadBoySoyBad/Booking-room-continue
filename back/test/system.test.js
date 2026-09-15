const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Always use a unique database on an explicitly local replica set.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'local-integration-test-secret-only';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27018/?directConnection=true&replicaSet=rs0';
process.env.MONGODB_DB = `booking_test_${process.pid}_${Date.now()}`;
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.GOOGLE_CALENDAR_ENABLED = 'false';
const app = require('../app');
const db = require('../db');
const User = require('../models/User');
let admin, guest, other, room, booking;
const bearer = (user) => `Bearer ${jwt.sign({ id: user.id }, process.env.JWT_SECRET)}`;
const payload = (extra = {}) => ({ room_id: room.id, topic: 'System integration meeting',
  start_time: '2099-01-02T10:00:00+07:00', end_time: '2099-01-02T11:00:00+07:00',
  guest_name: 'Test guest', guest_email: 'guest@example.test',
  participants_emails: ['participant@example.test'], requirements: ['Projector'], ...extra });

before(async () => {
  await db.initializeDatabase();
  admin = await User.create('Test Admin', 'admin@example.test', 'test-password', 'admin', '0811111111');
  other = await User.createGuest('Other Guest', '0822222222');
  room = (await request(app).get('/api/rooms').expect(200)).body[0];
});
after(async () => {
  if (db.connection.name === process.env.MONGODB_DB && db.connection.name.startsWith('booking_test_')) await db.connection.dropDatabase();
  await db.disconnect();
});

test('fresh/repeated guest login returns a stable ID; secrets stay private', async () => {
  const body = { name: 'Test Guest', phone: '0833333333', company: 'Test' };
  const first = await request(app).post('/api/users/guest-login').send(body).expect(200);
  const repeat = await request(app).post('/api/users/guest-login').send(body).expect(200);
  guest = repeat.body.user;
  assert.match(guest.id, /^[a-f0-9]{24}$/);
  assert.equal(first.body.user.id, guest.id);
  const me = await request(app).get('/api/auth/myinfo').set('Authorization', bearer(admin)).expect(200);
  assert.equal(me.body.user.password, undefined);
  assert.equal(me.body.user.google_access_token, undefined);
});
test('guest cannot impersonate employee/admin, and mock Microsoft login is rejected', async () => {
  await request(app).post('/api/users/guest-login').send({ name: 'Attacker', phone: admin.phone }).expect(403);
  await request(app).post('/api/users/employee-login').send({ name: 'Fake', email: admin.email, provider: 'microsoft' }).expect(400);
  await request(app).get('/api/users').set('Authorization', bearer(guest)).expect(403);
  await request(app).get('/api/bookings').expect(401);
  await request(app).get('/api/bookings/guest-history?email=a&phone=b').expect(401);
});
test('cookie authentication works without a localStorage bearer token', async () => {
  await request(app).get('/api/auth/myinfo').set('Cookie', `auth_token=${bearer(admin).slice(7)}`).expect(200);
  const logout = await request(app).post('/api/auth/logout').expect(200);
  assert.ok(logout.headers['set-cookie'].some(v => v.startsWith('auth_token=;')));
});
test('room IDs are usable, malformed inputs return 400, updates are idempotent', async () => {
  assert.match(room.id, /^[a-f0-9]{24}$/);
  await request(app).get('/api/rooms/invalid').expect(400);
  await request(app).get('/api/rooms?date=2026-02-30').expect(400);
  await request(app).put(`/api/rooms/${room.id}`).set('Authorization', bearer(admin)).send({ status: 'AVAILABLE' }).expect(200);
  await request(app).put(`/api/rooms/${room.id}`).set('Authorization', bearer(admin)).send({ status: 'INVALID' }).expect(400);
});
test('booking validates dates and participant arrays', async () => {
  for (const bad of [{ start_time: 'garbage' }, { end_time: '2099-01-02T09:00:00+07:00' },
    { participants_emails: 'wrong' }, { guest_email: 'invalid' }, { room_id: 'invalid' },
    { start_time: '2099-02-30T10:00:00+07:00', end_time: '2099-03-03T10:00:00+07:00' },
    { start_time: '01/02/2099Z' }, { start_time: '2099-01-02T24:00:00Z' }]) {
    await request(app).post('/api/bookings').set('Authorization', bearer(guest)).send(payload(bad)).expect(400);
  }
});
test('concurrent overlapping bookings: exactly one commits and participants survive', async () => {
  const responses = await Promise.all(Array.from({ length: 8 }, () =>
    request(app).post('/api/bookings').set('Authorization', bearer(guest)).send(payload())));
  assert.equal(responses.filter(r => r.status === 201).length, 1, JSON.stringify(responses.map(r => r.body)));
  assert.equal(responses.filter(r => r.status === 409).length, 7);
  booking = responses.find(r => r.status === 201).body.booking;
  assert.equal(booking.user_id, guest.id);
  assert.deepEqual(booking.participants_emails, ['participant@example.test']);
});
test('history, room names, notifications and daily privacy use the authenticated owner', async () => {
  const history = await request(app).get('/api/bookings/my-history').set('Authorization', bearer(guest)).expect(200);
  assert.equal(history.body[0].room_name, room.name);
  assert.equal(history.body[0].id, booking.id);
  const daily = await request(app).get('/api/bookings/daily/2099-01-02').set('Authorization', bearer(other)).expect(200);
  assert.equal(daily.body[0].guest_name, undefined);
  const own = await request(app).get('/api/bookings/daily/2099-01-02').set('Authorization', bearer(guest)).expect(200);
  assert.equal(own.body[0].guest_name, 'Test guest');
  const notifications = await request(app).get('/api/bookings/notifications').set('Authorization', bearer(guest)).expect(200);
  assert.equal(notifications.body[0].booking_id, booking.id);
  const empty = await request(app).get('/api/bookings/notifications').set('Authorization', bearer(other)).expect(200);
  assert.deepEqual(empty.body, []);
});
test('approval is repeatable; cancellation releases time, reactivation checks conflicts', async () => {
  const status = (value) => request(app).put(`/api/bookings/${booking.id}/status`).set('Authorization', bearer(admin)).send({ status: value });
  await status('APPROVED').expect(200);
  await status('APPROVED').expect(200);
  await status('CANCELED').expect(200);
  await request(app).post('/api/bookings').set('Authorization', bearer(other)).send(payload()).expect(201);
  await status('APPROVED').expect(409);
  await request(app).delete(`/api/rooms/${room.id}`).set('Authorization', bearer(admin)).expect(409);
});
test('adjacent bookings are permitted; Bangkok day boundaries include midnight correctly', async () => {
  await request(app).post('/api/bookings').set('Authorization', bearer(guest)).send(payload({
    start_time: '2099-01-02T11:00:00+07:00', end_time: '2099-01-02T12:00:00+07:00',
  })).expect(201);
  await request(app).post('/api/bookings').set('Authorization', bearer(guest)).send(payload({
    start_time: '2099-01-03T00:00:00+07:00', end_time: '2099-01-03T01:00:00+07:00',
  })).expect(201);
  const day = await request(app).get('/api/bookings/daily/2099-01-03').set('Authorization', bearer(admin)).expect(200);
  assert.equal(day.body.length, 1);
});
test('admin accounts/settings/analytics endpoints are connected and persist data', async () => {
  await request(app).get('/api/users?page=invalid').set('Authorization', bearer(admin)).expect(400);
  await request(app).post('/api/users').set('Authorization', bearer(admin)).send({ username: 'Second Admin', email: 'second@example.test', role: 'admin' }).expect(201);
  await request(app).post('/api/users').set('Authorization', bearer(admin)).send({ username: 'Third Admin', email: 'third@example.test', role: 'admin' }).expect(201);
  const settings = { email_meeting_booked: 1, email_reminders: 1, reminder_minutes: 15, auto_add_calendar: 0, update_calendar: 1 };
  await request(app).put('/api/users/settings').set('Authorization', bearer(admin)).send(settings).expect(200);
  const saved = await request(app).get('/api/users/settings').set('Authorization', bearer(admin)).expect(200);
  assert.equal(saved.body.reminder_minutes, 15);
  const analytics = await request(app).get('/api/analytics/summary').set('Authorization', bearer(admin)).expect(200);
  assert.ok(analytics.body.totalReservations >= 4);
});
test('CORS rejects arbitrary Vercel origins and OAuth rejects missing state', async () => {
  await request(app).get('/api/healthz').set('Origin', 'https://attacker.vercel.app').expect(403);
  await request(app).get('/api/auth/google/callback').expect(400);
  await request(app).get('/api/readyz').expect(200);
});

test('public room status never exposes another user’s current meeting details', async () => {
  await db.models.Booking.create({ room_id: room.id, user_id: guest.id, topic: 'Private current meeting',
    guest_name: 'Private Name', guest_email: 'private@example.test',
    start_time: new Date(Date.now() - 60000), end_time: new Date(Date.now() + 60000) });
  const publicRooms = await request(app).get('/api/rooms').expect(200);
  const publicRoom = publicRooms.body.find(r => r.id === room.id);
  assert.equal(publicRoom.current_booking.topic, undefined);
  assert.equal(publicRoom.current_booking.guest_name, undefined);
  const adminRooms = await request(app).get('/api/rooms').set('Authorization', bearer(admin)).expect(200);
  assert.equal(adminRooms.body.find(r => r.id === room.id).current_booking.topic, 'Private current meeting');
});

test('display names can repeat and optional OAuth fields do not collide', async () => {
  const a = await User.createGuest('Same Display Name', '0844444444');
  const b = await User.createGuest('Same Display Name', '0855555555');
  assert.notEqual(a.id, b.id);
  await User.updateGoogleAuth(a.id, 'google-test-id', 'test-access', 'test-refresh', new Date());
  await User.updateGoogleAuth(a.id, null, 'next-access', null, new Date());
  const stored = await User.getById(a.id);
  assert.equal(stored.google_id, 'google-test-id');
  assert.equal(stored.google_refresh_token, 'test-refresh');
});

test('calendar adapter accepts Mongo arrays and stores event ID without a real provider call', async (t) => {
  const { google } = require('googleapis');
  let sent;
  t.mock.method(google, 'calendar', () => ({ events: { insert: async (args) => {
    sent = args; return { data: { id: 'test-calendar-event', htmlLink: 'https://example.test/event' } };
  } } }));
  await User.updateGoogleAuth(guest.id, 'google-guest-test', 'local-fake-access', 'local-fake-refresh', new Date(Date.now() + 3600000));
  await require('../services/calendarService').createGoogleCalendarEvent(guest.id, { ...booking, room_name: room.name });
  assert.equal(sent.resource.attendees.length, 2);
  assert.ok(sent.resource.description.includes('Projector'));
  const saved = await require('../models/Booking').getById(booking.id);
  assert.equal(saved.google_event_id, 'test-calendar-event');
});
