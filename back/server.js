require('./config/env');
const app = require('./app');

const PORT = process.env.PORT || 3001;

// Start only when executed directly (local/dev). On Vercel serverless, the handler is exported.
if (require.main === module) {
  require('./db').initializeDatabase().then(() => app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access backend at http://localhost:${PORT}`);
  })).catch((error) => { console.error('Startup failed:', error.message); process.exitCode = 1; });
}

module.exports = app;

