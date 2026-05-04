/*
 * Contrôleur fil d'actualité.
 * Récupère les reviews récentes des utilisateurs suivis.
 * Pagination cursor-based via ?cursor=<updatedAt ISO string>.
 *
 * ⚠️ Limitation Firestore : `in` limité à 10 valeurs.
 *    Solution fan-out à implémenter pour les gros comptes (>10 followings).
 *    En attendant, on pagine par batch de 10 followings.
 */
const { db } = require("../Services/Firebase");

const FEED_PAGE_SIZE = 20;

/*
 * GET /api/feeds?cursor=<ISO date>&followOffset=<number>
 *
 * cursor       : updatedAt du dernier item reçu (pour la page suivante)
 * followOffset : index de départ dans la liste des followings (par tranche de 10)
 */
exports.getNewsFeed = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { cursor, followOffset = 0 } = req.query;
    const offset = parseInt(followOffset, 10) || 0;

    const followsSnapshot = await db
      .collection("follows")
      .where("followerId", "==", userId)
      .get();

    const allFollowingIds = followsSnapshot.docs.map(
      (doc) => doc.data().followingId,
    );

    if (allFollowingIds.length === 0) {
      return res.json({
        success: true,
        feed: [],
        nextCursor: null,
        nextFollowOffset: null,
        msg: "Suivez des utilisateurs pour voir leur activité",
      });
    }

    const batchIds = allFollowingIds.slice(offset, offset + 10);

    if (batchIds.length === 0) {
      return res.json({
        success: true,
        feed: [],
        nextCursor: null,
        nextFollowOffset: null,
      });
    }

    let query = db
      .collection("reviews")
      .where("userId", "in", batchIds)
      .orderBy("updatedAt", "desc");

    if (cursor) {
      const cursorDate = new Date(cursor);
      query = query.startAfter(cursorDate);
    }

    query = query.limit(FEED_PAGE_SIZE);

    const snapshot = await query.get();
    const feed = snapshot.docs.map((doc) => ({
      id: doc.id,
      type: "REVIEW_ADDED",
      data: doc.data(),
    }));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc
      ? lastDoc.data().updatedAt?.toDate().toISOString()
      : null;

    const nextFollowOffset =
      feed.length === FEED_PAGE_SIZE && offset + 10 < allFollowingIds.length
        ? offset + 10
        : null;

    res.json({
      success: true,
      total: feed.length,
      feed,
      nextCursor,
      nextFollowOffset,
    });
  } catch (error) {
    next(error);
  }
};
