/*
 * Contrôleur de suivi.
 * Gère les relations follow/unfollow entre utilisateurs.
 */
const { admin, db } = require('../Services/Firebase');

exports.followUser = async (req, res, next) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;

        if (followerId === followingId) return res.status(400).json({ success: false, msg: "Vous ne pouvez pas vous suivre vous-même !" });

        const targetUser = await db.collection('users').doc(followingId).get();
        if (!targetUser.exists) return res.status(404).json({ success: false, msg: "Utilisateur introuvable" });

        const followId = `${followerId}_${followingId}`;

        await db.collection('follows').doc(followId).set({
            followerId,
            followingId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true, msg: "Vous suivez maintenant cet utilisateur !" });
    } catch (error) {
        next(error);
    }
};

exports.unfollowUser = async (req, res, next) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;
        const followId = `${followerId}_${followingId}`;

        await db.collection('follows').doc(followId).delete();

        res.json({ success: true, msg: "Vous ne suivez plus cet utilisateur." });
    } catch (error) {
        next(error);
    }
};

exports.getMyFollowing = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const snapshot = await db.collection('follows').where('followerId', '==', userId).get();

        const following = snapshot.docs.map(doc => doc.data().followingId);
        res.json({ success: true, total: following.length, following });
    } catch (error) {
        next(error);
    }
};