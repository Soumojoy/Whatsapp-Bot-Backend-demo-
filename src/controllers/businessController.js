const businessService = require('../services/businessService');
const onboardRepository = require('../repositories/onboardRepository');
const logger = require('../utils/logger');

const businessController = {
  async create(req, res) {
    logger.info('BusinessController', 'POST /api/business');
    try {
      const { businessName, botName, virtualNumber, greetingMessage } = req.body;

      if (!businessName) {
        logger.warn('BusinessController', 'Business name is required');
        return res.status(400).json({ error: 'Business name is required' });
      }

      const business = await businessService.createBusiness(req.user.userId, {
        businessName,
        botName,
        virtualNumber,
        greetingMessage,
      });

      logger.info('BusinessController', `Business created: ${business.id}`);
      return res.status(201).json(business);
    } catch (err) {
      logger.error('BusinessController', 'Create business failed', err.message);
      const status = err.message.includes('Unique constraint') ? 409 : 400;
      return res.status(status).json({ error: err.message });
    }
  },

  async getAll(req, res) {
    logger.info('BusinessController', 'GET /api/business');
    try {
      const businesses = await businessService.getBusinessesByUser(req.user.userId);
      return res.status(200).json(businesses);
    } catch (err) {
      logger.error('BusinessController', 'Get businesses failed', err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    logger.info('BusinessController', `GET /api/business/${req.params.id}`);
    try {
      const business = await businessService.getBusinessById(req.params.id, req.user.userId);
      return res.status(200).json(business);
    } catch (err) {
      logger.error('BusinessController', 'Get business failed', err.message);
      const status = err.message.includes('not found') ? 404 : 403;
      return res.status(status).json({ error: err.message });
    }
  },

  async update(req, res) {
    logger.info('BusinessController', `PUT /api/business/${req.params.id}`);
    try {
      const business = await businessService.updateBusiness(
        req.params.id,
        req.user.userId,
        req.body
      );
      return res.status(200).json(business);
    } catch (err) {
      logger.error('BusinessController', 'Update business failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    logger.info('BusinessController', `DELETE /api/business/${req.params.id}`);
    try {
      await businessService.deleteBusiness(req.params.id, req.user.userId);
      return res.status(200).json({ message: 'Business deleted successfully' });
    } catch (err) {
      logger.error('BusinessController', 'Delete business failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },

  async getOnboardAccounts(req, res) {
    logger.info('BusinessController', `GET /api/business/${req.params.id}/onboard-accounts`);
    try {
      // Verify ownership
      await businessService.getBusinessById(req.params.id, req.user.userId);
      const accounts = await onboardRepository.findByBusinessId(req.params.id);
      return res.status(200).json(accounts);
    } catch (err) {
      logger.error('BusinessController', 'Get onboard accounts failed', err.message);
      const status = err.message.includes('not found') ? 404 : 403;
      return res.status(status).json({ error: err.message });
    }
  },
};

module.exports = businessController;
