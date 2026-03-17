// backend/controllers/reviewController.js
const admin = require('firebase-admin');

const getDb = () => admin.apps.length ? admin.firestore() : null;

// ajouter ou modifier une critique
exports.addOrUpdateReview = async (req, res, next) => {
    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        const { gameId, rating, text } = req.body;
        const userId = req.user.id;

        // validation des données
        if (!gameId || rating === undefined) {
            return res.status(400).json({ success: false, msg: 'Jeu et note requis' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, msg: 'La note doit être entre 1 et 5' });
        }

        // creation d'un ID unique "User_Game" pour eviter les doublon
        const reviewId = `${userId}_${gameId}`;
        const reviewRef = db.collection('reviews').doc(reviewId);

        // sauvegarde de la critique
        await reviewRef.set({
            userId,
            gameId: gameId.toString(),
            rating: Number(rating),
            text: text || "",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true, msg: 'Critique enregistrée avec succès !' });
    } catch (error) {
        next(error);
    }
};

// recuperer toutes les critiques d'un jeu (et calculer la moyenne)
exports.getGameReviews = async (req, res, next) => {
    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        const { gameId } = req.params;
        const reviewsSnapshot = await db.collection('reviews').where('gameId', '==', gameId.toString()).get();

        const reviews = [];
        let totalRating = 0;

        reviewsSnapshot.forEach(doc => {
            const data = doc.data();
            reviews.push(data);
            totalRating += data.rating;
        });

        // calcul de la note moyenne SUPCONTENT (goat)
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : null;

        res.json({
            success: true,
            averageRating,
            totalReviews: reviews.length,
            reviews
        });
    } catch (error) {
        next(error);
    }
};

// supprimer sa propre critique
exports.deleteReview = async (req, res, next) => {
    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        const { gameId } = req.params;
        const userId = req.user.id;
        const reviewId = `${userId}_${gameId}`;

        await db.collection('reviews').doc(reviewId).delete();

        res.json({ success: true, msg: 'Critique supprimée' });
    } catch (error) {
        next(error);
    }
};