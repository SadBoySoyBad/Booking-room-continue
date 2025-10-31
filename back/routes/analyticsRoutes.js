// back/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware'); // สำหรับป้องกัน Route

// Route สำหรับดึงข้อมูลสรุป Analytics สำหรับ Dashboard
router.get('/summary', authMiddleware, authorizeRoles(['admin']), analyticsController.getSummaryAnalytics);

module.exports = router;