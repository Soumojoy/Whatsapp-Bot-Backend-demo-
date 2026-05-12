const businessRepository = require('../repositories/businessRepository');
const logger = require('../utils/logger');

const businessService = {
  async createBusiness(userId, data) {
    logger.info('BusinessService', `Creating business for user: ${userId}`);

    const slug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .trim();

    if (!slug) {
      throw new Error('Invalid business name for slug generation');
    }

    const business = await businessRepository.create({
      userId,
      businessName: data.businessName,
      botName: data.botName || 'Professor',
      virtualNumber: data.virtualNumber || '+1 415 523 8886',
      businessSlug: slug,
      greetingMessage: data.greetingMessage || `Hi 👋\nI am Professor from ${data.businessName}.`,
    });

    logger.info('BusinessService', `Business created with slug: ${slug}`);
    return business;
  },

  async getBusinessesByUser(userId) {
    logger.info('BusinessService', `Fetching businesses for user: ${userId}`);
    return businessRepository.findByUserId(userId);
  },

  async getBusinessById(id, userId) {
    logger.info('BusinessService', `Fetching business: ${id}`);
    const business = await businessRepository.findById(id);

    if (!business) {
      throw new Error('Business not found');
    }
    if (business.userId !== userId) {
      throw new Error('Unauthorized access to business');
    }

    return business;
  },

  async updateBusiness(id, userId, data) {
    logger.info('BusinessService', `Updating business: ${id}`);
    const business = await businessRepository.findById(id);

    if (!business) {
      throw new Error('Business not found');
    }
    if (business.userId !== userId) {
      throw new Error('Unauthorized access to business');
    }

    return businessRepository.update(id, {
      businessName: data.businessName,
      botName: data.botName,
      greetingMessage: data.greetingMessage,
      paymentQrUrl: data.paymentQrUrl,
    });
  },

  async deleteBusiness(id, userId) {
    logger.info('BusinessService', `Deleting business: ${id}`);
    const business = await businessRepository.findById(id);

    if (!business) {
      throw new Error('Business not found');
    }
    if (business.userId !== userId) {
      throw new Error('Unauthorized access to business');
    }

    return businessRepository.delete(id);
  },

  async getBusinessBySlug(slug) {
    logger.info('BusinessService', `Fetching business by slug: ${slug}`);
    return businessRepository.findBySlug(slug);
  },
};

module.exports = businessService;
