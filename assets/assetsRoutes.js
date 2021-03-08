const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const assetsController = require('./assetsControllers');
const { provideAssetStock, provideAssetCrypto, provideAssetCash } = require('./assetsMiddleware');

const router = Router();

// stock assets
router.get('/stocks/:aid', authMiddleware.requireAuth, provideAssetStock, assetsController.assets_detail);
router.get('/stocks/:aid/recalculate', authMiddleware.requireAuth, assetsController.assets_stocks_recalculate);

// stock transactions
router.post('/stocks/:aid/create', authMiddleware.requireAuth, assetsController.transactions_stocks_create_post);
router.post('/stocks/:aid/remove', authMiddleware.requireAuth, assetsController.transactions_stocks_remove_post);

// crypto assets
router.get('/cryptos/:aid', authMiddleware.requireAuth, provideAssetCrypto, assetsController.assets_detail);
router.get('/cryptos/:aid/recalculate', authMiddleware.requireAuth, assetsController.assets_cryptos_recalculate);

// crypto transactions
router.post('/cryptos/:aid/create', authMiddleware.requireAuth, assetsController.transactions_cryptos_create_post);
router.post('/cryptos/:aid/remove', authMiddleware.requireAuth, assetsController.transactions_cryptos_remove_post);

// cash assets
router.get('/cash/:aid', authMiddleware.requireAuth, provideAssetCash, assetsController.assets_detail);
// router.get('/cash/:aid/recalculate', authMiddleware.requireAuth, assetsController.assets_cash_recalculate);

// cash transactions
// router.post('/cash/:aid/create', authMiddleware.requireAuth, assetsController.transactions_cash_create_post);
// router.post('/cash/:aid/remove', authMiddleware.requireAuth, assetsController.transactions_cryptos_remove_post);


module.exports = router;