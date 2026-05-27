// Gestion des notifications
const { db } = require("../Services/Firebase");

exports.getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const snapshot = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notifRef = db.collection("notifications").doc(notificationId);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Notification introuvable" });
    }
    if (notifDoc.data().userId !== userId) {
      return res.status(403).json({ success: false, msg: "Accès refusé" });
    }

    await notifRef.update({ isRead: true });

    res
      .status(200)
      .json({ success: true, msg: "Notification marquée comme lue" });
  } catch (error) {
    next(error);
  }
};

// ── NOUVEAU : marquer TOUTES les notifications comme lues ──────────────────
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const snapshot = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .where("isRead", "==", false)
      .get();

    if (snapshot.empty) {
      return res
        .status(200)
        .json({ success: true, msg: "Aucune notification non lue" });
    }

    // Batch Firestore pour tout mettre à jour en une seule requête
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();

    res
      .status(200)
      .json({
        success: true,
        msg: `${snapshot.size} notification(s) marquée(s) comme lues`,
      });
  } catch (error) {
    next(error);
  }
};

exports.streamNotifications = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const userId = req.user.id;

  const unsubscribe = db
    .collection("notifications")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(30)
    .onSnapshot(
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        res.write(
          `data: ${JSON.stringify({ type: "UPDATE", notifications })}\n\n`,
        );
      },
      (error) => {
        console.error("Erreur SSE Notifications:", error);
        res.write(
          `data: ${JSON.stringify({ type: "ERROR", msg: error.message })}\n\n`,
        );
      },
    );

  req.on("close", () => {
    unsubscribe();
  });
};
