const prisma = require('../config/db');
const logger = require('../utils/logger');

const chatRepository = {
  async create(data) {
    logger.info('ChatRepo', 'Saving chat', { businessId: data.businessId });
    try {
      const chat = await prisma.chat.create({ data });
      logger.info('ChatRepo', `Chat saved: ${chat.id}`);
      return chat;
    } catch (err) {
      logger.error('ChatRepo', 'Failed to save chat', err.message);
      throw err;
    }
  },

  async findLastByCustomer(customerNumber) {
    logger.info('ChatRepo', `Finding last chat for customer: ${customerNumber}`);
    try {
      const chat = await prisma.chat.findFirst({
        where: { customerNumber },
        orderBy: { timestamp: 'desc' },
      });
      logger.info('ChatRepo', chat ? `Last chat found for business: ${chat.businessId}` : 'No previous chat');
      return chat;
    } catch (err) {
      logger.error('ChatRepo', 'Failed to find last chat', err.message);
      throw err;
    }
  },

  async findByBusinessId(businessId) {
    logger.info('ChatRepo', `Finding chats for business: ${businessId}`);
    try {
      const chats = await prisma.chat.findMany({
        where: { businessId },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
      logger.info('ChatRepo', `Found ${chats.length} chats`);
      return chats;
    } catch (err) {
      logger.error('ChatRepo', 'Failed to find chats', err.message);
      throw err;
    }
  },
};

module.exports = chatRepository;
