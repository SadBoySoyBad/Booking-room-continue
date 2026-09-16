const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

Object.assign(process.env, {
  NODE_ENV: 'test', JWT_SECRET: 'calendar-local-test-only',
  MONGODB_URI: 'mongodb://127.0.0.1:27018/?directConnection=true&replicaSet=rs0',
  MONGODB_DB: `booking_test_calendar_${process.pid}_${Date.now()}`,
  FRONTEND_URL: 'http://localhost:3000', GOOGLE_CALENDAR_ENABLED: 'true',
});
const app = require('../app');
const db = require('../db');
const User = require('../models/User');
const Booking = require('../models/Booking');
const service = require('../services/calendarService');
const { google } = require('googleapis');
let user, room;
const bearer = () => `Bearer ${jwt.sign({ id: user.id }, process.env.JWT_SECRET)}`;
const fixture = async (extra = {}) => (await db.models.Booking.create({
  room_id: room.id, user_id: user.id, topic: 'Calendar regression',
  start_time: new Date('2099-05-01T10:00:00+07:00'), end_time: new Date('2099-05-01T11:00:00+07:00'),
  guest_name: 'Calendar QA', guest_email: user.email,
  participants_emails: [user.email.toUpperCase(), 'participant@example.test', 'participant@example.test'],
  requirements: ['Projector'], ...extra,
})).toJSON();
before(async () => {
  await db.initializeDatabase();
  user = await User.create('Calendar QA', 'calendar@example.test', null, 'admin');
  await User.updateGoogleAuth(user.id, 'calendar-test-subject', 'fake-access', 'fake-refresh', new Date(Date.now() + 3600000));
  room = (await request(app).get('/api/rooms').expect(200)).body[0];
});
after(async () => {
  if (db.connection.name === process.env.MONGODB_DB && db.connection.name.startsWith('booking_test_calendar_')) await db.connection.dropDatabase();
  await db.disconnect();
});

test('late Calendar creation uses approved status, ISO dates and unique attendees', async (t) => {
  const booking = await fixture({ status: 'APPROVED' });
  let sent;
  t.mock.method(google, 'calendar', () => ({ events: { insert: async (args) => {
    sent = args;
    return { data: { id: 'approved-event' } };
  } } }));
  await service.syncGoogleCalendarStatus(booking);
  assert.equal(sent.resource.summary, 'Calendar regression (APPROVED)');
  assert.equal(sent.resource.start.dateTime, '2099-05-01T03:00:00.000Z');
  assert.deepEqual(sent.resource.attendees, [{ email: user.email }, { email: 'participant@example.test' }]);
  assert.equal((await Booking.getById(booking.id)).google_event_id, 'approved-event');
});

test('approval and cancellation follow notification preferences and tolerate deleted events', async (t) => {
  const booking = await fixture({ google_event_id: 'existing-event', status: 'APPROVED' });
  let patch, deletion;
  t.mock.method(google, 'calendar', () => ({ events: {
    patch: async (args) => { patch = args; return { data: {} }; },
    delete: async (args) => { deletion = args; throw { response: { status: 410 } }; },
  } }));
  await service.syncGoogleCalendarStatus(booking);
  assert.equal(patch.sendUpdates, 'all');
  assert.equal(patch.requestBody.summary, 'Calendar regression (APPROVED)');
  await service.syncGoogleCalendarStatus({ ...booking, status: 'CANCELED' });
  assert.equal(deletion.sendUpdates, 'all');
  assert.equal((await Booking.getById(booking.id)).google_event_id, null);
});

test('event removed in Google can be recreated on status sync', async (t) => {
  const booking = await fixture({ google_event_id: 'removed-event', status: 'APPROVED' });
  t.mock.method(google, 'calendar', () => ({ events: {
    patch: async () => { throw { code: 410 }; },
    insert: async (args) => {
      assert.notEqual(args.resource.id, 'removed-event');
      return { data: { id: 'replacement-event' } };
    },
  } }));
  await service.syncGoogleCalendarStatus(booking);
  assert.equal((await Booking.getById(booking.id)).google_event_id, 'replacement-event');
});

