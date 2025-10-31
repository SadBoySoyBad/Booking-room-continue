// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ✅ Guest login
router.post('/guest-login', authController.guestLogin);

// ✅ Employee login (แบบ mock)
router.post('/employee-login', authController.employeeLogin); // <== เพิ่มตรงนี้

module.exports = router;
