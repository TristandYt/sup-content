/*
 * Routes utilisateur.
 * Toutes les autres routes sont protégées par auth (géré dans server.js).
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../backend/middlewares/roleMiddleware');
const userController = require('../backend/controllers/userController');

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

module.exports = router;
