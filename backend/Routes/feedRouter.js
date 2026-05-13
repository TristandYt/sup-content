/*
 * Route du fil d'actualité.
 */
const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');

router.get('/', feedController.getNewsFeed);

module.exports = router;
