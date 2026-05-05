// Routes de modération
// Aligné sur les tests : POST /ban (pas PUT), sans préfixe /admin/ dans l'URL
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roleMiddleware');
const moderationController = require('../controllers/moderationController');

router.use(auth);

// Tout utilisateur connecté peut signaler
router.post('/report', moderationController.reportContent);

// Routes admin — alignées avec les appels des tests
router.post('/users/:userId/ban', isAdmin, moderationController.adminBanUser);
router.delete('/reviews/:reviewId', isAdmin, moderationController.adminDeleteReview);
router.patch('/reviews/:reviewId/highlight', isAdmin, moderationController.adminHighlightReview);

module.exports = router;
