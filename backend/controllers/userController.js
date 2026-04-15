/*
 * Contrôleur utilisateur.
 * Gère la récupération de profil et les favoris utilisateur.
 */
const { admin, db, auth } = require('../Services/Firebase');

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

exports.addFavorite = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { gameId, gameName, gameCover } = req.body;

        if (!gameId) return res.status(400).json({ error: 'gameId manquant' });

        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            favorites: admin.firestore.FieldValue.arrayUnion({
                gameId: gameId.toString(),
                gameName,
                gameCover
            })
        });

        res.json({ success: true, msg: 'Jeu ajouté aux favoris' });
    } catch (error) {
        next(error);
    }
};

exports.removeFavorite = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { gameId } = req.params;

        const doc = await db.collection('users').doc(userId).get();
        const favorites = doc.data().favorites || [];
        
        const updatedFavorites = favorites.filter(fav => fav.gameId !== gameId.toString());

        await db.collection('users').doc(userId).update({ favorites: updatedFavorites });
        res.json({ success: true, msg: 'Favori retiré' });
    } catch (error) {
        next(error);
    }
};

exports.getFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const doc = await db.collection('users').doc(userId).get();
        const favorites = doc.data().favorites || [];
        res.json({ success: true, favorites });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { username, bio } = req.body;

        await db.collection('users').doc(userId).update({
            username,
            bio,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true, msg: 'Profil mis à jour' });
    } catch (error) {
        next(error);
    }
};

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

exports.updateEmail = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { newEmail } = req.body;

        if (!newEmail) {
            return res.status(400).json({ success: false, msg: 'Nouvel email requis' });
        }

        await auth.updateUser(userId, { email: newEmail });

        res.json({ success: true, msg: 'Email mis à jour' });
    } catch (error) {
        next(error);
    }
};