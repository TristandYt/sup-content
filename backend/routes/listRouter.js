// backend/routes/listsRouter.js
const express = require('express');
const router = express.Router();

// import
const auth = require('../middlewares/auth');
const listController = require('../controllers/listController');

// toute les routes de ce fichier ont besoin d'etre connecté
// on applique le middleware auth globalement sur ce routeur
router.use(auth);

// POST /api/lists/status -> Mettre a jour le statut d'un jeu
router.post('/status', listController.updateGameStatus);

// GET /api/lists/library -> Recuperer tous les jeux du user
router.get('/library', listController.getMyLibrary);

module.exports = router;