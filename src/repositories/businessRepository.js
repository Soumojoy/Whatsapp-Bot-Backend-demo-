const prisma = require('../config/db');
const logger = require('../utils/logger');

const businessRepository = {
  async create(data) {
    logger.info('BusinessRepo', 'Creating business', { name: data.businessName });
    try {
      const business = await prisma.business.create({ data });
      logger.info('BusinessRepo', `Business created: ${business.id}`);
      return business;
    } catch (err) {
      logger.error('BusinessRepo', 'Failed to create business', err.message);
      throw err;
    }
  },

  async findByUserId(userId) {
    logger.info('BusinessRepo', `Finding businesses for user: ${userId}`);
    try {
      const businesses = await prisma.business.findMany({
        where: { userId },
        include: { flows: true },
      });
      logger.info('BusinessRepo', `Found ${businesses.length} businesses`);
      return businesses;
    } catch (err) {
      logger.error('BusinessRepo', 'Failed to find businesses', err.message);
      throw err;
    }
  },

  async findById(id) {
    logger.info('BusinessRepo', `Finding business: ${id}`);
    try {
      const business = await prisma.business.findUnique({
        where: { id },
        include: { flows: true, documents: true },
      });
      return business;
    } catch (err) {
      logger.error('BusinessRepo', 'Failed to find business', err.message);
      throw err;
    }
  },

  async findBySlug(slug) {
    logger.info('BusinessRepo', `Finding business by slug: ${slug}`);
    try {
      const business = await prisma.business.findUnique({
        where: { businessSlug: slug },
        include: { flows: { orderBy: { sortOrder: 'asc' } } },
      });
      logger.info('BusinessRepo', business ? `Found: ${business.businessName}` : 'Not found');
      return business;
    } catch (err) {
      logger.error('BusinessRepo', 'Failed to find business by slug', err.message);
      throw err;
    }
  },

  async update(id, data) {
    logger.info('BusinessRepo', `Updating business: ${id}`);
    try {
      const business = await prisma.business.update({
        where: { id },
        data,
        include: { flows: true },
      });
      logger.info('BusinessRepo', `Business updated: ${business.id}`);
      return business;
    } catch (err) {
      logger.error('BusinessRepo', 'Failed to update business', err.message);
      throw err;
    }
  },

  async delete(id) {
    logger.info('BusinessRepo', `Deleting business: ${id}`);
    try {
      await prisma.business.delete({ where: { id } });
      logger.info('BusinessRepo', `Business deleted: ${id}`);
      return true;
    } catch (err) {
      logger.error('BusinessRepo', 'Failed to delete business', err.message);
      throw err;
    }
  },
};

module.exports = businessRepository;
