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
 * Body : { username?, bio?, avatar?, preferences?, website? }
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // On liste tous les champs que l'utilisateur a le droit de modifier
        const allowedFields = ['username', 'bio', 'preferences', 'avatar', 'website'];

        const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        const logUpdates = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
                
                if (field !== 'preferences') {
                    logUpdates[field] = req.body[field];
                }
            }
        });

        // Mise à jour dans Firestore
        await db.collection('users').doc(userId).update(updates);

        // Log de l'action si au moins un champ a été modifié
        if (Object.keys(logUpdates).length > 0) {
            await Logger.log('profile_updated', userId, { updates: logUpdates });
        }

        res.json({ success: true, msg: 'Profil mis à jour' });
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

exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, msg: 'Utilisateur introuvable' });
    }

    const preferences = userDoc.data().preferences || { 
      theme: 'dark', 
      language: 'fr', 
      emailNotifications: true, 
      pushNotifications: true 
    };

    res.json({ success: true, preferences });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { theme, language, emailNotifications, pushNotifications } = req.body;

    // Validation
    const validThemes = ['light', 'dark'];
    const validLanguages = ['en', 'fr'];

    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ success: false, msg: 'Thème invalide' });
    }
    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({ success: false, msg: 'Langue invalide' });
    }

    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    const preferences = {};

    if (theme !== undefined) preferences.theme = theme;
    if (language !== undefined) preferences.language = language;
    if (emailNotifications !== undefined) preferences.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) preferences.pushNotifications = pushNotifications;

    updates.preferences = preferences;

    await db.collection('users').doc(userId).update(updates);
    await Logger.log('preferences_updated', userId, { preferences });

    res.json({ success: true, msg: 'Préférences mises à jour', preferences });
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
