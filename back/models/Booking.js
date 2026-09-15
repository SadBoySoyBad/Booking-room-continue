// back/models/Booking.js (MongoDB + Mongoose)
const mongoose = require('../db');
const { dayBounds } = require('../utils/dates');
const { fail } = require('../utils/http');

const BookingSchema = new mongoose.Schema(
  {
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    topic: { type: String, required: true, trim: true },
    google_event_id: { type: String, default: null },
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

BookingSchema.index({ room_id: 1, status: 1, start_time: 1, end_time: 1 });
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
  const users = await getUserModel().find({ _id: { $in: rows.map(row => row.user_id).filter(Boolean) } }).select('role').lean();
  const roles = new Map(users.map(user => [user.id, user.role]));
  return rows.map((row) => ({
    ...row,
    room_name: roomMap.get(String(row.room_id)) || null,
    user_role: roles.get(String(row.user_id)) || 'guest',
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

    return mongoose.connection.transaction(async (session) => {
      // Every reservation/status change writes the same room document first.
      // Mongo retries concurrent writers, then rechecks overlap in the new snapshot.
      const room = await getRoomModel().findOneAndUpdate({ _id: roomObjectId },
        { $inc: { booking_version: 1 } }, { session });
      if (!room) throw fail(404, 'Selected room not found.');
      if (room.status === 'MAINTENANCE') throw fail(409, 'Selected room is under maintenance.');
      const overlap = await BookingModel.exists({ room_id: roomObjectId,
        status: { $in: ['PENDING', 'APPROVED'] },
        start_time: { $lt: new Date(endTime) }, end_time: { $gt: new Date(startTime) },
      }).session(session);
      if (overlap) throw fail(409, 'Room is already booked for the selected time slot.');
      const [doc] = await BookingModel.create([{
        room_id: roomObjectId, topic, start_time: new Date(startTime), end_time: new Date(endTime),
        guest_name: guestName, guest_email: guestEmail, guest_phone: guestPhone || null,
        guest_company: guestCompany || null, participants_emails: participantsEmails || [],
        requirements: requirements || [], user_id: userObjectId,
      }], { session });
      return doc.toJSON();
    });
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
    const { start: dayStart, end: dayEnd } = dayBounds(date);
    const rows = await BookingModel.find({
      start_time: { $lt: dayEnd }, end_time: { $gt: dayStart },
      status: { $in: ['PENDING', 'APPROVED'] },
    })
      .sort({ start_time: 1 })
      .lean({ virtuals: true });
    return mapRoomName(rows);
  },

  getByGuestInfo: async (email, phone) => {
    const rows = await BookingModel.find({
      guest_email: email, guest_phone: phone,
    })
      .sort({ created_at: -1 })
      .lean({ virtuals: true });
    return mapRoomName(rows);
  },

  updateStatus: async (id, status) => {
    return mongoose.connection.transaction(async (session) => {
      const booking = await BookingModel.findById(id).session(session);
      if (!booking) return false;
      const room = await getRoomModel().findOneAndUpdate({ _id: booking.room_id },
        { $inc: { booking_version: 1 } }, { session });
      if (['PENDING', 'APPROVED'].includes(status)) {
        if (!room || room.status === 'MAINTENANCE') throw fail(409, 'Room is unavailable.');
        if (await BookingModel.exists({ _id: { $ne: booking._id }, room_id: booking.room_id,
          status: { $in: ['PENDING', 'APPROVED'] }, start_time: { $lt: booking.end_time },
          end_time: { $gt: booking.start_time },
        }).session(session)) throw fail(409, 'Room is already booked for this time slot.');
      }
      booking.status = status;
      await booking.save({ session });
      return true;
    });
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

  getNotificationsByUserId: async (userId) => {
    const rows = await Booking.getByUserId(userId);
    return rows.slice(0, 50).map((row) => ({
      id: row.id, booking_id: row.id, status: row.status.toLowerCase(),
      date: row.updated_at || row.created_at,
      message: `${row.status}: ${row.topic} (${row.room_name || 'Meeting room'})`,
    }));
  },

  getByStatus: async (status) => {
    const rows = await BookingModel.find({ status }).lean({ virtuals: true });
    return mapRoomName(rows);
  },

  findAllByUserOrGuest: async (userId, email, phone) => {
    const rows = await BookingModel.find({
      user_id: userId,
    })
      .sort({ start_time: -1 })
      .lean({ virtuals: true });
    return mapRoomName(rows);
  },
};

module.exports = Booking;
