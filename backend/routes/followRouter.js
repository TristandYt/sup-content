/*
 * Routes de suivi.
 * Gère les abonnements et désabonnements entre utilisateurs.
 */
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const followController = require("../controllers/followController");

router.use(auth);

router.post("/:userId", followController.followUser);
router.delete("/:userId", followController.unfollowUser);
router.get("/me/following", followController.getMyFollowing);
router.get("/me/followers", followController.getMyFollowers);

module.exports = router;
