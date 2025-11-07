// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ✅ Google OAuth login route
router.get('/google', (req, res, next) => {
    const state = crypto.randomBytes(32).toString('hex');
    // cookie-session does not implement req.session.save; just assign
    if (req.session) {
        req.session.state = state;
        req.session.returnTo = process.env.FRONTEND_URL + '/booking';
    }

    passport.authenticate('google', {
        scope: [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ],
        accessType: 'offline',
        prompt: 'consent',
        includeGrantedScopes: true,
        state: state,
        session: false
    })(req, res, next);
});

// ✅ Google OAuth callback
router.get('/google/callback', (req, res, next) => {
    if (!req.session || req.query.state !== req.session.state) {
        return res.status(400).send('Invalid state parameter. Possible CSRF attack.');
    }

    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_login_failed`,
        session: false
    })(req, res, (err) => {
        if (err) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=${err.message}`);
        }

        const returnTo = req.session.returnTo || `${process.env.FRONTEND_URL}/booking`;
        delete req.session.returnTo;
        delete req.session.state;

        authController.oauthSuccess(req, res, returnTo);
    });
});

// ✅ Guest login route
router.post('/guest-login', authController.guestLogin);

// ✅ Token verification route
router.get('/verify', authMiddleware, (req, res) => {
    res.json({ message: 'Token is valid', user: req.user });
});

// ✅ Logout route
router.get('/logout', authController.logout);

// ✅ NEW: MyInfo route (ตรวจสอบสถานะ login จากทั้ง cookie + JWT)
router.get('/myinfo', (req, res) => {
    const authHeader = req.headers.authorization;

    if (req.user) {
        return res.status(200).json({ user: req.user });
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return res.status(200).json({ user: decoded });
        } catch (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
    }

    return res.status(401).json({ message: 'Not logged in' });
});

module.exports = router;
