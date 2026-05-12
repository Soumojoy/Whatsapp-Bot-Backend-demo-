const prisma = require('../config/db');
const logger = require('../utils/logger');

const userRepository = {
  async create(data) {
    logger.info('UserRepo', 'Creating user', { email: data.email });
    try {
      const user = await prisma.user.create({ data });
      logger.info('UserRepo', `User created: ${user.id}`);
      return user;
    } catch (err) {
      logger.error('UserRepo', 'Failed to create user', err.message);
      throw err;
    }
  },

  async findByEmail(email) {
    logger.info('UserRepo', `Finding user by email: ${email}`);
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      logger.info('UserRepo', user ? `User found: ${user.id}` : 'User not found');
      return user;
    } catch (err) {
      logger.error('UserRepo', 'Failed to find user by email', err.message);
      throw err;
    }
  },

  async findById(id) {
    logger.info('UserRepo', `Finding user by id: ${id}`);
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      return user;
    } catch (err) {
      logger.error('UserRepo', 'Failed to find user by id', err.message);
      throw err;
    }
  },
};

module.exports = userRepository;
