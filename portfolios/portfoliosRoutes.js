const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const portfoliosController = require('./portfoliosControllers');

const router = Router();

// portfolios
router.get('/create', authMiddleware.requireAuth, portfoliosController.portfolios_create_get);
router.post('/create', authMiddleware.requireAuth, authMiddleware.checkUser, portfoliosController.portfolios_create_post);
router.post('/remove', authMiddleware.requireAuth, portfoliosController.portfolios_remove_post);
router.get('/:pid', authMiddleware.requireAuth, portfoliosController.portfolios_detail);

// assets
router.get('/:pid/assets/create', authMiddleware.requireAuth, portfoliosController.portfolios_assets_create_get);
router.post('/:pid/assets/create', authMiddleware.requireAuth, portfoliosController.portfolios_assets_create_post);
router.post('/:pid/assets/remove', authMiddleware.requireAuth, portfoliosController.portfolios_assets_remove_post);
router.get('/:pid/assets/:aid', authMiddleware.requireAuth, portfoliosController.portfolios_assets_detail);

// transactions
router.get('/:pid/assets/:aid/transactions/create', authMiddleware.requireAuth, portfoliosController.portfolios_assets_transactions_create_get);
router.post('/:pid/assets/:aid/transactions/create', authMiddleware.requireAuth, portfoliosController.portfolios_assets_transactions_create_post);
router.post('/:pid/assets/:aid/transactions/remove', authMiddleware.requireAuth, portfoliosController.portfolios_assets_transactions_remove_post);
router.get('/:pid/assets/:aid/transactions/:tid', authMiddleware.requireAuth, portfoliosController.portfolios_assets_transactions_detail);
router.put('/:pid/assets/:aid/transactions/:tid', authMiddleware.requireAuth, portfoliosController.portfolios_assets_transactions_update);

module.exports = router;