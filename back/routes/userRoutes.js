const router = require('express').Router();
const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const User = require('../models/User');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { errorResponse } = require('../utils/http');
router.post('/guest-login', auth.guestLogin);
router.post('/employee-login', auth.employeeLogin);
router.use(authMiddleware, authorizeRoles(['admin']));
router.get('/settings', (req, res) => res.json(req.user.settings || {
  email_meeting_booked: 1, email_reminders: 0, reminder_minutes: 30, auto_add_calendar: 1, update_calendar: 1,
}));
router.put('/settings', async (req, res) => {
  try {
    const data = {};
    for (const key of ['email_meeting_booked', 'email_reminders', 'auto_add_calendar', 'update_calendar']) {
      if (![0, 1].includes(req.body[key])) return res.status(400).json({ message: 'Invalid settings.' });
      data[`settings.${key}`] = req.body[key];
    }
    if (!Number.isInteger(req.body.reminder_minutes) || req.body.reminder_minutes < 1 || req.body.reminder_minutes > 1440) return res.status(400).json({ message: 'Invalid reminder minutes.' });
    data['settings.reminder_minutes'] = req.body.reminder_minutes;
    await User.update(req.user.id, data);
    res.json({ message: 'Settings saved.' });
  } catch (error) { errorResponse(res, error); }
});
router.get('/', users.getAllUsers);
router.post('/', users.createUser);
router.get('/:id', users.getUserById);
router.put('/:id', users.updateUser);
router.delete('/:id', users.deleteUser);
module.exports = router;
