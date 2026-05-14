const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');

// Routes pour le forum
router.post('/threads', forumController.createThread);
router.get('/threads', forumController.getThreads);
router.get('/threads/:threadId', forumController.getThreadById);
router.get('/threads/:threadId/posts', forumController.getPostsByThread);
router.post('/posts', forumController.addPost);

module.exports = router;