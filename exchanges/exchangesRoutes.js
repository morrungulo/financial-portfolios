const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const { provideExchangeStock, provideExchangeCrypto, provideExchangeForex } = require('./exchangesMiddleware');
const exchangesController = require('./exchangesControllers');

const router = Router();

router.get('/stock/:eid', authMiddleware.requireAuth, provideExchangeStock, exchangesController.exchanges_detail);
router.get('/crypto/:eid', authMiddleware.requireAuth, provideExchangeCrypto, exchangesController.exchanges_detail);
router.get('/cash/:eid', authMiddleware.requireAuth, provideExchangeForex, exchangesController.exchanges_detail);

module.exports = router;