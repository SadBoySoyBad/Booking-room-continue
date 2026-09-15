// back/models/User.js (MongoDB + Mongoose)
const mongoose = require('../db');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    password: { type: String, default: null },
    user_id: { type: Number, default: null }, // legacy field (unused)
    google_id: { type: String, unique: true, sparse: true },
    google_access_token: String,
    google_refresh_token: String,
    google_token_expiry: Date,
    microsoft_id: { type: String, unique: true, sparse: true },
    microsoft_access_token: String,
    microsoft_refresh_token: String,
    microsoft_token_expiry: Date,
    last_login_provider: { type: String, enum: ['google', 'microsoft', 'guest', null], default: null },
    role: { type: String, enum: ['employee', 'admin', 'guest'], default: 'employee' },
    phone: { type: String, unique: true, sparse: true },
    settings: {
      email_meeting_booked: { type: Number, default: 1 },
      email_reminders: { type: Number, default: 0 },
      reminder_minutes: { type: Number, default: 30, min: 1, max: 1440 },
      auto_add_calendar: { type: Number, default: 1 },
      update_calendar: { type: Number, default: 1 },
    },
    company: { type: String, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const UserModel = mongoose.model('User', UserSchema);

const User = {
  filter: (role, query = '') => {
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (query) {
      const text = String(query).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = ['username', 'email', 'phone', 'company'].map(field => ({ [field]: { $regex: text, $options: 'i' } }));
    }
    return filter;
  },
  getAll: async (role = null, page = 1, limit = 10, query = '') => {
    const filter = User.filter(role, query);
    const items = await UserModel.find(filter)
      .select('username email role phone company last_login_provider created_at')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true });
    return items;
  },

  getById: async (id) => {
    return UserModel.findById(id).lean({ virtuals: true });
  },

  create: async (username, email, password, role = 'employee', phone = null, company = null) => {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const doc = await UserModel.create({
      username,
      email: email || undefined,
      password: hashedPassword,
      role,
      phone: phone || undefined,
      company: company || null,
    });
    return doc.toJSON();
  },

  createGuest: async (username, phone, company = null) => {
    const doc = await UserModel.create({
      username,
      phone,
      company,
      role: 'guest',
      last_login_provider: 'guest',
    });
    return doc.toJSON();
  },

  update: async (id, data) => {
    const values = { ...data };
    const unset = {};
    for (const field of ['email', 'phone']) {
      if (values[field] === '' || values[field] === null) { unset[field] = 1; delete values[field]; }
    }
    const result = await UserModel.updateOne({ _id: id }, { $set: values, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { runValidators: true });
    return result.matchedCount > 0;
  },

  delete: async (id) => {
    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  findByUsernameOrEmail: async (identifier) => {
    return UserModel.findOne({ $or: [{ username: identifier }, { email: identifier }] }).lean({ virtuals: true });
  },

  findByPhone: async (phone) => {
    return UserModel.findOne({ phone }).lean({ virtuals: true });
  },

  findByGoogleId: async (googleId) => {
    return UserModel.findOne({ google_id: googleId }).lean({ virtuals: true });
  },

  findByMicrosoftId: async (microsoftId) => {
    return UserModel.findOne({ microsoft_id: microsoftId }).lean({ virtuals: true });
  },

  findByEmail: async (email) => {
    return UserModel.findOne({ email }).lean({ virtuals: true });
  },

  createOAuthUser: async (
    displayName,
    email,
    googleId,
    googleAccessToken,
    googleRefreshToken,
    googleTokenExpiry,
    microsoftId,
    microsoftAccessToken,
    microsoftRefreshToken,
    microsoftTokenExpiry,
    provider,
    company
  ) => {
    const doc = await UserModel.create({
      username: displayName,
      email: email || undefined,
      google_id: googleId || undefined,
      google_access_token: googleAccessToken || null,
      google_refresh_token: googleRefreshToken || null,
      google_token_expiry: googleTokenExpiry || null,
      microsoft_id: microsoftId || undefined,
      microsoft_access_token: microsoftAccessToken || null,
      microsoft_refresh_token: microsoftRefreshToken || null,
      microsoft_token_expiry: microsoftTokenExpiry || null,
      last_login_provider: provider,
      company: company || 'unknown',
      role: 'employee',
    });
    return doc.toJSON();
  },

  updateGoogleAuth: async (userId, googleId, accessToken, refreshToken, tokenExpiry) => {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          google_id: googleId || undefined,
          google_access_token: accessToken || null,
          ...(refreshToken ? { google_refresh_token: refreshToken } : {}),
          google_token_expiry: tokenExpiry || null,
          last_login_provider: 'google',
        },
      }
    );
  },

  updateMicrosoftAuth: async (userId, microsoftId, accessToken, refreshToken, tokenExpiry) => {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          microsoft_id: microsoftId || undefined,
          microsoft_access_token: accessToken || null,
          ...(refreshToken ? { microsoft_refresh_token: refreshToken } : {}),
          microsoft_token_expiry: tokenExpiry || null,
          last_login_provider: 'microsoft',
        },
      }
    );
  },
};

module.exports = User;
