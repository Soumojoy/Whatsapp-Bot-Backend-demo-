const logger = {
  info: (context, message, data = '') => {
    console.log(`[${new Date().toISOString()}] [INFO] [${context}] ${message}`, data);
  },
  error: (context, message, error = '') => {
    console.error(`[${new Date().toISOString()}] [ERROR] [${context}] ${message}`, error);
  },
  warn: (context, message, data = '') => {
    console.warn(`[${new Date().toISOString()}] [WARN] [${context}] ${message}`, data);
  },
  debug: (context, message, data = '') => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] [DEBUG] [${context}] ${message}`, data);
    }
  },
};

module.exports = logger;
