const prisma = require('../config/db');
const logger = require('../utils/logger');

const paymentOptionRepository = {
  async create(data) {
    logger.info('PaymentOptionRepo', 'Creating payment option', { batchId: data.batchId });
    try {
      const option = await prisma.paymentOption.create({ data });
      logger.info('PaymentOptionRepo', `Payment option created: ${option.id}`);
      return option;
    } catch (err) {
      logger.error('PaymentOptionRepo', 'Failed to create payment option', err.message);
      throw err;
    }
  },

  async findByBusinessId(businessId) {
    logger.info('PaymentOptionRepo', `Finding payment options for business: ${businessId}`);
    try {
      const options = await prisma.paymentOption.findMany({
        where: { businessId },
        orderBy: { createdAt: 'asc' },
      });
      logger.info('PaymentOptionRepo', `Found ${options.length} payment options`);
      return options;
    } catch (err) {
      logger.error('PaymentOptionRepo', 'Failed to find payment options', err.message);
      throw err;
    }
  },

  async findMatchingBatch(businessId, userId) {
    logger.info('PaymentOptionRepo', `Finding batch match for userId: ${userId}`);
    try {
      const options = await prisma.paymentOption.findMany({
        where: { businessId },
        orderBy: { createdAt: 'asc' },
      });
      // Match: userId starts with batchId (case-insensitive)
      const userIdLower = userId.toLowerCase();
      const match = options.find(
        (opt) => opt.batchId && userIdLower.startsWith(opt.batchId.toLowerCase())
      );
      logger.info('PaymentOptionRepo', match ? `Matched batch: ${match.batchId}` : 'No batch match');
      return match || null;
    } catch (err) {
      logger.error('PaymentOptionRepo', 'Failed to match batch', err.message);
      throw err;
    }
  },

  async update(id, data) {
    logger.info('PaymentOptionRepo', `Updating payment option: ${id}`);
    try {
      const option = await prisma.paymentOption.update({
        where: { id },
        data,
      });
      logger.info('PaymentOptionRepo', `Payment option updated: ${option.id}`);
      return option;
    } catch (err) {
      logger.error('PaymentOptionRepo', 'Failed to update payment option', err.message);
      throw err;
    }
  },

  async delete(id) {
    logger.info('PaymentOptionRepo', `Deleting payment option: ${id}`);
    try {
      await prisma.paymentOption.delete({ where: { id } });
      logger.info('PaymentOptionRepo', `Payment option deleted: ${id}`);
      return true;
    } catch (err) {
      logger.error('PaymentOptionRepo', 'Failed to delete payment option', err.message);
      throw err;
    }
  },

  async deleteByBusinessId(businessId) {
    logger.info('PaymentOptionRepo', `Deleting all payment options for business: ${businessId}`);
    try {
      const result = await prisma.paymentOption.deleteMany({ where: { businessId } });
      logger.info('PaymentOptionRepo', `Deleted ${result.count} payment options`);
      return result;
    } catch (err) {
      logger.error('PaymentOptionRepo', 'Failed to delete payment options', err.message);
      throw err;
    }
  },
};

module.exports = paymentOptionRepository;
