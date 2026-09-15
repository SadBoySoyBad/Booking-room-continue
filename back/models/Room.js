// back/models/Room.js (MongoDB + Mongoose)
const mongoose = require('../db');
const { bangkokDate, dayBounds } = require('../utils/dates');
const { fail } = require('../utils/http');

const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    booking_version: { type: Number, default: 0, select: false },
    status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'], default: 'AVAILABLE' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

RoomSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const RoomModel = mongoose.model('Room', RoomSchema);
const getBookingModel = () => {
  if (mongoose.models.Booking) return mongoose.models.Booking;
  // Ensure schema is registered (Booking.js registers on require)
  require('./Booking');
  return mongoose.models.Booking;
};

const Room = {
  getAllWithCalculatedStatus: async (forDate = bangkokDate()) => {
    const rooms = await RoomModel.find().lean({ virtuals: true });
    const { start: dayStart, end: dayEnd } = dayBounds(forDate);
    const now = new Date();

    const results = await Promise.all(
      rooms.map(async (room) => {
        let displayStatus = room.status;
        let currentBooking = null;

        if (room.status === 'MAINTENANCE') {
          displayStatus = 'MAINTENANCE';
        } else {
          // live booking overlapping now
          const BookingModel = getBookingModel();
          const live = forDate === bangkokDate() ? await BookingModel.findOne({
            room_id: room.id,
            status: { $in: ['PENDING', 'APPROVED'] },
            start_time: { $lt: now },
            end_time: { $gt: now },
          })
            .select('id topic start_time end_time guest_name guest_company status user_id')
            .lean({ virtuals: true }) : null;

          if (live) {
            currentBooking = live;
            displayStatus = 'OCCUPIED';
          } else {
            // any booking on the date
            const BookingModel = getBookingModel();
            const hasBooking = await BookingModel.exists({
              room_id: room.id,
              status: { $in: ['PENDING', 'APPROVED'] },
              start_time: { $lt: dayEnd }, end_time: { $gt: dayStart },
            });
            displayStatus = hasBooking ? 'OCCUPIED' : 'AVAILABLE';
          }
        }

        return { ...room, display_status: displayStatus, current_booking: currentBooking };
      })
    );

    return results;
  },

  getById: async (id) => {
    return RoomModel.findById(id).lean({ virtuals: true });
  },

  create: async (name, status = 'AVAILABLE') => {
    const doc = await RoomModel.create({ name, status });
    return doc.toJSON();
  },

  update: async (id, name, status) => {
    const data = {};
    if (name !== undefined) data.name = name;
    if (status !== undefined) data.status = status;
    const result = await RoomModel.updateOne({ _id: id }, { $set: data }, { runValidators: true });
    return result.matchedCount > 0;
  },

  delete: async (id) => {
    return mongoose.connection.transaction(async (session) => {
      const room = await RoomModel.findOneAndUpdate({ _id: id }, { $inc: { booking_version: 1 } }, { session });
      if (!room) return false;
      if (await getBookingModel().exists({ room_id: id }).session(session)) throw fail(409, 'This room has booking history. Use maintenance status instead.');
      return (await RoomModel.deleteOne({ _id: id }, { session })).deletedCount > 0;
    });
  },
};

module.exports = Room;
