// Routes de modération
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/roleMiddleware");
const moderationController = require("../controllers/moderationController");

// Tout utilisateur connecté peut signaler
router.post("/report", moderationController.reportContent);

// Routes admin

router.get("/reports", isAdmin, moderationController.getReports);

router.post("/users/:userId/ban", isAdmin, moderationController.adminBanUser);
router.delete(
  "/reviews/:reviewId",
  isAdmin,
  moderationController.adminDeleteReview,
);
router.patch(
  "/reviews/:reviewId/highlight",
  isAdmin,
  moderationController.adminHighlightReview,
);
router.delete(
  "/reviews/:reviewId/comments/:commentId",
  isAdmin,
  moderationController.adminDeleteComment,
);

module.exports = router;
