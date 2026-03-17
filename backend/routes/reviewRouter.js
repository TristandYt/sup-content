// backend/routes/reviewsRouter.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const reviewController = require('../controllers/reviewController');

// GET /api/reviews/game/:gameId -> voir les critiques (pas besoin d'etre connecte pour lire btw)
router.get('/game/:gameId', reviewController.getGameReviews);

// les routes en dessous ont besoin d'etre connecte (middleware auth)
router.use(auth);

// POST /api/reviews -> ajouter ou modifier une critique
router.post('/', reviewController.addOrUpdateReview);

// DELETE /api/reviews/:gameId -> suppr sa critique
router.delete('/:gameId', reviewController.deleteReview);

module.exports = router;