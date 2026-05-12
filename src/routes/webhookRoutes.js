const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// Twilio hits this endpoint
router.post('/whatsapp', webhookController.handleIncoming);

// Test endpoint (no auth needed, for dev testing)
router.post('/test', webhookController.testWebhook);

module.exports = router;
