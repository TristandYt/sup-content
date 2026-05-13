/*
 * Contrôleur utilisateur.
 *
 * Modèle Firestore : users/{userId}
 *   { username, email, bio, favorites[], createdAt, updatedAt }
 */
const { admin, db, auth } = require('../Services/Firebase');
const Logger = require('../Services/Logger');
const IGDBService = require('../Services/Api_igdb');

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
 * PUT /api/users/profile
 * Body : { username?, bio? }
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { username, bio, preferences, avatarUrl, website } = req.body;

        const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (username !== undefined) updates.username = username;
        if (bio !== undefined) updates.bio = bio;
        if (preferences !== undefined) updates.preferences = preferences;
        if (avatarUrl !== undefined) updates['profileData.avatarUrl'] = avatarUrl;
        if (website !== undefined) updates['profileData.website'] = website;

        await db.collection('users').doc(userId).update(updates);

        // Logger la mise à jour du profil
        const logUpdates = {};
        if (username !== undefined) logUpdates.username = username;
        if (bio !== undefined) logUpdates.bio = bio;
        if (avatarUrl !== undefined) logUpdates.avatarUrl = avatarUrl;
        if (website !== undefined) logUpdates.website = website;

        await Logger.log('profile_updated', userId, { updates: logUpdates });

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

        // Logger la mise à jour du mot de passe
        await Logger.log('password_updated', userId, {});

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

        // Logger la mise à jour de l'email
        await Logger.log('email_updated', userId, { newEmail });

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

        // Logger la suppression du compte
        await Logger.log('account_deleted', userId, {});

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

        // Logger l'ajout aux favoris
        await Logger.log('favorite_added', userId, { gameId, gameName });

        // Recommandation automatique en fonction du jeu
        try {
            const similarGames = await IGDBService.getSimilarGames(gameId);
            if (similarGames && similarGames.length > 0 && similarGames[0].similar_games && similarGames[0].similar_games.length > 0) {
                const recGame = similarGames[0].similar_games[0];
                await db.collection('notifications').add({
                    userId,
                    type: 'RECOMMENDATION',
                    message: `Puisque vous avez aimé ${gameName || 'ce jeu'}, vous devriez découvrir ${recGame.name} !`,
                    gameId: recGame.id,
                    isRead: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Erreur génération notification reco:', error.message);
        }

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

        // Logger la suppression des favoris
        await Logger.log('favorite_removed', userId, { gameId });

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

/*
 * GET /api/users/logs (Admin seulement)
 */
exports.getLogs = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = await Logger.getLogs(limit);
        res.json({ success: true, logs });
    } catch (error) {
        next(error);
    }
};

/*
 * POST /api/users/promote/:userId (Admin seulement)
 * Body : { role: 'admin' }
 */
exports.promoteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (role !== 'admin') {
            return res.status(400).json({ success: false, msg: 'Rôle invalide' });
        }

        await db.collection('users').doc(userId).update({
            role: 'admin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Logger la promotion
        await Logger.log('user_promoted', req.user.id, { promotedUserId: userId, newRole: 'admin' });

        res.json({ success: true, msg: 'Utilisateur promu administrateur' });
    } catch (error) {
        next(error);
    }
};

/*
 * GET /api/users/me/export
 * Exportation des données RGPD
 */
exports.exportUserData = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        const librarySnap = await db.collection('users').doc(userId).collection('library').get();
        const library = librarySnap.docs.map(doc => doc.data());

        const reviewsSnap = await db.collection('reviews').where('userId', '==', userId).get();
        const reviews = reviewsSnap.docs.map(doc => doc.data());

        const followsSnap = await db.collection('follows').where('followerId', '==', userId).get();
        const follows = followsSnap.docs.map(doc => doc.data());

        const exportData = {
            profile: userData, library, reviews, following: follows,
            exportedAt: new Date().toISOString()
        };

        res.setHeader('Content-disposition', `attachment; filename=export_rgpd_${userId}.json`);
        res.setHeader('Content-type', 'application/json');
        res.status(200).send(JSON.stringify(exportData, null, 2));
    } catch (error) {
        next(error);
    }
};
