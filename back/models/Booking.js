// back/models/Booking.js (MongoDB + Mongoose)
const mongoose = require('../db');

const BookingSchema = new mongoose.Schema(
  {
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    topic: { type: String, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    guest_name: { type: String, required: true },
    guest_email: { type: String, required: true },
    guest_phone: { type: String, default: null },
    guest_company: { type: String, default: null },
    participants_emails: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELED'], default: 'PENDING' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

BookingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    if (ret.room_id) ret.room_id = ret.room_id.toString();
    if (ret.user_id) ret.user_id = ret.user_id.toString();
    delete ret._id;
    return ret;
  },
});

const BookingModel = mongoose.model('Booking', BookingSchema);
const getRoomModel = () => {
  if (mongoose.models.Room) return mongoose.models.Room;
  require('./Room');
  return mongoose.models.Room;
};
const getUserModel = () => {
  if (mongoose.models.User) return mongoose.models.User;
  require('./User');
  return mongoose.models.User;
};

const mapRoomName = async (rows) => {
  const RoomModel = getRoomModel();
  const roomIds = [];
  const roomIdStrings = [];
  rows.forEach((r) => {
    if (r.room_id) {
      roomIdStrings.push(String(r.room_id));
      try {
        roomIds.push(new mongoose.Types.ObjectId(String(r.room_id)));
      } catch {
        // skip invalid ObjectId
      }
    }
  });
  const uniqueObjIds = [...new Set(roomIds.map((id) => id.toString()))].map((s) => new mongoose.Types.ObjectId(s));
  const rooms = await RoomModel.find({ _id: { $in: uniqueObjIds } }).select('name').lean({ virtuals: true });
  const roomMap = new Map(rooms.map((r) => [r.id, r.name]));
  return rows.map((row) => ({
    ...row,
    room_name: roomMap.get(String(row.room_id)) || null,
  }));
};

const Booking = {
  create: async (
    roomId,
    topic,
    startTime,
    endTime,
    guestName,
    guestEmail,
    guestPhone,
    guestCompany,
    participantsEmails,
    requirements,
    userId = null
  ) => {
    const toObjectId = (id) => {
      try {
        return new mongoose.Types.ObjectId(String(id));
      } catch {
        return null;
      }
    };
    const roomObjectId = toObjectId(roomId);
    const userObjectId = userId ? toObjectId(userId) : null;
    if (!roomObjectId) {
      throw new Error('Invalid room id');
    }

    const doc = await BookingModel.create({
      room_id: roomObjectId,
      topic,
      start_time: new Date(startTime),
      end_time: new Date(endTime),
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone || null,
      guest_company: guestCompany || null,
      participants_emails: participantsEmails || [],
      requirements: requirements || [],
      user_id: userObjectId || null,
    });
    return doc.toJSON();
  },

  getAll: async () => {
    const rows = await BookingModel.find().sort({ start_time: 1 }).lean({ virtuals: true });
    return mapRoomName(rows);
  },

  getById: async (id) => {
    const row = await BookingModel.findById(id).lean({ virtuals: true });
    if (!row) return null;
    const [mapped] = await mapRoomName([row]);
    return mapped;
  },

  getByDate: async (date) => {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    const rows = await BookingModel.find({
      $or: [
        { start_time: { $gte: dayStart, $lte: dayEnd } },
        { end_time: { $gte: dayStart, $lte: dayEnd } },
      ],
    })
      .sort({ start_time: 1 })
      .lean({ virtuals: true });
    return mapRoomName(rows);
  },

  getByGuestInfo: async (email, phone) => {
    const rows = await BookingModel.find({
      $or: [{ guest_email: email }, { guest_phone: phone }],
    })
      .sort({ created_at: -1 })
      .lean({ virtuals: true });
    return mapRoomName(rows);
  },

  updateStatus: async (id, status) => {
    const result = await BookingModel.updateOne({ _id: id }, { $set: { status } });
    return result.modifiedCount > 0;
  },

  delete: async (id) => {
    const result = await BookingModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  checkRoomAvailability: async (roomId, startTime, endTime, excludeBookingId = null) => {
    const toObjectId = (id) => {
      try {
        return new mongoose.Types.ObjectId(String(id));
      } catch {
        return null;
      }
    };
    const roomObjectId = toObjectId(roomId);
    const filter = {
      room_id: roomObjectId,
      status: { $in: ['PENDING', 'APPROVED'] },
      $or: [
        { start_time: { $lt: new Date(endTime) }, end_time: { $gt: new Date(startTime) } },
        { start_time: { $eq: new Date(startTime) } },
        { end_time: { $eq: new Date(endTime) } },
      ],
    };
    if (excludeBookingId) {
      filter._id = { $ne: excludeBookingId };
    }
    const count = await BookingModel.countDocuments(filter);
    return count === 0;
  },

  getByUserId: async (userId) => {
    const rows = await BookingModel.find({ user_id: userId })
      .sort({ start_time: -1 })
      .lean({ virtuals: true });
    return mapRoomName(rows);
  },

  getNotificationsByUserId: async () => {
    const dummyNotifications = [
      { id: 1, message: 'Upcoming: Topic A in 15 minutes', status: 'upcoming', date: '2025-07-11 15:00', booking_id: 101 },
      { id: 2, message: 'Approved: Meeting 1 at 10:00', status: 'approved', date: '2025-07-10 10:00', booking_id: 100 },
      { id: 3, message: 'Canceled: Meeting 2 at 09:30', status: 'canceled', date: '2025-07-09 09:30', booking_id: 99 },
    ];
    return dummyNotifications;
  },

  getByStatus: async (status) => {
    const rows = await BookingModel.find({ status }).lean({ virtuals: true });
    return mapRoomName(rows);
  },

  findAllByUserOrGuest: async (userId, email, phone) => {
    const rows = await BookingModel.find({
      $or: [{ user_id: userId }, { guest_email: email }, { guest_phone: phone }],
    })
      .sort({ start_time: -1 })
      .lean({ virtuals: true });
    return mapRoomName(rows);
  },
};

module.exports = Booking;
