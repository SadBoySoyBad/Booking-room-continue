const db = require('../db');
(async () => {
  try {
    await db.initializeDatabase({ indexes: false });
    // Explicit maintenance command, never drop/recreate indexes during a request.
    const User = db.models.User;
    const indexes = await User.collection.indexes();
    if (indexes.some(index => index.name === 'username_1' && index.unique)) await User.collection.dropIndex('username_1');
    for (const field of ['google_id', 'microsoft_id', 'email', 'phone']) {
      await User.updateMany({ [field]: { $type: 'null' } }, { $unset: { [field]: 1 } });
    }
    for (const model of Object.values(db.models)) await model.createIndexes();
    console.log('Database initialized and indexes verified.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { await db.disconnect(); }
})();
