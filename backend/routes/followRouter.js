// backend/routes/followsRouter.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const followController = require('../controllers/followController');

// toutes les actions de "follow" ont besoin d'etre co
router.use(auth);

// POST /api/follows/:userId -> s'abonner a quelqu'un
router.post('/:userId', followController.followUser);

// DELETE /api/follows/:userId -> se desabonner
router.delete('/:userId', followController.unfollowUser);

// GET /api/follows/me/following -> voir la liste des gens qu'on suit
router.get('/me/following', followController.getMyFollowing);

module.exports = router;