const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const portfoliosController = require('./portfoliosController');

const router = Router();

router.get('/', authMiddleware.requireAuth, portfoliosController.portfolios_get);
// router.get('/create', portfoliosController.portfolios_create_get);
// router.post('/create', portfoliosController.portfolios_create_post);
// router.get('/:id', portfoliosController.portfolios_id);

module.exports = router;