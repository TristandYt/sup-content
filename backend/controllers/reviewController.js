/*
 * Contrôleur critiques.
 * Pagination cursor-based sur getGameReviews et getMyReviews.
 *
 * Modèle Firestore : reviews/{userId}_{gameId}
 *   { userId, gameId, rating, text, updatedAt }
 */
const { admin, db } = require('../Services/Firebase');

const REVIEWS_PAGE_SIZE = 20;

/*
 * POST /api/reviews
 * PUT  /api/reviews/:gameId
 * Body : { gameId?, rating, text? }
 */
exports.addOrUpdateReview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const gameId = (req.params.gameId || req.body.gameId)?.toString();
        const { rating, text = '' } = req.body;

        if (!gameId) return res.status(400).json({ success: false, msg: 'gameId manquant' });
        if (rating === undefined) return res.status(400).json({ success: false, msg: 'rating manquant' });
        if (rating < 1 || rating > 5) return res.status(400).json({ success: false, msg: 'La note doit être entre 1 et 5' });

        const reviewId = `${userId}_${gameId}`;

        await db.collection('reviews').doc(reviewId).set({
            userId,
            gameId,
            rating: Number(rating),
            text,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        res.json({ success: true, msg: 'Critique enregistrée' });
    } catch (error) {
        next(error);
    }
};

/*
 * GET /api/reviews/me?cursor=<ISO date>
 * Reviews de l'utilisateur connecté, paginées.
 */
exports.getMyReviews = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { cursor } = req.query;

        let query = db.collection('reviews')
            .where('userId', '==', userId)
            .orderBy('updatedAt', 'desc');

        if (cursor) query = query.startAfter(new Date(cursor));

        query = query.limit(REVIEWS_PAGE_SIZE);

        const snapshot = await query.get();
        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        const nextCursor = lastDoc
            ? lastDoc.data().updatedAt?.toDate().toISOString()
            : null;

        res.json({ success: true, total: reviews.length, reviews, nextCursor });
    } catch (error) {
        next(error);
    }
};

/*
 * GET /api/reviews/game/:gameId?cursor=<ISO date>
 * Reviews d'un jeu + note moyenne. Route publique. Paginée.
 */
exports.getGameReviews = async (req, res, next) => {
    try {
        const gameId = req.params.gameId.toString();
        const { cursor } = req.query;

        let query = db.collection('reviews')
            .where('gameId', '==', gameId)
            .orderBy('updatedAt', 'desc');

        if (cursor) query = query.startAfter(new Date(cursor));

        query = query.limit(REVIEWS_PAGE_SIZE);

        const snapshot = await query.get();
        const reviews = [];
        let totalRating = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            reviews.push({ id: doc.id, ...data });
            totalRating += data.rating;
        });

        const averageRating = reviews.length > 0
            ? (totalRating / reviews.length).toFixed(1)
            : null;

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        const nextCursor = lastDoc
            ? lastDoc.data().updatedAt?.toDate().toISOString()
            : null;

        res.json({ success: true, averageRating, totalReviews: reviews.length, reviews, nextCursor });
    } catch (error) {
        next(error);
    }
};

/*
 * DELETE /api/reviews/:gameId
 */
exports.deleteReview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const gameId = req.params.gameId.toString();
        const reviewId = `${userId}_${gameId}`;

        const reviewDoc = await db.collection('reviews').doc(reviewId).get();
        if (!reviewDoc.exists) {
            return res.status(404).json({ success: false, msg: 'Critique introuvable' });
        }

        await db.collection('reviews').doc(reviewId).delete();
        res.json({ success: true, msg: 'Critique supprimée' });
    } catch (error) {
        next(error);
    }
};
