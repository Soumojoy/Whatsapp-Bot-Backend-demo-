const prisma = require('../config/db');
const logger = require('../utils/logger');

const onboardRepository = {
  async create(data) {
    logger.info('OnboardRepo', 'Creating onboard account', { name: data.customerName });
    try {
      const account = await prisma.onboardAccount.create({ data });
      logger.info('OnboardRepo', `Onboard account created: ${account.id}`);
      return account;
    } catch (err) {
      logger.error('OnboardRepo', 'Failed to create onboard account', err.message);
      throw err;
    }
  },

  async findByBusinessId(businessId) {
    logger.info('OnboardRepo', `Finding onboard accounts for business: ${businessId}`);
    try {
      const accounts = await prisma.onboardAccount.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
      });
      logger.info('OnboardRepo', `Found ${accounts.length} onboard accounts`);
      return accounts;
    } catch (err) {
      logger.error('OnboardRepo', 'Failed to find onboard accounts', err.message);
      throw err;
    }
  },
};

module.exports = onboardRepository;
