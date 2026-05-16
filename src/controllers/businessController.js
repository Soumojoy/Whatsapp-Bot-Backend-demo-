const businessService = require('../services/businessService');
const onboardRepository = require('../repositories/onboardRepository');
const chatRepository = require('../repositories/chatRepository');
const paymentOptionRepository = require('../repositories/paymentOptionRepository');
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

  async getChats(req, res) {
    logger.info('BusinessController', `GET /api/business/${req.params.id}/chats`);
    try {
      await businessService.getBusinessById(req.params.id, req.user.userId);
      const chats = await chatRepository.findByBusinessId(req.params.id);
      return res.status(200).json(chats);
    } catch (err) {
      logger.error('BusinessController', 'Get chats failed', err.message);
      const status = err.message.includes('not found') ? 404 : 403;
      return res.status(status).json({ error: err.message });
    }
  },

  async getPaymentOptions(req, res) {
    logger.info('BusinessController', `GET /api/business/${req.params.id}/payment-options`);
    try {
      await businessService.getBusinessById(req.params.id, req.user.userId);
      const options = await paymentOptionRepository.findByBusinessId(req.params.id);
      return res.status(200).json(options);
    } catch (err) {
      logger.error('BusinessController', 'Get payment options failed', err.message);
      const status = err.message.includes('not found') ? 404 : 403;
      return res.status(status).json({ error: err.message });
    }
  },

  async createPaymentOption(req, res) {
    logger.info('BusinessController', `POST /api/business/${req.params.id}/payment-options`);
    try {
      await businessService.getBusinessById(req.params.id, req.user.userId);
      const { batchId, paymentLink, qrImageUrl } = req.body;
      if (!paymentLink && !qrImageUrl) {
        return res.status(400).json({ error: 'At least one of paymentLink or qrImageUrl is required' });
      }
      const option = await paymentOptionRepository.create({
        businessId: req.params.id,
        batchId: batchId || '',
        paymentLink: paymentLink || '',
        qrImageUrl: qrImageUrl || '',
      });
      return res.status(201).json(option);
    } catch (err) {
      logger.error('BusinessController', 'Create payment option failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },

  async updatePaymentOption(req, res) {
    logger.info('BusinessController', `PUT /api/business/${req.params.id}/payment-options/${req.params.optionId}`);
    try {
      await businessService.getBusinessById(req.params.id, req.user.userId);
      const { batchId, paymentLink, qrImageUrl } = req.body;
      if (!paymentLink && !qrImageUrl) {
        return res.status(400).json({ error: 'At least one of paymentLink or qrImageUrl is required' });
      }
      const option = await paymentOptionRepository.update(req.params.optionId, {
        batchId: batchId !== undefined ? batchId : undefined,
        paymentLink: paymentLink !== undefined ? paymentLink : undefined,
        qrImageUrl: qrImageUrl !== undefined ? qrImageUrl : undefined,
      });
      return res.status(200).json(option);
    } catch (err) {
      logger.error('BusinessController', 'Update payment option failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },

  async deletePaymentOption(req, res) {
    logger.info('BusinessController', `DELETE /api/business/${req.params.id}/payment-options/${req.params.optionId}`);
    try {
      await businessService.getBusinessById(req.params.id, req.user.userId);
      await paymentOptionRepository.delete(req.params.optionId);
      return res.status(200).json({ message: 'Payment option deleted' });
    } catch (err) {
      logger.error('BusinessController', 'Delete payment option failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },
};

module.exports = businessController;
