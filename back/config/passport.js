// back\config\passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const MicrosoftStrategy = require('passport-microsoft').Strategy; // สำหรับในอนาคต
const User = require('../models/User');

// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.getById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findByGoogleId(profile.id);

        if (!user && profile.emails && profile.emails[0]) {
            user = await User.findByEmail(profile.emails[0].value);
        }

        if (user) {
            const tokenExpiryDate = profile._json.exp ? new Date(profile._json.exp * 1000) : null;
            await User.updateGoogleAuth(user.id, profile.id, accessToken, refreshToken || null, tokenExpiryDate);
            const updatedUser = await User.getById(user.id); // ดึงข้อมูลผู้ใช้ที่อัปเดตแล้ว
            return done(null, updatedUser);
        } else {
            const tokenExpiryDate = profile._json.exp ? new Date(profile._json.exp * 1000) : null;
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            
            // แยก company จาก email domain
            const domain = email ? email.split('@')[1] : '';
            const company = domain ? domain.split('.')[0] : 'unknown';
            
            const newUser = await User.createOAuthUser(
                profile.displayName,
                email,
                profile.id,
                accessToken,
                refreshToken || null,
                tokenExpiryDate,
                null, null, null, null, // Microsoft fields - ส่งเป็น null
                'google',
                company // เพิ่ม company parameter
            );
            return done(null, newUser);
        }
    } catch (error) {
        console.error('Google OAuth Error:', error);
        return done(error, false);
    }
}));

// ถ้าจะทำ Microsoft ในอนาคต
// passport.use(new MicrosoftStrategy({ ... }));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.getById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});