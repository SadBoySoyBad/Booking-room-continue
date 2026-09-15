require('./config/env');
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);
// lean() skips virtuals and toJSON: normalize the API identifiers explicitly.
mongoose.plugin((schema) => {
  schema.post(['find', 'findOne', 'findOneAndUpdate'], function (result) {
    if (!this.mongooseOptions().lean) return;
    for (const row of Array.isArray(result) ? result : [result]) {
      if (!row) continue;
      if (row._id) row.id = String(row._id);
      for (const field of ['room_id', 'user_id']) {
        if (row[field] instanceof mongoose.Types.ObjectId) row[field] = String(row[field]);
      }
      delete row._id;
      delete row.__v;
    }
  });
});
let pending;
mongoose.connection.on('disconnected', () => { pending = null; });
mongoose.connectMongo = async () => {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!pending) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. See .env.example.');
    pending = mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || process.env.DB_NAME || 'booking',
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
      autoIndex: false,
    }).catch((error) => { pending = null; throw error; });
  }
  return pending;
};
mongoose.initializeDatabase = async ({ indexes = true } = {}) => {
  await mongoose.connectMongo();
  require('./models/Room'); require('./models/User'); require('./models/Booking');
  for (const model of Object.values(mongoose.models)) {
    await model.createCollection();
    if (indexes && process.env.NODE_ENV !== 'production') await model.createIndexes();
  }
  const Room = mongoose.models.Room;
  if (await Room.countDocuments() === 0) {
    await Room.bulkWrite([1, 2, 3, 4].map((n) => ({ updateOne: {
      filter: { name: `Meeting ${n}` },
      update: { $setOnInsert: { name: `Meeting ${n}`, status: 'AVAILABLE' } }, upsert: true,
    } })));
  }
};
module.exports = mongoose;
