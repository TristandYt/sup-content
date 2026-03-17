// backend/routes/feedRouter.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const feedController = require('../controllers/feedController');

// le fil d'actualité est personnel, donc la route doit être protégée
router.use(auth);

// GET /api/feed -> recup le fil d'actualité
router.get('/', feedController.getNewsFeed);

module.exports = router;