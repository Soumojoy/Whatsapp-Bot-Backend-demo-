require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info('Server', `🚀 Professor Bot Backend running on port ${PORT}`);
  logger.info('Server', `📋 Health check: http://localhost:${PORT}/api/health`);
  logger.info('Server', `🔐 Auth API: http://localhost:${PORT}/api/auth`);
  logger.info('Server', `🏢 Business API: http://localhost:${PORT}/api/business`);
  logger.info('Server', `🔄 Flow API: http://localhost:${PORT}/api/flows`);
  logger.info('Server', `📱 Webhook API: http://localhost:${PORT}/api/webhook`);
});
