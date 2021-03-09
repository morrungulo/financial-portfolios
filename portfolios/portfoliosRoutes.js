const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const portfoliosController = require('./portfoliosControllers');

const router = Router();

// portfolios
router.post('/create', authMiddleware.requireAuth, authMiddleware.checkUser, portfoliosController.portfolios_create_post);
router.post('/remove', authMiddleware.requireAuth, portfoliosController.portfolios_remove_post);
router.get('/:pid', authMiddleware.requireAuth, portfoliosController.portfolios_detail);
router.get('/:pid/recalculate', authMiddleware.requireAuth, portfoliosController.portfolios_recalculate);

// assets
router.post('/:pid/create', authMiddleware.requireAuth, portfoliosController.portfolios_assets_create_post);
router.post('/:pid/remove', authMiddleware.requireAuth, portfoliosController.portfolios_assets_remove_post);

module.exports = router;