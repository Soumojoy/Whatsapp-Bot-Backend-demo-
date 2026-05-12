const webhookService = require('../services/webhookService');
const logger = require('../utils/logger');

const webhookController = {
  async handleIncoming(req, res) {
    logger.info('WebhookController', 'POST /api/webhook/whatsapp');
    logger.debug('WebhookController', 'Request body:', JSON.stringify(req.body));

    try {
      const from = req.body.From || req.body.from || '';
      const body = req.body.Body || req.body.body || '';

      logger.info('WebhookController', `From: ${from}, Body: "${body}"`);

      if (!body) {
        logger.warn('WebhookController', 'Empty message body');
        return res.status(400).json({ error: 'Message body is required' });
      }

      const result = await webhookService.processIncoming(from, body);

      // Escape XML special characters for valid TwiML
      const escapeXml = (str) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      // Twilio expects TwiML response
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(result.message)}</Message>
</Response>`;

      res.set('Content-Type', 'text/xml');
      return res.status(200).send(twiml);
    } catch (err) {
      logger.error('WebhookController', 'Webhook processing failed', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Test endpoint to simulate webhook without Twilio
  async testWebhook(req, res) {
    logger.info('WebhookController', 'POST /api/webhook/test');
    try {
      const { from, body } = req.body;
      const result = await webhookService.processIncoming(from || 'test_user', body || '');
      return res.status(200).json(result);
    } catch (err) {
      logger.error('WebhookController', 'Test webhook failed', err.message);
      return res.status(500).json({ error: err.message });
    }
  },
};

module.exports = webhookController;
