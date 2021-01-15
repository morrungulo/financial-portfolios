const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const portfoliosController = require('./portfoliosControllers');

const router = Router();

// portfolios
router.post('/create', authMiddleware.requireAuth, authMiddleware.checkUser, portfoliosController.portfolios_create_post);
router.post('/remove', authMiddleware.requireAuth, portfoliosController.portfolios_remove_post);
router.get('/:pid', authMiddleware.requireAuth, portfoliosController.portfolios_detail);

// assets
router.post('/:pid/create', authMiddleware.requireAuth, portfoliosController.portfolios_assets_create_post);
router.post('/:pid/remove', authMiddleware.requireAuth, portfoliosController.portfolios_assets_remove_post);

// transactions
router.post('/:pid/assets/:aid/transactions/create', authMiddleware.requireAuth, portfoliosController.portfolios_assets_transactions_create_post);
router.post('/:pid/assets/:aid/transactions/remove', authMiddleware.requireAuth, portfoliosController.portfolios_assets_transactions_remove_post);
router.get('/:pid/assets/:aid/transactions/:tid', authMiddleware.requireAuth, portfoliosController.portfolios_assets_transactions_detail);
router.put('/:pid/assets/:aid/transactions/:tid', authMiddleware.requireAuth, portfoliosController.portfolios_assets_transactions_update);

module.exports = router;