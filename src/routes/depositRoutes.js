const express = require('express');
const depositController = require('../controllers/depositController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/:businessId', authMiddleware, depositController.getByBusiness);
router.put('/:id/status', authMiddleware, depositController.updateStatus);

module.exports = router;
