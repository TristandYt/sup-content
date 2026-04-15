/*
 * Route du fil d'actualité.
 * Renvoie les critiques récentes des utilisateurs suivis par le user connecté.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const feedController = require('../controllers/feedController');

router.use(auth);
router.get('/', feedController.getNewsFeed);

module.exports = router;