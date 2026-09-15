// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authMiddleware, authorizeRoles, optionalAuthMiddleware } = require('../middleware/authMiddleware'); // <--- ถูกต้อง

router.get('/', optionalAuthMiddleware, roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);

router.post('/', authMiddleware, authorizeRoles(['admin']), roomController.createRoom);
router.put('/:id', authMiddleware, authorizeRoles(['admin']), roomController.updateRoom);
router.delete('/:id', authMiddleware, authorizeRoles(['admin']), roomController.deleteRoom);

module.exports = router;
