/*
 * Routes utilisateur.
 * GET /api/users/:userId/profile est publique.
 * Toutes les autres routes sont protégées par auth.
 */
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/roleMiddleware");
const userController = require("../controllers/userController");

router.get("/:userId/profile", userController.getPublicProfile);
router.get("/search", userController.searchUsers);

router.use(auth); // Toutes les routes suivantes nécessitent une authentification
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.put("/password", userController.updatePassword);
router.put("/email", userController.updateEmail);
router.delete("/account", userController.deleteAccount);
router.get("/favorites", userController.getFavorites);
router.post("/favorites", userController.addFavorite);
router.delete("/favorites/:gameId", userController.removeFavorite);
router.get("/logs", isAdmin, userController.getLogs);
router.post("/promote/:userId", isAdmin, userController.promoteUser);

module.exports = router;
