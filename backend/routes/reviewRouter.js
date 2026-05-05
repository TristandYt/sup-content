/*
 * Routes critiques.
 * Expose la lecture publique des reviews et les opérations CRUD pour l'utilisateur connecté.
 */
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const reviewController = require("../controllers/reviewController");
router.get("/game/:gameId", reviewController.getGameReviews);
router.use(auth); // Toutes les routes nécessitent une authentification

router.get("/me", reviewController.getMyReviews);
router.post("/", reviewController.addOrUpdateReview);
router.put("/:gameId", reviewController.addOrUpdateReview);
router.delete("/:gameId", reviewController.deleteReview);

module.exports = router;
