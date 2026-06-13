// Contrôleur de modération
const { admin, db } = require("../Services/Firebase");
const Logger = require("../Services/Logger");

// Nouvelle méthode : Récupérer tous les signalements pour l'administration
exports.getReports = async (req, res, next) => {
  try {
    const reportsSnapshot = await db
      .collection("reports")
      .orderBy("createdAt", "desc")
      .get();
    const reports = [];

    reportsSnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

exports.reportContent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { targetId, targetType, reason } = req.body;

    if (!targetId || !reason) {
      return res
        .status(400)
        .json({ success: false, msg: "ID cible et raison requis" });
    }

    await db.collection("reports").add({
      reporterId: userId,
      targetId,
      targetType,
      reason,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res
      .status(201)
      .json({ success: true, msg: "Signalement envoyé aux administrateurs" });
  } catch (error) {
    next(error);
  }
};

exports.adminBanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Utilisateur introuvable" });
    }

    await admin.auth().updateUser(userId, { disabled: true });
    await userRef.update({ isBanned: true });
    await Logger.log("user_banned", req.user.id, { bannedUserId: userId });

    res
      .status(200)
      .json({ success: true, msg: "Utilisateur banni avec succès" });
  } catch (error) {
    next(error);
  }
};

exports.adminDeleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const reviewRef = db.collection("reviews").doc(reviewId);

    if (!(await reviewRef.get()).exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Critique introuvable" });
    }

    await reviewRef.delete();
    await Logger.log("admin_deleted_review", req.user.id, { reviewId });

    res
      .status(200)
      .json({ success: true, msg: "Critique supprimée par modération" });
  } catch (error) {
    next(error);
  }
};

exports.adminHighlightReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const reviewRef = db.collection("reviews").doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Critique introuvable" });
    }

    const isHighlighted = !reviewDoc.data().isHighlighted;

    await reviewRef.update({ isHighlighted });
    await Logger.log("admin_highlighted_review", req.user.id, {
      reviewId,
      isHighlighted,
    });

    res
      .status(200)
      .json({
        success: true,
        msg: isHighlighted ? "Critique mise en avant" : "Mise en avant retirée",
        isHighlighted,
      });
  } catch (error) {
    next(error);
  }
};

exports.adminDeleteComment = async (req, res, next) => {
  try {
    const { reviewId, commentId } = req.params;

    const reviewRef = db.collection("reviews").doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Critique introuvable" });
    }

    const comments = reviewDoc.data().comments || [];
    const updatedComments = comments.filter((c) => c.id !== commentId);

    await reviewRef.update({ comments: updatedComments });
    await Logger.log("admin_deleted_comment", req.user.id, {
      reviewId,
      commentId,
    });

    res
      .status(200)
      .json({ success: true, msg: "Commentaire supprimé par modération" });
  } catch (error) {
    next(error);
  }
};
