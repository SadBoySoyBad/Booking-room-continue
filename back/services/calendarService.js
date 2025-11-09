const { google } = require('googleapis');
const User = require('../models/User'); // เพื่อเข้าถึง User model สำหรับ refresh token

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const refreshAccessToken = async (userId, refreshToken) => {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await User.updateGoogleAuth(
            userId,
            null,
            credentials.access_token,
            credentials.refresh_token || refreshToken,
            credentials.expiry_date ? new Date(credentials.expiry_date) : null
        );
        return credentials.access_token;
    } catch (error) {
        console.error('Error refreshing Google access token:', error);
        throw new Error('Could not refresh Google access token. Please re-authenticate.');
    }
};

exports.createGoogleCalendarEvent = async (userId, bookingDetails) => {
    let user = await User.getById(userId); // ดึงข้อมูล user ล่าสุด
    if (!user || !user.google_access_token) {
        console.warn('User not found or no Google access token for calendar integration.');
        return;
    }

    let google_access_token = user.google_access_token;
    // เช็คว่า token หมดอายุหรือไม่ (ให้เผื่อเวลา 5 นาที)
    if (user.google_token_expiry && new Date(user.google_token_expiry).getTime() < (Date.now() + 5 * 60 * 1000)) {
        console.log('Google access token expired or near expiry, refreshing...');
        google_access_token = await refreshAccessToken(user.id, user.google_refresh_token);
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
        summary: bookingDetails.topic || 'Meeting Room Booking',
        location: bookingDetails.room_name || 'Meeting Room',
        description: `Booking by: ${bookingDetails.guest_name}\nEmail: ${bookingDetails.guest_email}\nPhone: ${bookingDetails.guest_phone || 'N/A'}\nCompany: ${bookingDetails.guest_company || 'N/A'}\nRequirements: ${JSON.parse(bookingDetails.requirements || '[]').join(', ')}\nParticipants: ${JSON.parse(bookingDetails.participants_emails || '[]').join(', ')}`,
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
            ...(JSON.parse(bookingDetails.participants_emails || '[]').map(email => ({ email }))), // ผู้เข้าร่วมอื่นๆ
        ],
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 60 },
                { method: 'popup', minutes: 10 },
            ],
        },
    };

    try {
        const res = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        console.log('Event created on Google Calendar: %s', res.data.htmlLink);
        return res.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error.message);
        if (error.response && error.response.data) {
             console.error('Google API response:', error.response.data);
        }
        throw error;
    }
};