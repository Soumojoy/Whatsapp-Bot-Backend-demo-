const prisma = require('../config/db');
const logger = require('../utils/logger');

const flowRepository = {
  async create(data) {
    logger.info('FlowRepo', 'Creating flow', { title: data.optionTitle });
    try {
      const flow = await prisma.flow.create({ data });
      logger.info('FlowRepo', `Flow created: ${flow.id}`);
      return flow;
    } catch (err) {
      logger.error('FlowRepo', 'Failed to create flow', err.message);
      throw err;
    }
  },

  async findByBusinessId(businessId) {
    logger.info('FlowRepo', `Finding flows for business: ${businessId}`);
    try {
      const flows = await prisma.flow.findMany({
        where: { businessId },
        orderBy: { sortOrder: 'asc' },
      });
      logger.info('FlowRepo', `Found ${flows.length} flows`);
      return flows;
    } catch (err) {
      logger.error('FlowRepo', 'Failed to find flows', err.message);
      throw err;
    }
  },

  async update(id, data) {
    logger.info('FlowRepo', `Updating flow: ${id}`);
    try {
      const flow = await prisma.flow.update({ where: { id }, data });
      logger.info('FlowRepo', `Flow updated: ${flow.id}`);
      return flow;
    } catch (err) {
      logger.error('FlowRepo', 'Failed to update flow', err.message);
      throw err;
    }
  },

  async delete(id) {
    logger.info('FlowRepo', `Deleting flow: ${id}`);
    try {
      await prisma.flow.delete({ where: { id } });
      logger.info('FlowRepo', `Flow deleted: ${id}`);
      return true;
    } catch (err) {
      logger.error('FlowRepo', 'Failed to delete flow', err.message);
      throw err;
    }
  },
};

module.exports = flowRepository;
