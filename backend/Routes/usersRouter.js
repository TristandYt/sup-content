/*
 * Routes utilisateur.
 * Toutes les autres routes sont protégées par auth.
 */
const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middlewares/roleMiddleware");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth");
const ensureFirestoreProfile = require("../middlewares/ensureFirestoreProfile");

// Routes publiques
router.get("/:userId/profile", userController.getPublicProfile);

// Routes privées
router.use(authMiddleware, ensureFirestoreProfile);

router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.put("/password", userController.updatePassword);
router.put("/email", userController.updateEmail);
router.delete("/account", userController.deleteAccount);
router.get("/preferences", userController.getPreferences);
router.put("/preferences", userController.updatePreferences);
router.get("/favorites", userController.getFavorites);
router.post("/favorites", userController.addFavorite);
router.delete("/favorites/:gameId", userController.removeFavorite);

// Export RGPD
router.get("/me/export", userController.exportUserData);

// Routes admin uniquement
router.get("/logs", isAdmin, userController.getLogs);
router.post("/promote/:userId", isAdmin, userController.promoteUser);

module.exports = router;
