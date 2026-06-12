const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const authMiddleware = require('../middlewares/auth');

// Routes publiques (lecture)
router.get('/threads', forumController.getThreads);
router.get('/threads/:threadId', forumController.getThreadById);
router.get('/threads/:threadId/posts', forumController.getPostsByThread);

// Routes protégées (écriture)
router.post('/threads', authMiddleware, forumController.createThread);
router.post('/posts', authMiddleware, forumController.addPost);
router.delete('/threads/:threadId', authMiddleware, forumController.deleteThread);
router.delete('/posts/:postId', authMiddleware, forumController.deletePost);

module.exports = router;