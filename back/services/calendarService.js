const { google } = require('googleapis');
const User = require('../models/User'); // เพื่อเข้าถึง User model สำหรับ refresh token

const asArray = (value) => Array.isArray(value) ? value : JSON.parse(value || '[]');
const errorStatus = (error) => Number(error.response?.status || error.code);
const sendUpdates = (user) => user.settings?.email_meeting_booked === 1 ? 'all' : 'none';
const requestOptions = { timeout: 10000, retry: false };

exports.createGoogleCalendarEvent = async (userId, bookingDetails) => {
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    let user = await User.getById(userId); // ดึงข้อมูล user ล่าสุด
    if (!user || !user.google_access_token) {
        console.warn('User not found or no Google access token for calendar integration.');
        return;
    }

    // Reserve the provider ID before the network request. Concurrent invocations
    // and retries after a lost response must address the same Google event.
    const BookingModel = require('../db').models.Booking;
    const reserved = await BookingModel.findOneAndUpdate({ _id: bookingDetails.id,
        user_id: userId, status: { $in: ['PENDING', 'APPROVED'] }, google_event_id: null,
    }, { $set: { google_event_id: `b${bookingDetails.id}${require('crypto').randomBytes(6).toString('hex')}` } }, { new: true }).lean();
    const current = reserved || await BookingModel.findById(bookingDetails.id).lean();
    if (!current || String(current.user_id) !== String(userId) || !['PENDING', 'APPROVED'].includes(current.status) || !current.google_event_id) return;
    bookingDetails = { ...bookingDetails, ...current };

    let google_access_token = user.google_access_token;
    // เช็คว่า token หมดอายุหรือไม่ (ให้เผื่อเวลา 5 นาที)
    if (user.google_token_expiry && new Date(user.google_token_expiry).getTime() < (Date.now() + 5 * 60 * 1000)) {
        console.log('Google access token expired or near expiry, refreshing...');
        oauth2Client.setCredentials({ refresh_token: user.google_refresh_token });
        const { credentials } = await oauth2Client.refreshAccessToken();
        google_access_token = credentials.access_token;
        await User.updateGoogleAuth(user.id, user.google_id, credentials.access_token, credentials.refresh_token || user.google_refresh_token, credentials.expiry_date ? new Date(credentials.expiry_date) : null);
        if (!google_access_token) {
            console.error('Failed to refresh Google access token. Skipping calendar event creation.');
            return;
        }
    }

    oauth2Client.setCredentials({
        access_token: google_access_token,
        refresh_token: user.google_refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        id: bookingDetails.google_event_id,
        summary: `${bookingDetails.topic || 'Meeting Room Booking'} (${bookingDetails.status || 'PENDING'})`,
        location: bookingDetails.room_name || 'Meeting Room',
        description: `Booking by: ${bookingDetails.guest_name}\nEmail: ${bookingDetails.guest_email}\nPhone: ${bookingDetails.guest_phone || 'N/A'}\nCompany: ${bookingDetails.guest_company || 'N/A'}\nRequirements: ${asArray(bookingDetails.requirements || '[]').join(', ')}\nParticipants: ${asArray(bookingDetails.participants_emails || '[]').join(', ')}`,
        start: {
            dateTime: new Date(bookingDetails.start_time).toISOString(),
            timeZone: 'Asia/Bangkok',
        },
        end: {
            dateTime: new Date(bookingDetails.end_time).toISOString(),
            timeZone: 'Asia/Bangkok',
        },
        attendees: [...new Set([bookingDetails.guest_email, ...asArray(bookingDetails.participants_emails)]
            .filter(Boolean).map(email => email.trim().toLowerCase()))].map(email => ({ email })),
        reminders: {
            useDefault: false,
            overrides: [
                ...(user.settings?.email_reminders === 1 ? [{ method: 'email', minutes: user.settings.reminder_minutes || 30 }] : []),
                { method: 'popup', minutes: user.settings?.reminder_minutes || 30 },
            ],
        },
    };

    try {
        let res;
        try {
            res = await calendar.events.insert({ calendarId: 'primary', resource: event,
                sendUpdates: sendUpdates(user) }, requestOptions);
        } catch (error) {
            if (errorStatus(error) !== 409) throw error;
            res = await calendar.events.get({ calendarId: 'primary', eventId: event.id }, requestOptions);
            if (res.data.status === 'cancelled') {
                await BookingModel.updateOne({ _id: bookingDetails.id, google_event_id: event.id }, { $set: { google_event_id: null } });
                return exports.createGoogleCalendarEvent(userId, bookingDetails);
            }
        }
        await BookingModel.updateOne({ _id: bookingDetails.id, google_event_id: event.id }, { $set: { google_event_id: res.data.id } });
        const latest = await BookingModel.findById(bookingDetails.id).lean();
        if (!latest || !['PENDING', 'APPROVED'].includes(latest.status) || latest.google_event_id !== res.data.id) {
            // A cancellation/deletion may have completed while Google was inserting.
            try { await calendar.events.delete({ calendarId: 'primary', eventId: res.data.id,
                sendUpdates: sendUpdates(user) }, requestOptions); }
            catch (error) { if (![404, 410].includes(errorStatus(error))) throw error; }
            await BookingModel.updateOne({ _id: bookingDetails.id, google_event_id: res.data.id }, { $set: { google_event_id: null } });
            return;
        }
        if (latest.status !== bookingDetails.status) await exports.syncGoogleCalendarStatus(latest);
        return res.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', errorStatus(error) || error.code || error.name);
        throw error;
    }
};

// Calendar sync is best-effort; database approval remains the source of truth.
exports.syncGoogleCalendarStatus = async (booking) => {
  if (!booking?.user_id) return;
  const user = await User.getById(booking.user_id);
  if (!user || user.settings?.update_calendar === 0) return;
  if (!booking.google_event_id) {
    if (['PENDING', 'APPROVED'].includes(booking.status) && user.last_login_provider === 'google' && user.settings?.auto_add_calendar !== 0) return exports.createGoogleCalendarEvent(user.id, booking);
    return;
  }
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
  auth.setCredentials({ access_token: user.google_access_token, refresh_token: user.google_refresh_token,
    expiry_date: user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : undefined });
  const calendar = google.calendar({ version: 'v3', auth });
  if (['CANCELED', 'REJECTED'].includes(booking.status)) {
    try { await calendar.events.delete({ calendarId: 'primary', eventId: booking.google_event_id,
      sendUpdates: sendUpdates(user) }, requestOptions); }
    catch (error) { if (![404, 410].includes(errorStatus(error))) throw error; }
    await require('../db').models.Booking.updateOne({ _id: booking.id, google_event_id: booking.google_event_id }, { $set: { google_event_id: null } });
  } else {
    try {
      await calendar.events.patch({ calendarId: 'primary', eventId: booking.google_event_id,
        sendUpdates: sendUpdates(user),
        requestBody: { summary: `${booking.topic} (${booking.status})` } }, requestOptions);
    } catch (error) {
      if (![404, 410].includes(errorStatus(error))) throw error;
      // A 404 can also be an insert whose response was lost: reuse its reserved
      // ID. Only a confirmed tombstone (410) needs a fresh provider ID.
      if (errorStatus(error) === 410) {
        await require('../db').models.Booking.updateOne({ _id: booking.id, google_event_id: booking.google_event_id }, { $set: { google_event_id: null } });
      }
      if (user.settings?.auto_add_calendar !== 0) {
        return exports.createGoogleCalendarEvent(user.id, { ...booking, google_event_id: null });
      }
    }
  }
};
