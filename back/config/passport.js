const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');

const verify = (provider) => async (accessToken, refreshToken, params, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!profile.id || !email || (provider === 'google' && profile._json?.email_verified !== true)) return done(null, false);
    let user = provider === 'google' ? await User.findByGoogleId(profile.id) : await User.findByMicrosoftId(profile.id);
    if (!user) {
      const existing = await User.findByEmail(email);
      // Microsoft mail/UPN is contact data, not proof of ownership of an existing
      // application account. Cross-provider linking requires explicit proof.
      if (existing) {
        if (provider !== 'google' || existing.google_id || existing.microsoft_id) return done(null, false);
        user = existing; // Verified Google email may claim a pre-provisioned account.
      }
    }
    const expiry = params.expires_in ? new Date(Date.now() + Number(params.expires_in) * 1000) : null;
    if (!user) {
      // Email is stable and unique even when two people share a display name.
      user = await User.createOAuthUser(profile.displayName || email, email,
        provider === 'google' ? profile.id : null,
        provider === 'google' ? accessToken : null,
        provider === 'google' ? refreshToken : null,
        provider === 'google' ? expiry : null,
        provider === 'microsoft' ? profile.id : null,
        provider === 'microsoft' ? accessToken : null,
        provider === 'microsoft' ? refreshToken : null,
        provider === 'microsoft' ? expiry : null,
        provider, email.split('@')[1].split('.')[0]);
    } else if (provider === 'google') {
      await User.updateGoogleAuth(user.id, profile.id, accessToken, refreshToken, expiry);
    } else {
      await User.updateMicrosoftAuth(user.id, profile.id, accessToken, refreshToken, expiry);
    }
    done(null, await User.getById(user.id));
  } catch (error) { done(error); }
};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({ clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, callbackURL: process.env.GOOGLE_REDIRECT_URI,
  }, verify('google')));
}
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({ clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET, callbackURL: process.env.MICROSOFT_REDIRECT_URI,
    tenant: process.env.MICROSOFT_TENANT || 'common',
    scope: ['user.read'],
  }, verify('microsoft')));
}
