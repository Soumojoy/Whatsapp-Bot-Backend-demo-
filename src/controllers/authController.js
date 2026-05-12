const authService = require('../services/authService');
const logger = require('../utils/logger');

const authController = {
  async signup(req, res) {
    logger.info('AuthController', 'POST /api/auth/signup');
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        logger.warn('AuthController', 'Missing required fields for signup');
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      if (password.length < 6) {
        logger.warn('AuthController', 'Password too short');
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const result = await authService.signup({ name, email, password });
      logger.info('AuthController', 'Signup successful');
      return res.status(201).json(result);
    } catch (err) {
      logger.error('AuthController', 'Signup failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },

  async login(req, res) {
    logger.info('AuthController', 'POST /api/auth/login');
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        logger.warn('AuthController', 'Missing email or password');
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.login({ email, password });
      logger.info('AuthController', 'Login successful');
      return res.status(200).json(result);
    } catch (err) {
      logger.error('AuthController', 'Login failed', err.message);
      return res.status(401).json({ error: err.message });
    }
  },

  async getProfile(req, res) {
    logger.info('AuthController', 'GET /api/auth/profile');
    try {
      const user = await authService.getProfile(req.user.userId);
      return res.status(200).json(user);
    } catch (err) {
      logger.error('AuthController', 'Get profile failed', err.message);
      return res.status(404).json({ error: err.message });
    }
  },
};

module.exports = authController;
