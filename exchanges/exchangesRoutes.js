const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const exchangesController = require('./exchangesControllers');

const router = Router();

router.get('/:eid', authMiddleware.requireAuth, exchangesController.exchanges_detail);

module.exports = router;