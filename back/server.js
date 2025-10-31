// back\server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const session = require('express-session');
const passport = require('passport');
require('./config/passport'); // ตั้งค่า Passport Strategies

// นำเข้า Middleware (ต้อง import ก่อนนำเข้า routes ที่ใช้ middleware นี้)
const { authMiddleware, authorizeRoles } = require('./middleware/authMiddleware');

// นำเข้า Routes (ลำดับการ import ไม่ได้สำคัญเท่าการใช้งาน)
const authRoutes = require('./routes/authRoutes'); // นำเข้าก่อน เพราะมักจะใช้ verify
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes'); // User routes มักจะถูกใช้โดย Admin
const analyticsRoutes = require('./routes/analyticsRoutes'); // <-- Import


const app = express();
const PORT = process.env.PORT || 3001;

// ⭐ STEP 1: เพิ่มบรรทัดนี้ก่อน session เพื่อให้ Express รับรู้ proxy
app.set("trust proxy", 1);

// ⭐ STEP 2: แก้ cors แบบนี้ เพื่อให้ cookie วิ่งระหว่าง frontend-backend
// แก้ไขให้รองรับทั้ง Production URL และ Localhost สำหรับ Development
app.use(cors({
  origin: (origin, callback) => {
    // อนุญาตเฉพาะ origin ที่กำหนดไว้ใน FRONTEND_URL
    const allowedOrigins = [process.env.FRONTEND_URL];
    // เพิ่ม localhost สำหรับการพัฒนาโดยตรง
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
      allowedOrigins.push('http://127.0.0.1:3000'); // เผื่อกรณี localhost ใช้ IP
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add session middleware
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.ruk-com.cloud' : undefined,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to BookingRuk Backend API!' });
});

// ใช้งาน Routes
app.use('/api/users', userRoutes); // เพิ่มอันนี้แบบไม่ต้อง auth

// API สำหรับ Authentication (Login, Logout, Verify)
app.use('/api/auth', authRoutes);  // ไม่ต้องมี /api/ prefix เพราะ nginx จะจัดการให้

// API สำหรับ Rooms (บางส่วนต้อง Login และมี Role)
app.use('/api/rooms', roomRoutes); // ถ้าต้องการป้องกันเฉพาะบาง method ใน roomRoutes ให้ย้าย authMiddleware เข้าไปใน routes/roomRoutes.js

// API สำหรับ Bookings (บางส่วนต้อง Login และมี Role)
app.use('/api/bookings', bookingRoutes);

// API สำหรับ Users (โดยปกติจะเป็น Admin - ถ้า User controller/routes ถูกสร้าง)
app.use('/api/users', authMiddleware, authorizeRoles(['admin']), userRoutes); // ตัวอย่าง: ป้องกันด้วย authMiddleware สำหรับ Admin

app.use('/api/analytics', analyticsRoutes); // <-- เพิ่มบรรทัดนี้

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Successfully connected to MariaDB!`); // ย้ายมาอยู่ตรงนี้
    console.log(`Access backend at http://localhost:${PORT}`);
});

// Health check endpoint
// ✅ ใช้สำหรับตรวจสอบสถานะของเซิร์ฟเวอร์
app.get('/api/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
  
// ✅ 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
