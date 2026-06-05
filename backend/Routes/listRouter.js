/*
 * Routes bibliothèque utilisateur.
 * Auth appliqué dans server.js.
 */
const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');

// Routes pour les bibliothèques
router.post('/status', listController.updateGameStatus);
router.put('/status', listController.updateGameStatus);
router.get('/library', listController.getMyLibrary);
router.get('/library/:gameId', listController.getGameFromLibrary);
router.delete('/library/:gameId', listController.removeFromLibrary);

// Routes pour les listes personnalisées
router.post('/custom', listController.createList);
router.get('/custom/me', listController.getMyLists);
router.get('/custom/:listId', listController.getListDetails);
router.put('/custom/:listId', listController.updateList);
router.delete('/custom/:listId', listController.deleteList);
router.post('/custom/:listId/games', listController.addGameToList);
router.delete('/custom/:listId/games/:gameId', listController.removeGameFromList);


module.exports = router;
