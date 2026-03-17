// backend/controllers/followController.js
const admin = require('firebase-admin');

const getDb = () => admin.apps.length ? admin.firestore() : null;

// suivre un utilisateur
exports.followUser = async (req, res, next) => {
    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        const followerId = req.user.id; // celui qui clique sur "Suivre"
        const followingId = req.params.userId; // celui qui est suivi

        // on empeche l'utilisateur de se suivre lui meme (ça serait bete)
        if (followerId === followingId) {
            return res.status(400).json({ success: false, msg: "Vous ne pouvez pas vous suivre vous-même !" });
        }

        // on verifie que la cible existe vraiment
        const targetUser = await db.collection('users').doc(followingId).get();
        if (!targetUser.exists) {
            return res.status(404).json({ success: false, msg: "Utilisateur introuvable" });
        }

        // ID unique pour eviter les doublon
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

// ne plus suivre un user (Unfollow)
exports.unfollowUser = async (req, res, next) => {
    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        const followerId = req.user.id;
        const followingId = req.params.userId;

        const followId = `${followerId}_${followingId}`;

        // on suppr le document de liaison
        await db.collection('follows').doc(followId).delete();

        res.json({ success: true, msg: "Vous ne suivez plus cet utilisateur." });
    } catch (error) {
        next(error);
    }
};

// voir ses abonnements
exports.getMyFollowing = async (req, res, next) => {
    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        const userId = req.user.id;
        const snapshot = await db.collection('follows').where('followerId', '==', userId).get();

        const following = [];
        snapshot.forEach(doc => {
            following.push(doc.data().followingId);
        });

        res.json({ success: true, total: following.length, following });
    } catch (error) {
        next(error);
    }
};