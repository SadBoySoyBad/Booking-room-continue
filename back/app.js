// back/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// init DB pool and test connection (db.js runs a test on import)
require('./db');

const cookieSession = require('cookie-session');
const passport = require('passport');
require('./config/passport');

const { authMiddleware, authorizeRoles } = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

app.set('trust proxy', 1);

// Flexible CORS via env (FRONTEND_URL, BACKEND_URL, CORS_ALLOWED_ORIGINS=CSV)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin) e.g., curl, server-to-server
      if (!origin) return callback(null, true);

      const allowed = new Set();
      if (process.env.FRONTEND_URL) allowed.add(process.env.FRONTEND_URL);
      if (process.env.BACKEND_URL) allowed.add(process.env.BACKEND_URL);
      if (process.env.CORS_ALLOWED_ORIGINS) {
        process.env.CORS_ALLOWED_ORIGINS.split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((o) => allowed.add(o));
      }
      if (process.env.NODE_ENV === 'development') {
        allowed.add('http://localhost:3000');
        allowed.add('http://127.0.0.1:3000');
      }

      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        const isVercelPreview = hostname.endsWith('.vercel.app');
        if (allowed.has(origin) || isVercelPreview) {
          return callback(null, true);
        }
      } catch (_) {
        // If URL parsing fails, fall back to strict allow-list only
        if (allowed.has(origin)) return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie-based session for serverless environments
app.use(
  cookieSession({
    name: 'session',
    keys: [process.env.JWT_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
  })
);

app.use(passport.initialize());
// On serverless + cookie-session, we don't use Passport's session store
// app.use(passport.session());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to BookingRuk Backend API!' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health
app.get('/api/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

module.exports = app;

