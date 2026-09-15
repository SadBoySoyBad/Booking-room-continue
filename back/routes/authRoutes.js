const router = require('express').Router();
const passport = require('passport');
const crypto = require('crypto');
const auth = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { publicUser } = require('../utils/http');
for (const provider of ['google', 'microsoft']) {
  router.get(`/${provider}`, (req, res, next) => {
    if (!passport._strategy(provider)) return res.status(503).json({ message: `${provider} sign-in has not been configured.` });
    const state = crypto.randomBytes(32).toString('hex');
    req.session.state = state;
    req.session.provider = provider;
    req.session.returnTo = `${process.env.FRONTEND_URL}/booking`;
    passport.authenticate(provider, { session: false, state,
      ...(provider === 'google' ? {
        scope: ['openid', 'email', 'profile', ...(process.env.GOOGLE_CALENDAR_ENABLED === 'true' ? ['https://www.googleapis.com/auth/calendar.events'] : [])],
        accessType: 'offline', prompt: 'consent', includeGrantedScopes: true,
      } : {}),
    })(req, res, next);
  });
  router.get(`/${provider}/callback`, (req, res, next) => {
    if (!req.session?.state || req.query.state !== req.session.state || req.session.provider !== provider) {
      return res.status(400).json({ message: 'Invalid OAuth state.' });
    }
    const returnTo = req.session.returnTo;
    req.session = null;
    if (!passport._strategy(provider)) return res.status(503).json({ message: 'Sign-in is not configured.' });
    passport.authenticate(provider, { session: false }, (error, user) => {
      if (error || !user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      req.user = user;
      auth.oauthSuccess(req, res, returnTo);
    })(req, res, next);
  });
}
router.post('/guest-login', auth.guestLogin);
router.get('/verify', authMiddleware, (req, res) => res.json({ message: 'Token is valid', user: publicUser(req.user) }));
router.get('/myinfo', (req, res, next) => {
  const hasBearer = /^Bearer\s+\S+$/i.test(req.headers.authorization || '');
  const hasCookie = /(?:^|;\s*)auth_token=[^;]/.test(req.headers.cookie || '');
  if (!hasBearer && !hasCookie) return res.json({ user: null });
  return authMiddleware(req, res, next);
}, (req, res) => res.json({ user: publicUser(req.user) }));
router.get('/logout', auth.logout);
router.post('/logout', auth.logout);
module.exports = router;
