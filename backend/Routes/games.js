// Routes IGDB avec mise en cache Firestore
const express = require('express');
const {
  getPopularGames,
  searchGames,
  getUpcomingGames,
  getGamesFiltered,
  getGameDetails,
  getSimilarGames
} = require('../controllers/gameController');

const router = express.Router();

router.get('/popular', getPopularGames);
router.get('/search', searchGames);
router.get('/upcoming', getUpcomingGames);
router.get('/filtered', getGamesFiltered);
router.get('/details/:id', getGameDetails);
router.get('/:id/similar', getSimilarGames);
router.get('/:id', getGameDetails);

module.exports = router;
