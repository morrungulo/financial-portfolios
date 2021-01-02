const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const showControllers = require('./showControllers');

const router = Router();

router.get('/', authMiddleware.requireAuth, authMiddleware.checkUser, showControllers.index);

module.exports = router;