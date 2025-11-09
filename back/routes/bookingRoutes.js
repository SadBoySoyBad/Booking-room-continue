// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, bookingController.createBooking);

router.get('/', authMiddleware, authorizeRoles(['admin']), bookingController.getAll);

// Allow all logged-in roles (guest/employee/admin) to view daily bookings; controller hides others' details
router.get('/daily/:date', authMiddleware, bookingController.getByDate);

router.get('/my-history', authMiddleware, bookingController.getByUserId);

router.get('/guest-history', bookingController.getByGuestInfo);
router.put('/:id/status', authMiddleware, authorizeRoles(['admin']), bookingController.updateStatus);

router.delete('/:id', authMiddleware, authorizeRoles(['admin']), bookingController.delete);

router.get('/notifications', authMiddleware, bookingController.getNotificationsByUserId);


module.exports = router;
