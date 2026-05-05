// Routes des critiques
// GET /game/:gameId est publique — montée AVANT le middleware auth
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const reviewController = require('../controllers/reviewController');

// Route publique — déclarée avant router.use(auth)
router.get('/game/:gameId', reviewController.getGameReviews);

// Routes privées
router.use(auth);

router.get('/me', reviewController.getMyReviews);
router.post('/', reviewController.addOrUpdateReview);
router.put('/:gameId', reviewController.addOrUpdateReview);
router.delete('/:gameId', reviewController.deleteReview);

module.exports = router;
