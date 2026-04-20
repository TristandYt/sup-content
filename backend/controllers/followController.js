/*
 * Contrôleur de suivi.
 * Gère les relations follow/unfollow entre utilisateurs.
 *
 * Modèle Firestore : follows/{followerId}_{followingId}
 *   { followerId, followingId, createdAt }
 */
const { admin, db } = require('../Services/Firebase');

/*
 * POST /api/follows/:userId
 * Suit un utilisateur. Vérifie qu'il existe et qu'on ne se suit pas soi-même.
 */
exports.followUser = async (req, res, next) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;

        if (followerId === followingId) {
            return res.status(400).json({ success: false, msg: 'Vous ne pouvez pas vous suivre vous-même' });
        }

        const targetUser = await db.collection('users').doc(followingId).get();
        if (!targetUser.exists) {
            return res.status(404).json({ success: false, msg: 'Utilisateur introuvable' });
        }

        const followId = `${followerId}_${followingId}`;
        const followDoc = await db.collection('follows').doc(followId).get();
        if (followDoc.exists) {
            return res.status(409).json({ success: false, msg: 'Vous suivez déjà cet utilisateur' });
        }

        await db.collection('follows').doc(followId).set({
            followerId,
            followingId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(201).json({ success: true, msg: 'Vous suivez maintenant cet utilisateur' });
    } catch (error) {
        next(error);
    }
};

/*
 * DELETE /api/follows/:userId
 * Arrête de suivre un utilisateur.
 */
exports.unfollowUser = async (req, res, next) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;
        const followId = `${followerId}_${followingId}`;

        const followDoc = await db.collection('follows').doc(followId).get();
        if (!followDoc.exists) {
            return res.status(404).json({ success: false, msg: 'Vous ne suivez pas cet utilisateur' });
        }

        await db.collection('follows').doc(followId).delete();
        res.json({ success: true, msg: 'Vous ne suivez plus cet utilisateur' });
    } catch (error) {
        next(error);
    }
};

/*
 * GET /api/follows/me/following
 * Retourne la liste des utilisateurs que le user connecté suit.
 */
exports.getMyFollowing = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const snapshot = await db.collection('follows')
            .where('followerId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const following = snapshot.docs.map(doc => ({
            followingId: doc.data().followingId,
            since: doc.data().createdAt,
        }));

        res.json({ success: true, total: following.length, following });
    } catch (error) {
        next(error);
    }
};

/*
 * GET /api/follows/me/followers
 * Retourne la liste des utilisateurs qui suivent le user connecté.
 */
exports.getMyFollowers = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const snapshot = await db.collection('follows')
            .where('followingId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const followers = snapshot.docs.map(doc => ({
            followerId: doc.data().followerId,
            since: doc.data().createdAt,
        }));

        res.json({ success: true, total: followers.length, followers });
    } catch (error) {
        next(error);
    }
};
