const express = require('express');
const flowController = require('../controllers/flowController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, flowController.create);
router.get('/:businessId', authMiddleware, flowController.getByBusiness);
router.put('/:id', authMiddleware, flowController.update);
router.delete('/:id', authMiddleware, flowController.remove);

module.exports = router;
