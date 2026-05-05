/*
 * Route du fil d'actualité.
 * Auth appliqué dans server.js — pas de router.use(auth) ici.
 */
const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');

router.get('/', feedController.getNewsFeed);

module.exports = router;
