require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

// Start only when executed directly (local/dev). On Vercel serverless, the handler is exported.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access backend at http://localhost:${PORT}`);
  });
}

module.exports = app;

