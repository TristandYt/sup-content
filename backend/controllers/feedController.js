// Fil d'actualité (Abonnements)
const { db } = require('../Services/Firebase');

const FEED_PAGE_SIZE = 20;

exports.getNewsFeed = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limitSize = parseInt(req.query.limit) || FEED_PAGE_SIZE;

        const followsSnapshot = await db.collection('follows')
            .where('followerId', '==', userId)
            .get();

        const allFollowingIds = followsSnapshot.docs.map(doc => doc.data().followingId);

        if (allFollowingIds.length === 0) {
            return res.json({
                success: true,
                feed: [],
                page,
                totalPages: 0,
                msg: 'Suivez des utilisateurs pour voir leur activité',
            });
        }

        const chunks = [];
        for (let i = 0; i < allFollowingIds.length; i += 10) {
            chunks.push(allFollowingIds.slice(i, i + 10));
        }

        // 1. Récupération des critiques (Reviews)
        const reviewPromises = chunks.map(chunk => {
            return db.collection('reviews')
                .where('userId', 'in', chunk)
                .orderBy('updatedAt', 'desc')
                .limit(FEED_PAGE_SIZE).get();
        });

        // 2. Récupération des ajouts en Bibliothèque (Library)
        const libraryPromises = allFollowingIds.map(fId => {
            return db.collection('users').doc(fId).collection('library')
                .orderBy('updatedAt', 'desc')
                .limit(FEED_PAGE_SIZE).get();
        });

        const [reviewSnapshots, librarySnapshots] = await Promise.all([
            Promise.all(reviewPromises),
            Promise.all(libraryPromises)
        ]);
        
        let allFeedItems = [];
        reviewSnapshots.forEach(snap => {
            snap.docs.forEach(doc => {
                allFeedItems.push({
                    id: doc.id,
                    type: 'REVIEW_ADDED',
                    data: doc.data(),
                    updatedAt: doc.data().updatedAt?.toDate()
                });
            });
        });

        librarySnapshots.forEach((snap, index) => {
            const fId = allFollowingIds[index];
            snap.docs.forEach(doc => {
                allFeedItems.push({
                    id: `lib_${fId}_${doc.id}`,
                    type: 'LIBRARY_UPDATED',
                    data: { userId: fId, ...doc.data() },
                    updatedAt: doc.data().updatedAt?.toDate()
                });
            });
        });

        // Tri chronologique global (Critiques + Bibliothèque combinées)
        allFeedItems.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
        
        const startIndex = (page - 1) * limitSize;
        const endIndex = page * limitSize;
        const feed = allFeedItems.slice(startIndex, endIndex);
        const totalPages = Math.ceil(allFeedItems.length / limitSize);

        feed.forEach(item => delete item.updatedAt);

        res.json({
            success: true,
            totalItems: allFeedItems.length,
            page,
            totalPages,
            limit: limitSize,
            feed,
        });
    } catch (error) {
        next(error);
    }
};
