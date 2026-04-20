/*
 * Contrôleur utilisateur.
 *
 * Modèle Firestore : users/{userId}
 *   { username, email, bio, favorites[], createdAt, updatedAt }
 */
const { admin, db, auth } = require('../Services/Firebase');

/*
 * GET /api/users/profile  (privé)
 */
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, msg: 'Profil introuvable' });
        }

        res.json({ success: true, user: userDoc.data() });
    } catch (error) {
        next(error);
    }
};

/*
 * GET /api/users/:userId/profile  (public)
 * Retourne uniquement les champs non sensibles : username, bio, createdAt.
 */
exports.getPublicProfile = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, msg: 'Utilisateur introuvable' });
        }

        const { username, bio, createdAt } = userDoc.data();
        res.json({ success: true, user: { userId, username, bio, createdAt } });
    } catch (error) {
        next(error);
    }
};

/*
 * PUT /api/users/profile
 * Body : { username?, bio? }
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { username, bio } = req.body;

        const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (username !== undefined) updates.username = username;
        if (bio !== undefined) updates.bio = bio;

        await db.collection('users').doc(userId).update(updates);
        res.json({ success: true, msg: 'Profil mis à jour' });
    } catch (error) {
        next(error);
    }
};

/*
 * PUT /api/users/password
 * Body : { newPassword }
 */
exports.updatePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ success: false, msg: 'Nouveau mot de passe requis' });
        }

        await auth.updateUser(userId, { password: newPassword });
        res.json({ success: true, msg: 'Mot de passe mis à jour' });
    } catch (error) {
        next(error);
    }
};

/*
 * PUT /api/users/email
 * Body : { newEmail }
 */
exports.updateEmail = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { newEmail } = req.body;

        if (!newEmail) {
            return res.status(400).json({ success: false, msg: 'Nouvel email requis' });
        }

        await auth.updateUser(userId, { email: newEmail });
        await db.collection('users').doc(userId).update({
            email: newEmail,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ success: true, msg: 'Email mis à jour' });
    } catch (error) {
        next(error);
    }
};

/*
 * DELETE /api/users/account
 */
exports.deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await auth.deleteUser(userId);
        await db.collection('users').doc(userId).delete();
        res.json({ success: true, msg: 'Compte supprimé' });
    } catch (error) {
        next(error);
    }
};

/*
 * POST /api/users/favorites
 * Body : { gameId, gameName, gameCover }
 */
exports.addFavorite = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { gameId, gameName, gameCover } = req.body;

        if (!gameId) return res.status(400).json({ success: false, msg: 'gameId manquant' });

        await db.collection('users').doc(userId).update({
            favorites: admin.firestore.FieldValue.arrayUnion({
                gameId: gameId.toString(),
                gameName: gameName || '',
                gameCover: gameCover || '',
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ success: true, msg: 'Jeu ajouté aux favoris' });
    } catch (error) {
        next(error);
    }
};

/*
 * DELETE /api/users/favorites/:gameId
 */
exports.removeFavorite = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { gameId } = req.params;

        const doc = await db.collection('users').doc(userId).get();
        const favorites = doc.data().favorites || [];
        const updatedFavorites = favorites.filter(fav => fav.gameId !== gameId.toString());

        await db.collection('users').doc(userId).update({
            favorites: updatedFavorites,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ success: true, msg: 'Favori retiré' });
    } catch (error) {
        next(error);
    }
};

/*
 * GET /api/users/favorites
 */
exports.getFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const doc = await db.collection('users').doc(userId).get();
        const favorites = doc.data().favorites || [];
        res.json({ success: true, total: favorites.length, favorites });
    } catch (error) {
        next(error);
    }
};
