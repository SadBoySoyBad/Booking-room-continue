const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { publicUser, errorResponse } = require('../utils/http');
const cookieOptions = () => ({
  httpOnly: true, secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/',
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
});
const tokenFor = (user, expiresIn = '24h') => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn });
module.exports = {
  oauthSuccess: async (req, res, returnTo) => {
    if (!req.user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    res.cookie('auth_token', tokenFor(req.user), { ...cookieOptions(), maxAge: 86400000 });
    res.redirect(returnTo || `${process.env.FRONTEND_URL}/booking`);
  },
  guestLogin: async (req, res) => {
    const { name, phone, company } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !/^[+0-9 ()-]{7,20}$/.test(phone)) {
      return res.status(400).json({ message: 'Name and a valid phone number are required.' });
    }
    try {
      let user = await User.findByPhone(phone.trim());
      if (user && user.role !== 'guest') return res.status(403).json({ message: 'Please use employee sign-in for this account.' });
      if (!user) user = await User.createGuest(name.trim(), phone.trim(), company);
      else {
        await User.update(user.id, { username: name.trim(), company: company || null, last_login_provider: 'guest' });
        user = await User.getById(user.id);
      }
      const token = tokenFor(user, '1h');
      res.cookie('auth_token', token, { ...cookieOptions(), maxAge: 3600000 });
      res.json({ user: publicUser(user), token });
    } catch (error) { errorResponse(res, error); }
  },
  employeeLogin: async (req, res) => {
    // Legacy endpoint accepts credentials only, never an unverified provider/email assertion.
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Use Google/Microsoft sign-in or supply email and password.' });
    try {
      const user = await User.findByEmail(email.trim().toLowerCase());
      if (!user?.password || !await bcrypt.compare(password, user.password)) return res.status(401).json({ message: 'Invalid credentials.' });
      const token = tokenFor(user);
      res.cookie('auth_token', token, { ...cookieOptions(), maxAge: 86400000 });
      res.json({ user: publicUser(user), token });
    } catch (error) { errorResponse(res, error); }
  },
  logout: (req, res) => {
    req.session = null;
    res.clearCookie('auth_token', cookieOptions());
    res.clearCookie('auth_token', { ...cookieOptions(), domain: undefined });
    res.status(200).json({ message: 'Logged out' });
  },
};
