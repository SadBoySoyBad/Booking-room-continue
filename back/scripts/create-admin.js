const db = require('../db');
const User = require('../models/User');
(async () => {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set ADMIN_EMAIL to the Google/Microsoft email you control.');
    await db.connectMongo();
    const existing = await User.findByEmail(email);
    if (existing) await User.update(existing.id, { role: 'admin' });
    else await User.create(process.env.ADMIN_NAME || email, email, null, 'admin');
    console.log('Admin account is ready. Use the registered OAuth provider to sign in.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { await db.disconnect(); }
})();
