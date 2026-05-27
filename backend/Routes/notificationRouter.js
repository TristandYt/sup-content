/*
 * Routes notifications.
 *
 * GET   /api/notifications              → liste des 30 dernières notifications
 * PATCH /api/notifications/:id/read     → marquer une notification comme lue
 * PATCH /api/notifications/read-all     → marquer TOUTES comme lues
 */
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const notificationController = require("../controllers/notificationController");

router.use(auth);

router.get("/", notificationController.getMyNotifications);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:notificationId/read", notificationController.markAsRead);

module.exports = router;
