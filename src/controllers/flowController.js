const flowService = require('../services/flowService');
const logger = require('../utils/logger');

const flowController = {
  async create(req, res) {
    logger.info('FlowController', 'POST /api/flows');
    try {
      const { businessId, optionTitle, replyType, replyValue, sortOrder } = req.body;

      if (!businessId || !optionTitle || !replyValue) {
        logger.warn('FlowController', 'Missing required fields');
        return res.status(400).json({ error: 'businessId, optionTitle, and replyValue are required' });
      }

      const flow = await flowService.createFlow(req.user.userId, {
        businessId,
        optionTitle,
        replyType,
        replyValue,
        sortOrder,
      });

      logger.info('FlowController', `Flow created: ${flow.id}`);
      return res.status(201).json(flow);
    } catch (err) {
      logger.error('FlowController', 'Create flow failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },

  async getByBusiness(req, res) {
    logger.info('FlowController', `GET /api/flows/${req.params.businessId}`);
    try {
      const flows = await flowService.getFlowsByBusiness(req.params.businessId, req.user.userId);
      return res.status(200).json(flows);
    } catch (err) {
      logger.error('FlowController', 'Get flows failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    logger.info('FlowController', `PUT /api/flows/${req.params.id}`);
    try {
      const flow = await flowService.updateFlow(req.params.id, req.user.userId, req.body);
      return res.status(200).json(flow);
    } catch (err) {
      logger.error('FlowController', 'Update flow failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    logger.info('FlowController', `DELETE /api/flows/${req.params.id}`);
    try {
      await flowService.deleteFlow(req.params.id, req.user.userId);
      return res.status(200).json({ message: 'Flow deleted successfully' });
    } catch (err) {
      logger.error('FlowController', 'Delete flow failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },
};

module.exports = flowController;
