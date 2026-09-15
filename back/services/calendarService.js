const { google } = require('googleapis');
const User = require('../models/User'); // เพื่อเข้าถึง User model สำหรับ refresh token

const asArray = (value) => Array.isArray(value) ? value : JSON.parse(value || '[]');

exports.createGoogleCalendarEvent = async (userId, bookingDetails) => {
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    let user = await User.getById(userId); // ดึงข้อมูล user ล่าสุด
    if (!user || !user.google_access_token) {
        console.warn('User not found or no Google access token for calendar integration.');
        return;
    }

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
        id: bookingDetails.google_event_id || `b${bookingDetails.id}${require('crypto').randomBytes(6).toString('hex')}`,
        summary: bookingDetails.topic || 'Meeting Room Booking',
        location: bookingDetails.room_name || 'Meeting Room',
        description: `Booking by: ${bookingDetails.guest_name}\nEmail: ${bookingDetails.guest_email}\nPhone: ${bookingDetails.guest_phone || 'N/A'}\nCompany: ${bookingDetails.guest_company || 'N/A'}\nRequirements: ${asArray(bookingDetails.requirements || '[]').join(', ')}\nParticipants: ${asArray(bookingDetails.participants_emails || '[]').join(', ')}`,
        start: {
            dateTime: bookingDetails.start_time,
            timeZone: 'Asia/Bangkok',
        },
        end: {
            dateTime: bookingDetails.end_time,
            timeZone: 'Asia/Bangkok',
        },
        attendees: [
            { email: bookingDetails.guest_email }, // ผู้จองหลัก
            ...(asArray(bookingDetails.participants_emails || '[]').map(email => ({ email }))), // ผู้เข้าร่วมอื่นๆ
        ],
        reminders: {
            useDefault: false,
            overrides: [
                ...(user.settings?.email_reminders === 1 ? [{ method: 'email', minutes: user.settings.reminder_minutes || 30 }] : []),
                { method: 'popup', minutes: user.settings?.reminder_minutes || 30 },
            ],
        },
    };

    try {
        const res = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            sendUpdates: user.settings?.email_meeting_booked === 1 ? 'all' : 'none',
        });
        console.log('Event created on Google Calendar: %s', res.data.htmlLink);
        await require('../db').models.Booking.updateOne({ _id: bookingDetails.id }, { $set: { google_event_id: res.data.id } });
        return res.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error.message);
        if (error.response && error.response.data) {
             console.error('Google API response:', error.response.data);
        }
        throw error;
    }
};

// Calendar sync is best-effort; database approval remains the source of truth.
exports.syncGoogleCalendarStatus = async (booking) => {
  if (!booking.user_id) return;
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
    try { await calendar.events.delete({ calendarId: 'primary', eventId: booking.google_event_id }); }
    catch (error) { if (![404, 410].includes(error.code)) throw error; }
    await require('../db').models.Booking.updateOne({ _id: booking.id }, { $set: { google_event_id: null } });
  } else {
    await calendar.events.patch({ calendarId: 'primary', eventId: booking.google_event_id,
      requestBody: { summary: `${booking.topic} (${booking.status})` } });
  }
};
