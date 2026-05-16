const express = require('express');
const businessController = require('../controllers/businessController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, businessController.create);
router.get('/', authMiddleware, businessController.getAll);
router.get('/:id', authMiddleware, businessController.getById);
router.put('/:id', authMiddleware, businessController.update);
router.delete('/:id', authMiddleware, businessController.remove);
router.get('/:id/onboard-accounts', authMiddleware, businessController.getOnboardAccounts);
router.get('/:id/chats', authMiddleware, businessController.getChats);
router.get('/:id/payment-options', authMiddleware, businessController.getPaymentOptions);
router.post('/:id/payment-options', authMiddleware, businessController.createPaymentOption);
router.put('/:id/payment-options/:optionId', authMiddleware, businessController.updatePaymentOption);
router.delete('/:id/payment-options/:optionId', authMiddleware, businessController.deletePaymentOption);

module.exports = router;
