const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const exchangesController = require('./exchangesControllers');

const router = Router();

router.get('/stock/:eid', authMiddleware.requireAuth, exchangesController.exchanges_stock_detail);
router.get('/crypto/:eid', authMiddleware.requireAuth, exchangesController.exchanges_crypto_detail);
router.get('/cash/:eid', authMiddleware.requireAuth, exchangesController.exchanges_cash_detail);

module.exports = router;