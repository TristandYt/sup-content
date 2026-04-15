/*
 * Contrôleur du fil d'actualité.
 * Récupère les critiques des utilisateurs suivis par le user connecté.
 */
const { db } = require('../Services/Firebase');

exports.getNewsFeed = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const followsSnapshot = await db.collection('follows').where('followerId', '==', userId).get();
        const followingIds = followsSnapshot.docs.map(doc => doc.data().followingId);

        if (followingIds.length === 0) {
            return res.json({ success: true, feed: [], msg: "Abonnez-vous à des utilisateurs pour voir leur activité !" });
        }

        const topFollowingIds = followingIds.slice(0, 10);

        const reviewsSnapshot = await db.collection('reviews')
            .where('userId', 'in', topFollowingIds)
            .orderBy('updatedAt', 'desc')
            .limit(20)
            .get();

        const feed = reviewsSnapshot.docs.map(doc => ({
            id: doc.id,
            type: 'REVIEW_ADDED',
            data: doc.data()
        }));

        res.json({ success: true, feed });
    } catch (error) {
        next(error);
    }
};