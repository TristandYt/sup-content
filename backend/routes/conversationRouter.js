/*
 * Routes conversations.
 * Messagerie privée 1-to-1 entre utilisateurs qui se suivent mutuellement.
 * Toutes les routes sont protégées par le middleware auth.
 */
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const conversationController = require("../controllers/conversationController");

router.use(auth);

router.get("/", conversationController.getMyConversations);
router.post("/", conversationController.getOrCreateConversation);
router.get("/:conversationId/messages", conversationController.getMessages);
router.post("/:conversationId/messages", conversationController.sendMessage);
router.patch(
  "/:conversationId/messages/:messageId/read",
  conversationController.markAsRead,
);

module.exports = router;
