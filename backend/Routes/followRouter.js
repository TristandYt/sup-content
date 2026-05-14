/*
 * Routes de suivi.
 */
const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');

router.get('/me/following', followController.getMyFollowing);
router.get('/me/followers', followController.getMyFollowers);
router.post('/:userId', followController.followUser);
router.delete('/:userId', followController.unfollowUser);

module.exports = router;
