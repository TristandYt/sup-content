/*
 * Routes utilisateur.
 * Toutes les autres routes sont protégées par auth.
 */
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middlewares/roleMiddleware');
const userController = require('../controllers/userController');

// Routes privées
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
