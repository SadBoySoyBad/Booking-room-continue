// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const User = require('../models/User'); // ✅ เพิ่มตรงนี้

const authMiddleware = async (req, res, next) => {
  let token;

  // ✅ 1. ดึงจาก Authorization Header (Guest/Employee)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // ✅ 2. ดึงจาก Cookie (Google OAuth)
  else if (req.headers.cookie) {
    const cookies = cookie.parse(req.headers.cookie);
    token = cookies.auth_token;
  }

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id || decoded.id; // 🔍 ป้องกันชื่อ key ไม่ตรง

    // ✅ ดึงข้อมูลผู้ใช้จาก DB
    const user = await User.getById(userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found.' });
    }

    req.user = user; // แนบ user ที่สมบูรณ์
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(403).json({ message: 'Token is not valid or expired.' });
  }
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { authMiddleware, authorizeRoles };
