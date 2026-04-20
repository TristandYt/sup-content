/*
 * Routes bibliothèque utilisateur.
 * Permet de lire, mettre à jour et supprimer les jeux dans la bibliothèque du user.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const listController = require('../controllers/listController');

router.use(auth);

router.post('/status',listController.updateGameStatus);
router.put('/status',listController.updateGameStatus);
router.get('/library',listController.getMyLibrary);
router.get('/library/:gameId',listController.getGameFromLibrary);
router.delete('/library/:gameId',listController.removeFromLibrary);

module.exports = router;