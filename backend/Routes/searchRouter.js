// Routes de recherche
// /recommendations est protégée par auth (appliqué dans le router)
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const searchController = require('../controllers/searchController');

// Route publique
router.get('/', searchController.searchAll);

// Route privée — auth explicite ici car server.js monte /api/search sans auth
router.get('/recommendations', auth, searchController.getRecommendations);

module.exports = router;
