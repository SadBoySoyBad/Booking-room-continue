// back/models/Analytics.js (MongoDB + Mongoose)
const mongoose = require('../db');

const getBookingModel = () => {
  if (mongoose.models.Booking) return mongoose.models.Booking;
  require('./Booking');
  return mongoose.models.Booking;
};
const getUserModel = () => {
  if (mongoose.models.User) return mongoose.models.User;
  require('./User');
  return mongoose.models.User;
};

const Analytics = {
  getTotalReservations: async () => {
    const BookingModel = getBookingModel();
    const count = await BookingModel.countDocuments();
    return { count };
  },

  getTotalAttendance: async () => {
    const BookingModel = getBookingModel();
    const count = await BookingModel.countDocuments({ status: 'APPROVED' });
    return { count };
  },

  getLeaderboardReservations: async (limit = 5) => {
    const BookingModel = getBookingModel();
    const rows = await BookingModel.aggregate([
      { $project: { company: { $trim: { input: { $ifNull: ['$guest_company', ''] } } } } },
      { $match: { company: { $ne: '' } } },
      { $group: { _id: '$company', reservations: { $sum: 1 } } },
      { $sort: { reservations: -1, _id: 1 } },
      { $limit: limit },
      { $project: { company: '$_id', reservations: 1, totalEvents: '$reservations', district: { $literal: '—' }, total: '$reservations', _id: 0 } },
    ]);
    return rows;
  },

  getCompanyReservations: async () => getBookingModel().aggregate([
    { $project: { company: { $trim: { input: { $ifNull: ['$guest_company', ''] } } } } },
    { $group: { _id: '$company', reservations: { $sum: 1 } } },
    { $sort: { reservations: -1, _id: 1 } },
    { $project: { _id: 0, company: { $cond: [{ $eq: ['$_id', ''] }, null, '$_id'] }, reservations: 1 } },
  ]),

  getMonthlyBookingCounts: async (year = new Date().getFullYear()) => {
    const BookingModel = getBookingModel();
    const start = new Date(`${year}-01-01T00:00:00+07:00`);
    const end = new Date(`${year + 1}-01-01T00:00:00+07:00`);
    const rows = await BookingModel.aggregate([
      {
        $match: {
          start_time: { $gte: start, $lt: end },
          status: { $in: ['PENDING', 'APPROVED'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$start_time', timezone: 'Asia/Bangkok' } },
          count: { $sum: 1 },
          attendance: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', count: 1, attendance: 1, _id: 0 } },
    ]);
    return rows;
  },

  getEventsByRole: async () => {
    const BookingModel = getBookingModel();
    const UserModel = getUserModel();
    const rows = await BookingModel.aggregate([
      { $match: { user_id: { $ne: null } } },
      {
        $lookup: {
          from: UserModel.collection.name,
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { role: 1 } }],
        },
      },
      { $unwind: '$user' },
      { $group: { _id: '$user.role', count: { $sum: 1 } } },
    ]);

    const guestCount = await BookingModel.countDocuments({ user_id: null, guest_email: { $ne: null } });

    const result = {};
    rows.forEach((row) => {
      if (row._id) result[row._id.toLowerCase()] = row.count;
    });
    result['guest'] = (result['guest'] || 0) + guestCount;
    return result;
  },
};

module.exports = Analytics;
