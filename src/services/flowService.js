const flowRepository = require('../repositories/flowRepository');
const businessRepository = require('../repositories/businessRepository');
const logger = require('../utils/logger');

const flowService = {
  async createFlow(userId, data) {
    logger.info('FlowService', `Creating flow for business: ${data.businessId}`);

    const business = await businessRepository.findById(data.businessId);
    if (!business) {
      throw new Error('Business not found');
    }
    if (business.userId !== userId) {
      throw new Error('Unauthorized access to business');
    }

    return flowRepository.create({
      businessId: data.businessId,
      optionTitle: data.optionTitle,
      replyType: data.replyType || 'text',
      replyValue: data.replyValue,
      sortOrder: data.sortOrder || 0,
    });
  },

  async getFlowsByBusiness(businessId, userId) {
    logger.info('FlowService', `Fetching flows for business: ${businessId}`);

    const business = await businessRepository.findById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }
    if (business.userId !== userId) {
      throw new Error('Unauthorized access to business');
    }

    return flowRepository.findByBusinessId(businessId);
  },

  async updateFlow(flowId, userId, data) {
    logger.info('FlowService', `Updating flow: ${flowId}`);
    return flowRepository.update(flowId, {
      optionTitle: data.optionTitle,
      replyType: data.replyType,
      replyValue: data.replyValue,
      sortOrder: data.sortOrder,
    });
  },

  async deleteFlow(flowId, userId) {
    logger.info('FlowService', `Deleting flow: ${flowId}`);
    return flowRepository.delete(flowId);
  },
};

module.exports = flowService;
