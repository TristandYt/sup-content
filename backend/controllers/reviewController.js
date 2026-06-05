// Contrôleur des critiques
const { admin, db } = require("../Services/Firebase");
const Logger = require("../Services/Logger");

const REVIEWS_PAGE_SIZE = 20;

// ── Ajouter ou modifier une critique ──────────────────────────────────────────
exports.addOrUpdateReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const gameId = (req.params.gameId || req.body.gameId)?.toString();
    // FIX 1 : on récupère le pseudo envoyé par le front
    const { rating, text = "", pseudo } = req.body;

    if (!gameId)
      return res.status(400).json({ success: false, msg: "gameId manquant" });
    if (rating === undefined)
      return res.status(400).json({ success: false, msg: "rating manquant" });
    if (rating < 1 || rating > 5)
      return res
        .status(400)
        .json({ success: false, msg: "La note doit être entre 1 et 5" });

    const reviewId = `${userId}_${gameId}`;

    // FIX 1 : on stocke pseudo (fallback sur userId si absent)
    await db
      .collection("reviews")
      .doc(reviewId)
      .set(
        {
          userId,
          gameId,
          rating: Number(rating),
          text,
          pseudo: pseudo || userId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    await Logger.log("review_added_or_updated", userId, {
      gameId,
      rating,
      text: text ? "present" : "empty",
    });

    res.json({ success: true, msg: "Critique enregistrée" });
  } catch (error) {
    next(error);
  }
};

// ── Récupérer les critiques de l'utilisateur (paginé) ────────────────────────
exports.getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limitSize = parseInt(req.query.limit) || REVIEWS_PAGE_SIZE;
    const { lastVisible } = req.query; // Curseur pour startAfter

    let query = db
      .collection("reviews")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc");

    if (lastVisible) {
      const lastDoc = await db.collection("reviews").doc(lastVisible).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    } else if (page > 1) {
      // Fallback si le front utilise encore "page"
      query = query.offset((page - 1) * limitSize);
    }

    query = query.limit(limitSize);

    const snapshot = await query.get();
    const reviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.json({
      success: true,
      page,
      limit: limitSize,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer les critiques d'un jeu avec comments et note moyenne
exports.getGameReviews = async (req, res, next) => {
  try {
    const gameId = req.params.gameId.toString();
    const page = parseInt(req.query.page) || 1;
    const limitSize = parseInt(req.query.limit) || REVIEWS_PAGE_SIZE;
    const { lastVisible } = req.query;

    let query = db
      .collection("reviews")
      .where("gameId", "==", gameId)
      .orderBy("updatedAt", "desc");

    if (lastVisible) {
      const lastDoc = await db.collection("reviews").doc(lastVisible).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    } else if (page > 1) {
      query = query.offset((page - 1) * limitSize);
    }

    query = query.limit(limitSize);

    const snapshot = await query.get();
    const reviews = [];
    let totalRating = 0;

    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        totalRating += data.rating;

        // Récupère les comments de cette review, triés par date
        const commentsSnap = await doc.ref
          .collection("comments")
          .orderBy("createdAt", "asc")
          .get();

        const comments = commentsSnap.docs.map((c) => ({
          id: c.id,
          ...c.data(),
          pseudo: c.data().pseudo || c.data().userId,
        }));

        reviews.push({
          id: doc.id,
          ...data,
          pseudo: data.pseudo || data.userId,
          comments,
        });
      }),
    );

    reviews.sort((a, b) => {
      const ta = a.updatedAt?._seconds || 0;
      const tb = b.updatedAt?._seconds || 0;
      return tb - ta;
    });

    const averageRating =
      reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : null;

    res.json({
      success: true,
      averageRating,
      page,
      limit: limitSize,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer une critique 
exports.deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const gameId = req.params.gameId.toString();
    const reviewId = `${userId}_${gameId}`;

    const reviewDoc = await db.collection("reviews").doc(reviewId).get();
    if (!reviewDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Critique introuvable" });
    }

    // Supprimer aussi tous les comments de la review
    const commentsSnap = await db
      .collection("reviews")
      .doc(reviewId)
      .collection("comments")
      .get();
    const batch = db.batch();
    commentsSnap.docs.forEach((c) => batch.delete(c.ref));
    batch.delete(db.collection("reviews").doc(reviewId));
    await batch.commit();

    await Logger.log("review_deleted", userId, { gameId });

    res.json({ success: true, msg: "Critique supprimée" });
  } catch (error) {
    next(error);
  }
};

// Liker ou retirer un like 
exports.toggleLikeReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;

    const reviewRef = db.collection("reviews").doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists)
      return res
        .status(404)
        .json({ success: false, msg: "Critique introuvable" });

    const currentLikes = reviewDoc.data().likedBy || [];
    if (currentLikes.includes(userId)) {
      await reviewRef.update({
        likedBy: admin.firestore.FieldValue.arrayRemove(userId),
      });
      res.status(200).json({ success: true, msg: "Like retiré" });
    } else {
      await reviewRef.update({
        likedBy: admin.firestore.FieldValue.arrayUnion(userId),
      });

      const authorId = reviewDoc.data().userId;
      if (authorId !== userId) {
        await db.collection("notifications").add({
          userId: authorId,
          type: "like",
          sourceUserId: userId,
          senderPseudo: req.user.pseudo || userId,
          reviewId,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      res.status(200).json({ success: true, msg: "Critique likée" });
    }
  } catch (error) {
    next(error);
  }
};

// Commenter une critique
exports.commentReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    // FIX 3 : on récupère le pseudo du front
    const { text, pseudo } = req.body;

    if (!text || text.trim() === "") {
      return res
        .status(400)
        .json({ success: false, msg: "Le commentaire ne peut pas être vide" });
    }

    const reviewRef = db.collection("reviews").doc(reviewId);
    const reviewDoc = await reviewRef.get();
    if (!reviewDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Critique introuvable" });
    }

    // on stocke pseudo dans le comment
    const commentRef = await reviewRef.collection("comments").add({
      userId,
      pseudo: pseudo || userId,
      text: text.trim(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const reviewAuthorId = reviewDoc.data().userId;
    if (reviewAuthorId !== userId) {
      await db.collection("notifications").add({
        userId: reviewAuthorId,
        type: "comment",
        sourceUserId: userId,
        senderPseudo: pseudo || userId,
        reviewId,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // on renvoie le comment complet pour mise à jour immédiate côté front
    res.status(201).json({
      success: true,
      msg: "Commentaire ajouté",
      commentId: commentRef.id,
      comment: {
        id: commentRef.id,
        userId,
        pseudo: pseudo || userId,
        text: text.trim(),
      },
    });
  } catch (error) {
    next(error);
  }
};
