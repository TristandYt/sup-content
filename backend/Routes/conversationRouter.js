/*
 * Routes conversations.
 * Messagerie privée 1-to-1 entre utilisateurs qui se suivent mutuellement.
 */
const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.get('/', conversationController.getMyConversations);
router.post('/', conversationController.getOrCreateConversation);
router.get('/:conversationId/messages', conversationController.getMessages);
router.post('/:conversationId/messages', conversationController.sendMessage);
router.patch('/:conversationId/messages/:messageId/read', conversationController.markAsRead);

module.exports = router;