test('permanent booking deletion removes its Calendar event first', async (t) => {
  const booking = await fixture({ google_event_id: 'delete-event' });
  let deleted = false;
  t.mock.method(google, 'calendar', () => ({ events: { delete: async (args) => {
    assert.equal(args.eventId, 'delete-event');
    assert.ok(await Booking.getById(booking.id));
    deleted = true;
  } } }));
  await request(app).delete(`/api/bookings/${booking.id}`).set('Authorization', bearer()).expect(200);
  assert.equal(deleted, true);
  assert.equal(await Booking.getById(booking.id), null);
});

test('failed Calendar deletion retains the booking and event ID for retry', async (t) => {
  const booking = await fixture({ google_event_id: 'retry-event' });
  t.mock.method(google, 'calendar', () => ({ events: { delete: async () => { throw { code: 503 }; } } }));
  await request(app).delete(`/api/bookings/${booking.id}`).set('Authorization', bearer()).expect(502);
  assert.equal((await Booking.getById(booking.id)).google_event_id, 'retry-event');
});

test('Calendar outage does not roll back a valid booking or its approval', async (t) => {
  const booking = await fixture();
  await db.models.Booking.deleteOne({ _id: booking.id });
  t.mock.method(google, 'calendar', () => ({ events: { insert: async () => { throw { code: 503 }; } } }));
  const response = await request(app).post('/api/bookings').set('Authorization', bearer()).send({
    room_id: room.id, topic: 'Outage meeting', start_time: '2099-08-01T10:00:00+07:00',
    end_time: '2099-08-01T11:00:00+07:00', guest_name: 'QA', guest_email: user.email,
  }).expect(201);
  await request(app).put(`/api/bookings/${response.body.booking.id}/status`).set('Authorization', bearer())
    .send({ status: 'APPROVED' }).expect(200);
  assert.equal((await Booking.getById(response.body.booking.id)).status, 'APPROVED');
});

test('concurrent Calendar creation for one booking creates only one provider event', async (t) => {
  const booking = await fixture();
  const events = new Map();
  t.mock.method(google, 'calendar', () => ({ events: {
    insert: async ({ resource }) => {
      if (events.has(resource.id)) throw { code: 409 };
      events.set(resource.id, resource);
      return { data: resource };
    },
    get: async ({ eventId }) => ({ data: events.get(eventId) }),
  } }));
  await Promise.all(Array.from({ length: 6 }, () => service.createGoogleCalendarEvent(user.id, booking)));
  assert.equal(events.size, 1);
  assert.ok(events.has((await Booking.getById(booking.id)).google_event_id));
});

test('cancellation while Google insert is pending does not leave a live event behind', async (t) => {
  const booking = await fixture();
  let removed;
  t.mock.method(google, 'calendar', () => ({ events: {
    insert: async ({ resource }) => {
      await db.models.Booking.updateOne({ _id: booking.id }, { $set: { status: 'CANCELED' } });
      return { data: resource };
    },
    delete: async ({ eventId }) => { removed = eventId; },
  } }));
  await service.createGoogleCalendarEvent(user.id, booking);
  assert.ok(removed);
  assert.equal((await Booking.getById(booking.id)).google_event_id, null);
});

test('retry after a lost insert response reuses the same Calendar event ID', async (t) => {
  const booking = await fixture();
  const events = new Map();
  t.mock.method(google, 'calendar', () => ({ events: {
    insert: async ({ resource }) => {
      if (events.has(resource.id)) throw { code: 409 };
      events.set(resource.id, resource);
      throw { code: 'ETIMEDOUT' };
    },
    get: async ({ eventId }) => ({ data: events.get(eventId) }),
  } }));
  await assert.rejects(service.createGoogleCalendarEvent(user.id, booking));
  await service.createGoogleCalendarEvent(user.id, booking);
  assert.equal(events.size, 1);
});

test('status retry after an uncertain insert also reuses its reserved event ID', async (t) => {
  const booking = await fixture();
  const events = new Map();
  t.mock.method(google, 'calendar', () => ({ events: {
    insert: async ({ resource }) => {
      if (events.has(resource.id)) throw { code: 409 };
      events.set(resource.id, resource);
      throw { code: 'ETIMEDOUT' };
    },
    patch: async () => { throw { code: 404 }; },
    get: async ({ eventId }) => ({ data: events.get(eventId) }),
  } }));
  await assert.rejects(service.createGoogleCalendarEvent(user.id, booking));
  await service.syncGoogleCalendarStatus(await Booking.getById(booking.id));
  assert.equal(events.size, 1);
});
