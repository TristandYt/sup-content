/*
 * Routes bibliothèque utilisateur.
 * Auth appliqué dans server.js.
 */
const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');

router.post('/status', listController.updateGameStatus);
router.put('/status', listController.updateGameStatus);
router.get('/library', listController.getMyLibrary);
router.get('/library/:gameId', listController.getGameFromLibrary);
router.delete('/library/:gameId', listController.removeFromLibrary);

module.exports = router;
