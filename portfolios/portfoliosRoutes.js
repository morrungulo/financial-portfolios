const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const portfoliosController = require('./portfoliosController');

const router = Router();


/** to be removed */
const mongoose = require('mongoose');
const Portfolio = require('../models/Portfolio');
routes_remove_get = async (req, res) => {
    const user = res.locals.user._id;
    try {
        await Portfolio.deleteMany({ user });
    }
    catch (err) {
        //todo
        console.log("oops");
    }
    res.redirect('/portfolios');
}
router.get('/remove', authMiddleware.requireAuth, routes_remove_get);
/** to be removed */



router.get('/', authMiddleware.requireAuth, authMiddleware.checkUser, portfoliosController.portfolios_get);
router.get('/create', authMiddleware.requireAuth, portfoliosController.portfolios_create_get);
router.post('/create', authMiddleware.requireAuth, authMiddleware.checkUser, portfoliosController.portfolios_create_post);
router.get('/:pid', authMiddleware.requireAuth, portfoliosController.portfolios_id_get);
router.get('/:pid/create', authMiddleware.requireAuth, portfoliosController.portfolios_id_create_get);
router.post('/:pid/create', authMiddleware.requireAuth, portfoliosController.portfolios_id_create_post);
router.post('/:pid/remove', authMiddleware.requireAuth, portfoliosController.portfolios_id_remove_post);
router.get('/:pid/:aid', authMiddleware.requireAuth, portfoliosController.portfolios_id_asset_id_get);

module.exports = router;