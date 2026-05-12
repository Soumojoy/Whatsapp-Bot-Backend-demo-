const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const logger = require('../utils/logger');

const authService = {
  async signup({ name, email, password }) {
    logger.info('AuthService', `Signup attempt for: ${email}`);

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      logger.warn('AuthService', `Email already exists: ${email}`);
      throw new Error('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    logger.info('AuthService', 'Password hashed successfully');

    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('AuthService', `Signup successful for: ${user.id}`);
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },

  async login({ email, password }) {
    logger.info('AuthService', `Login attempt for: ${email}`);

    const user = await userRepository.findByEmail(email);
    if (!user) {
      logger.warn('AuthService', `User not found: ${email}`);
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('AuthService', `Invalid password for: ${email}`);
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('AuthService', `Login successful for: ${user.id}`);
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },

  async getProfile(userId) {
    logger.info('AuthService', `Fetching profile for: ${userId}`);
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },
};

module.exports = authService;
