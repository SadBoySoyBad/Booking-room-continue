// back/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  oauthSuccess: async (req, res, returnTo) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: process.env.NODE_ENV === 'production' ? (process.env.COOKIE_DOMAIN || undefined) : undefined,
        path: '/',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.redirect(returnTo || `${process.env.FRONTEND_URL}/booking`);
    } catch (error) {
      console.error('OAuth Success Handler Error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  },

  guestLogin: async (req, res) => {
    const { name, phone, company } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'ชื่อและเบอร์โทรเป็นข้อมูลจำเป็น' });
    }

    try {
      let user = await User.findByPhone(phone);
      if (!user) {
        user = await User.createGuest(name, phone, company);
      } else {
        await User.update(user.id, {
          username: name,
          company: company || null,
          last_login_provider: 'guest'
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ user, token });
    } catch (error) {
      console.error('Guest login failed:', error);
      res.status(500).json({ message: 'Guest login failed', error: error.message });
    }
  },

  employeeLogin: async (req, res) => {
    const { name, email, provider } = req.body;

    if (!email || !provider) {
      return res.status(400).json({ message: 'email และ provider จำเป็น' });
    }

    const domain = email.split('@')[1] || '';
    const company = domain.split('.')[0] || 'unknown';

    try {
      let user = await User.findByEmail(email);
      if (!user) {
        user = await User.create(name, email, null, 'employee', null, company);
        await User.update(user.id, { last_login_provider: provider });
      } else {
        await User.update(user.id, {
          username: name,
          company,
          role: 'employee',
          last_login_provider: provider
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      res.json({ user, token });
    } catch (err) {
      console.error('Employee login failed:', err);
      res.status(500).json({ message: 'Login failed', error: err.message });
    }
  },

  logout: (req, res) => {
    try {
      if (typeof req.logout === 'function') {
        // Avoid passport session save calls on serverless
        try { req.logout(); } catch (_) {}
      }
    } catch (_) {}

    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: process.env.NODE_ENV === 'production' ? (process.env.COOKIE_DOMAIN || undefined) : undefined,
      path: '/'
    });

    // return 200 JSON for SPA to handle
    return res.status(200).json({ message: 'Logged out' });
  }
};

module.exports = authController;
