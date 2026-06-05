// Routes des critiques
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const reviewController = require('../controllers/reviewController');

// Route publique
router.get('/game/:gameId', reviewController.getGameReviews);

// Routes privées
router.use(auth);

router.get('/me', reviewController.getMyReviews);
router.post('/', reviewController.addOrUpdateReview);
router.put('/:gameId', reviewController.addOrUpdateReview);
router.delete('/:gameId', reviewController.deleteReview);

module.exports = router;
