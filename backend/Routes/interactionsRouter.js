// Routes des interactions sociales (Likes, Commentaires)
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const reviewController = require('../controllers/reviewController');

router.use(auth);

router.post('/reviews/:reviewId/like', reviewController.toggleLikeReview);
router.post('/reviews/:reviewId/comments', reviewController.commentReview);

module.exports = router;
