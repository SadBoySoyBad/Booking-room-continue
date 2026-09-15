const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
// Optional process-local resolver override for networks that reject SRV queries.
// Leave unset on hosts whose default DNS works (including normal Vercel setups).
if (process.env.DNS_SERVERS) {
  const servers = process.env.DNS_SERVERS.split(',').map(value => value.trim()).filter(Boolean);
  require('node:dns').setServers(servers);
  require('node:dns/promises').setServers(servers);
}
