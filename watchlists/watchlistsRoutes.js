const { Router } = require('express');
const authMiddleware = require('../auth/authMiddleware');
const watchlistsControllers = require('./watchlistsControllers');

const router = Router();

router.get('/create', authMiddleware.requireAuth, watchlistsControllers.watchlists_create_get);
router.post('/create', authMiddleware.requireAuth, authMiddleware.checkUser, watchlistsControllers.watchlists_create_post);
router.post('/remove', authMiddleware.requireAuth, authMiddleware.checkUser, watchlistsControllers.watchlists_remove_post);
router.get('/:wid', authMiddleware.requireAuth, watchlistsControllers.watchlists_detail);
router.get('/:wid/entry/create', authMiddleware.requireAuth, watchlistsControllers.watchlists_entry_create_get);
router.post('/:wid/entry/create', authMiddleware.requireAuth, watchlistsControllers.watchlists_entry_create_post);
router.post('/:wid/entry/remove', authMiddleware.requireAuth, watchlistsControllers.watchlists_entry_remove_post);
router.get('/:wid/entry/:eid', authMiddleware.requireAuth, watchlistsControllers.watchlists_entry_detail);

module.exports = router;