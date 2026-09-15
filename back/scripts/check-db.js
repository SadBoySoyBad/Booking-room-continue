const dns = require('node:dns/promises');
const db = require('../db');

// Read-only deployment diagnostic. Never print the URI, credentials or documents.
(async () => {
  let stage = 'configuration';
  try {
    if (!process.env.MONGODB_URI) throw Object.assign(new Error(), { code: 'MONGODB_URI_MISSING' });
    const uri = new URL(process.env.MONGODB_URI);
    if (uri.protocol === 'mongodb+srv:') {
      stage = 'dns';
      const records = await dns.resolveSrv(`_mongodb._tcp.${uri.hostname}`);
      console.log(JSON.stringify({ stage, status: 'ok', host: uri.hostname, records: records.length }));
    }
    stage = 'connection';
    await db.connectMongo();
    await db.connection.db.admin().ping();
    console.log(JSON.stringify({ stage, status: 'ok', database: db.connection.name }));
    stage = 'collections';
    const collections = await db.connection.db.listCollections({}, { nameOnly: true }).toArray();
    for (const name of ['users', 'rooms', 'bookings']) {
      const exists = collections.some(collection => collection.name === name);
      const count = exists ? await db.connection.db.collection(name).countDocuments() : 0;
      console.log(JSON.stringify({ stage, collection: name, exists, documents: count }));
    }
  } catch (error) {
    console.error(JSON.stringify({ stage, status: 'failed',
      code: error.code || error.cause?.code || error.name,
      hint: stage === 'dns' ? 'Check Atlas cluster state and copy its current connection hostname.' :
        stage === 'configuration' ? 'Set MONGODB_URI in the backend environment.' :
          'Check database name, credentials, network access and database permissions in Atlas.' }));
    process.exitCode = 1;
  } finally { await db.disconnect(); }
})();
