const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const portfoliosController = require('./portfoliosController');

const router = Router();

router.get('/', authMiddleware.requireAuth, authMiddleware.checkUser, portfoliosController.portfolios_get);
router.get('/create', authMiddleware.requireAuth, portfoliosController.portfolios_create_get);
router.post('/create', authMiddleware.requireAuth, authMiddleware.checkUser, portfoliosController.portfolios_create_post);
router.get('/:pid', authMiddleware.requireAuth, portfoliosController.portfolios_id_get);
router.get('/:pid/create', authMiddleware.requireAuth, portfoliosController.portfolios_id_create_get);
router.post('/:pid/create', authMiddleware.requireAuth, portfoliosController.portfolios_id_create_post);
router.get('/:pid/:aid', authMiddleware.requireAuth, portfoliosController.portfolios_id_asset_id_get);

module.exports = router;