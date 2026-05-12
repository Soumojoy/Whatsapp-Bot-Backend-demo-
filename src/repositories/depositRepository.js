const prisma = require('../config/db');
const logger = require('../utils/logger');

const depositRepository = {
  async create(data) {
    logger.info('DepositRepo', 'Creating deposit', { customerName: data.customerName, transactionId: data.transactionId });
    try {
      const deposit = await prisma.deposit.create({ data });
      logger.info('DepositRepo', `Deposit created: ${deposit.id}`);
      return deposit;
    } catch (err) {
      logger.error('DepositRepo', 'Failed to create deposit', err.message);
      throw err;
    }
  },

  async findByBusinessId(businessId) {
    logger.info('DepositRepo', `Finding deposits for business: ${businessId}`);
    try {
      const deposits = await prisma.deposit.findMany({
        where: { businessId },
        orderBy: { timestamp: 'desc' },
      });
      logger.info('DepositRepo', `Found ${deposits.length} deposits`);
      return deposits;
    } catch (err) {
      logger.error('DepositRepo', 'Failed to find deposits', err.message);
      throw err;
    }
  },

  async findByTransactionId(transactionId) {
    logger.info('DepositRepo', `Finding deposit by txn: ${transactionId}`);
    try {
      const deposit = await prisma.deposit.findUnique({
        where: { transactionId },
      });
      return deposit;
    } catch (err) {
      logger.error('DepositRepo', 'Failed to find deposit by txn', err.message);
      throw err;
    }
  },

  async updateStatus(id, status) {
    logger.info('DepositRepo', `Updating deposit ${id} status to ${status}`);
    try {
      const deposit = await prisma.deposit.update({
        where: { id },
        data: { status },
      });
      return deposit;
    } catch (err) {
      logger.error('DepositRepo', 'Failed to update deposit status', err.message);
      throw err;
    }
  },
};

module.exports = depositRepository;
