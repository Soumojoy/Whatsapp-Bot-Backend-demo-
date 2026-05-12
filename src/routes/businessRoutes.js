const express = require('express');
const businessController = require('../controllers/businessController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, businessController.create);
router.get('/', authMiddleware, businessController.getAll);
router.get('/:id', authMiddleware, businessController.getById);
router.put('/:id', authMiddleware, businessController.update);
router.delete('/:id', authMiddleware, businessController.remove);

module.exports = router;
