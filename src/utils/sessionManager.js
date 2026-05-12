const logger = require('./logger');

// In-memory conversation state for multi-step flows (deposit)
// Key: customerNumber (e.g. "whatsapp:+917431099084")
// Value: { businessId, step, data: { name, number, transactionId, amount } }
const sessions = new Map();

const sessionManager = {
  get(customerNumber) {
    const session = sessions.get(customerNumber);
    logger.debug('SessionManager', `Get session for ${customerNumber}:`, session ? JSON.stringify(session) : 'none');
    return session || null;
  },

  set(customerNumber, sessionData) {
    sessions.set(customerNumber, sessionData);
    logger.info('SessionManager', `Session set for ${customerNumber}: step=${sessionData.step}`);
  },

  update(customerNumber, updates) {
    const existing = sessions.get(customerNumber);
    if (existing) {
      const updated = { ...existing, ...updates, data: { ...existing.data, ...updates.data } };
      sessions.set(customerNumber, updated);
      logger.info('SessionManager', `Session updated for ${customerNumber}: step=${updated.step}`);
      return updated;
    }
    return null;
  },

  clear(customerNumber) {
    sessions.delete(customerNumber);
    logger.info('SessionManager', `Session cleared for ${customerNumber}`);
  },

  has(customerNumber) {
    return sessions.has(customerNumber);
  },
};

module.exports = sessionManager;
