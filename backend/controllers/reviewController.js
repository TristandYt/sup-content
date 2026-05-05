// Contrôleur des critiques
const { admin, db } = require('../Services/Firebase');
const Logger = require('../Services/Logger');

const REVIEWS_PAGE_SIZE = 20;

// Ajouter ou modifier une critique
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

        await Logger.log('review_added_or_updated', userId, { gameId, rating, text: text ? 'present' : 'empty' });

        res.json({ success: true, msg: 'Critique enregistrée' });
    } catch (error) {
        next(error);
    }
};

// Récupérer les critiques de l'utilisateur (paginé)
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

// Récupérer les critiques d'un jeu avec sa note moyenne (paginé)
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

// Supprimer une critique
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

        await Logger.log('review_deleted', userId, { gameId });

        res.json({ success: true, msg: 'Critique supprimée' });
    } catch (error) {
        next(error);
    }
};

// Liker ou retirer un like sur une critique
exports.toggleLikeReview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { reviewId } = req.params; 

        const reviewRef = db.collection('reviews').doc(reviewId);
        const reviewDoc = await reviewRef.get();

        if (!reviewDoc.exists) return res.status(404).json({ success: false, msg: 'Critique introuvable' });

        const currentLikes = reviewDoc.data().likedBy || [];
        if (currentLikes.includes(userId)) {
            await reviewRef.update({ likedBy: admin.firestore.FieldValue.arrayRemove(userId) });
            res.status(200).json({ success: true, msg: 'Like retiré' });
        } else {
            await reviewRef.update({ likedBy: admin.firestore.FieldValue.arrayUnion(userId) });
            
            const authorId = reviewDoc.data().userId;
            if (authorId !== userId) {
                await db.collection('notifications').add({
                    userId: authorId, type: 'NEW_LIKE', sourceUserId: userId, reviewId,
                    isRead: false, createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            res.status(200).json({ success: true, msg: 'Critique likée' });
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
        const { text } = req.body;

        if (!text || text.trim() === '') return res.status(400).json({ success: false, msg: 'Le commentaire ne peut pas être vide' });

        const reviewRef = db.collection('reviews').doc(reviewId);
        if (!(await reviewRef.get()).exists) return res.status(404).json({ success: false, msg: 'Critique introuvable' });

        const commentRef = await reviewRef.collection('comments').add({
            userId, text: text.trim(), createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const reviewAuthorId = (await reviewRef.get()).data().userId;
        if (reviewAuthorId !== userId) {
            await db.collection('notifications').add({
                userId: reviewAuthorId, type: 'NEW_COMMENT', sourceUserId: userId, reviewId,
                isRead: false, createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        res.status(201).json({ success: true, msg: 'Commentaire ajouté', commentId: commentRef.id });
    } catch (error) {
        next(error);
    }
};
