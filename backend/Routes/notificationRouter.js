/*
 * Routes notifications.
 * Récupération et marquage comme lu des notifications de l'utilisateur connecté.
 *
 * GET   /api/notifications/stream    → SSE Notification en temps réels
 * GET   /api/notifications           → liste des 30 dernières notifications
 * PATCH /api/notifications/:id/read  → marquer une notification comme lue
 */

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const notificationController = require("../controllers/notificationController");

router.use(auth);

router.get("/stream", notificationController.streamNotifications);
router.get("/", notificationController.getMyNotifications);
router.patch("/:notificationId/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

module.exports = router;
