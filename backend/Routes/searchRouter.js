// Routes de recherche
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const searchController = require('../controllers/searchController');

// Route publique
router.get('/', searchController.searchAll);

// Route privée
router.get('/recommendations', auth, searchController.getRecommendations);

module.exports = router;
