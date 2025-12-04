// back/db.js - MongoDB connection via Mongoose
require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('[DB] Missing MONGODB_URI env. Please set it to your MongoDB Atlas connection string.');
}

mongoose.set('strictQuery', true);

async function connectMongo() {
  try {
    console.log('[DB] Connecting to MongoDB...', { nodeEnv: process.env.NODE_ENV });
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
    });
    console.log('[DB] Connected to MongoDB Atlas');

    // Seed default rooms if empty (Meeting 1-4) for fresh databases
    try {
      // ensure Room model is registered, then pull from mongoose.models
      require('./models/Room');
      const RoomModel = mongoose.models.Room;
      const roomCount = await RoomModel.countDocuments();
      if (roomCount === 0) {
        await RoomModel.insertMany([
          { name: 'Meeting 1', status: 'AVAILABLE' },
          { name: 'Meeting 2', status: 'AVAILABLE' },
          { name: 'Meeting 3', status: 'AVAILABLE' },
          { name: 'Meeting 4', status: 'AVAILABLE' },
        ]);
        console.log('[DB] Seeded default rooms (Meeting 1-4)');
      }
    } catch (seedErr) {
      console.warn('[DB] Seed rooms skipped:', seedErr.message);
    }
  } catch (err) {
    console.error('[DB] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

connectMongo();

module.exports = mongoose;
