/*
 * Routes utilisateur.
 * GET /api/users/:userId/profile est publique.
 * Toutes les autres routes sont protégées par auth (géré dans server.js).
 *
 * IMPORTANT : /:userId/profile DOIT être déclaré EN DERNIER pour ne pas
 * capturer /profile, /favorites, /me/export, /logs, etc. comme userId.
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/roleMiddleware');
const userController = require('../controllers/userController');

// Routes privées (auth + ensureFirestoreProfile appliqués dans server.js)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/password', userController.updatePassword);
router.put('/email', userController.updateEmail);
router.delete('/account', userController.deleteAccount);

router.get('/favorites', userController.getFavorites);
router.post('/favorites', userController.addFavorite);
router.delete('/favorites/:gameId', userController.removeFavorite);

// Export RGPD
router.get('/me/export', userController.exportUserData);

// Routes admin uniquement
router.get('/logs', isAdmin, userController.getLogs);
router.post('/promote/:userId', isAdmin, userController.promoteUser);

// Route publique — déclarée EN DERNIER pour ne pas capturer les routes statiques ci-dessus
router.get('/:userId/profile', userController.getPublicProfile);

module.exports = router;
