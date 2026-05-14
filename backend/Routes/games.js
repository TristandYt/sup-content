// Routes IGDB avec mise en cache Firestore
const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

router.get('/popular', gameController.getPopularGames);
router.get('/search', gameController.searchGames);
router.get('/upcoming', gameController.getUpcomingGames);
router.get('/filtered', gameController.getGamesFiltered);
router.get('/details/:id', gameController.getGameDetails);
router.get('/:id/similar', gameController.getSimilarGames);
router.get('/:id', gameController.getGameDetails);

module.exports = router;
