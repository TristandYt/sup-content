/*
 * Contrôleur de bibliothèque.
 * Gère les jeux de la collection utilisateur : ajouter, lire et supprimer.
 */
const { admin, db } = require('../Services/Firebase');

exports.updateGameStatus = async (req, res, next) => {
    try {
        const { gameId, status } = req.body;
        const userId = req.user.id;

        const validStatuses = ['to_play', 'playing', 'finished', 'dropped'];
        if (!validStatuses.includes(status)) return res.status(400).json({ success: false, msg: 'Statut invalide' });
        if (!gameId) return res.status(400).json({ success: false, msg: 'ID du jeu manquant' });

        const gameRef = db.collection('users').doc(userId).collection('library').doc(gameId.toString());

        await gameRef.set({
            gameId: gameId.toString(),
            status: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        res.json({ success: true, msg: `Le jeu ${gameId} a bien été passé en statut '${status}'` });
    } catch (error) {
        next(error);
    }
};

exports.getMyLibrary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const snapshot = await db.collection('users').doc(userId).collection('library').get();

        const library = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, library });
    } catch (error) {
        next(error);
    }
};

exports.getGameFromLibrary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { gameId } = req.params;
        
        const gameDoc = await db.collection('users').doc(userId).collection('library').doc(gameId.toString()).get();

        if (!gameDoc.exists) return res.status(404).json({ success: false, msg: 'Jeu introuvable dans la bibliothèque' });

        res.json({ success: true, game: gameDoc.data() });
    } catch (error) {
        next(error);
    }
};

exports.removeGameFromLibrary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { gameId } = req.params;
        
        const gameRef = db.collection('users').doc(userId).collection('library').doc(gameId.toString());
        await gameRef.delete();

        res.json({ success: true, msg: 'Jeu supprimé de la bibliothèque' });
    } catch (error) {
        next(error);
    }
};