// back/models/Room.js (MongoDB + Mongoose)
const mongoose = require('../db');

const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
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
  getAllWithCalculatedStatus: async (forDate = new Date().toISOString().split('T')[0]) => {
    const rooms = await RoomModel.find().lean({ virtuals: true });
    const dayStart = new Date(`${forDate}T00:00:00.000Z`);
    const dayEnd = new Date(`${forDate}T23:59:59.999Z`);
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
          const live = await BookingModel.findOne({
            room_id: room.id,
            status: { $in: ['PENDING', 'APPROVED'] },
            start_time: { $lt: now },
            end_time: { $gt: now },
          })
            .select('id topic start_time end_time guest_name guest_company status')
            .lean({ virtuals: true });

          if (live) {
            currentBooking = live;
            displayStatus = 'OCCUPIED';
          } else {
            // any booking on the date
            const BookingModel = getBookingModel();
            const hasBooking = await BookingModel.exists({
              room_id: room.id,
              status: { $in: ['PENDING', 'APPROVED'] },
              $or: [
                { start_time: { $gte: dayStart, $lte: dayEnd } },
                { end_time: { $gte: dayStart, $lte: dayEnd } },
              ],
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
    const result = await RoomModel.updateOne({ _id: id }, { $set: { name, status } });
    return result.modifiedCount > 0;
  },

  delete: async (id) => {
    const result = await RoomModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },
};

module.exports = Room;
