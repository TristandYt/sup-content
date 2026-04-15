/*
 * Routes utilisateur.
 * Profil utilisateur et gestion des favoris protégés par authentification.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');

router.use(auth); // Middleware global pour ces routes

router.get('/profile', userController.getProfile);
router.post('/favorites', userController.addFavorite);
router.delete('/favorites/:gameId', userController.removeFavorite);
router.get('/favorites', userController.getFavorites);
router.put('/profile', userController.updateProfile);
router.put('/password', userController.updatePassword);
router.delete('/account', userController.deleteAccount);
router.put('/email', userController.updateEmail);


module.exports = router;