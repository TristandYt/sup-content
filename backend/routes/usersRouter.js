/*
 * Routes utilisateur.
 * GET /api/users/:userId/profile est publique.
 * Toutes les autres routes sont protégées par auth.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');

// Route publique — doit être déclarée AVANT router.use(auth)
router.get('/:userId/profile', userController.getPublicProfile);

router.use(auth);

router.get('/profile',userController.getProfile);
router.put('/profile',userController.updateProfile);
router.put('/password',userController.updatePassword);
router.put('/email',userController.updateEmail);
router.delete('/account',userController.deleteAccount);
router.get('/favorites',userController.getFavorites);
router.post('/favorites',userController.addFavorite);
router.delete('/favorites/:gameId',userController.removeFavorite);

module.exports = router;
