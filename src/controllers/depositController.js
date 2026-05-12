const depositRepository = require('../repositories/depositRepository');
const businessRepository = require('../repositories/businessRepository');
const logger = require('../utils/logger');
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const depositController = {
  async getByBusiness(req, res) {
    logger.info('DepositController', `GET /api/deposits/${req.params.businessId}`);
    try {
      // Verify business belongs to user
      const business = await businessRepository.findById(req.params.businessId);
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }
      if (business.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const deposits = await depositRepository.findByBusinessId(req.params.businessId);
      return res.status(200).json(deposits);
    } catch (err) {
      logger.error('DepositController', 'Get deposits failed', err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  async updateStatus(req, res) {
    logger.info('DepositController', `PUT /api/deposits/${req.params.id}/status`);
    try {
      const { status } = req.body;
      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be pending, approved, or rejected' });
      }
      const deposit = await depositRepository.updateStatus(req.params.id, status);

      // Send WhatsApp notification to customer
      if (deposit.whatsappNumber && (status === 'approved' || status === 'rejected')) {
        let notifyMsg = '';
        if (status === 'approved') {
          notifyMsg = `\u2705 *Deposit Approved!*\n\nYour deposit of \u20b9${deposit.amount} (TXN: ${deposit.transactionId}) has been approved by the admin.\n\nThank you!`;
        } else {
          notifyMsg = `\u274c *Deposit Rejected*\n\nYour deposit of \u20b9${deposit.amount} (TXN: ${deposit.transactionId}) has been rejected.\n\nPlease contact support if you think this is an error.`;
        }

        try {
          await twilio.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: deposit.whatsappNumber,
            body: notifyMsg,
          });
          logger.info('DepositController', `WhatsApp notification sent to ${deposit.whatsappNumber}: ${status}`);
        } catch (twilioErr) {
          logger.error('DepositController', 'Failed to send WhatsApp notification', twilioErr.message);
        }
      }

      return res.status(200).json(deposit);
    } catch (err) {
      logger.error('DepositController', 'Update deposit status failed', err.message);
      return res.status(400).json({ error: err.message });
    }
  },
};

module.exports = depositController;
