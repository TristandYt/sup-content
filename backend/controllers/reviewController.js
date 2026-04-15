/*
 * Contrôleur de critiques.
 * Gère l'ajout, la modification, la lecture et la suppression de reviews.
 */
const { admin, db } = require('../Services/Firebase');

exports.addOrUpdateReview = async (req, res, next) => {
    try {
        const gameId = req.params.gameId || req.body.gameId;
        const { rating, text } = req.body;
        const userId = req.user.id;

        if (!gameId || rating === undefined) return res.status(400).json({ success: false, msg: 'Jeu et note requis' });
        if (rating < 1 || rating > 5) return res.status(400).json({ success: false, msg: 'La note doit être entre 1 et 5' });

        const reviewId = `${userId}_${gameId.toString()}`;
        
        await db.collection('reviews').doc(reviewId).set({
            userId,
            gameId: gameId.toString(),
            rating: Number(rating),
            text: text || "",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        res.json({ success: true, msg: 'Critique enregistrée avec succès !' });
    } catch (error) {
        next(error);
    }
};

exports.getMyReviews = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const reviewsSnapshot = await db.collection('reviews').where('userId', '==', userId).get();

        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        res.json({ success: true, reviews });
    } catch (error) {
        next(error);
    }
};

exports.getGameReviews = async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const reviewsSnapshot = await db.collection('reviews').where('gameId', '==', gameId.toString()).get();

        const reviews = [];
        let totalRating = 0;

        reviewsSnapshot.forEach(doc => {
            const data = doc.data();
            reviews.push(data);
            totalRating += data.rating;
        });

        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : null;

        res.json({ success: true, averageRating, totalReviews: reviews.length, reviews });
    } catch (error) {
        next(error);
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const userId = req.user.id;
        const reviewId = `${userId}_${gameId.toString()}`;

        await db.collection('reviews').doc(reviewId).delete();

        res.json({ success: true, msg: 'Critique supprimée' });
    } catch (error) {
        next(error);
    }
};