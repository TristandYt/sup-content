// backend/controllers/listController.js
const admin = require('firebase-admin');

// on recupere l'instance de Firestore de maniere secur (quand elle sera initialiser i guess)
const getDb = () => admin.apps.length ? admin.firestore() : null;

exports.updateGameStatus = async (req, res, next) => {
    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        const { gameId, status } = req.body;
        const userId = req.user.id; // recup auto grace a notre middleware auth (le goat)

        // validation de securité basique
        const validStatuses = ['to_play', 'playing', 'finished', 'dropped'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, msg: 'Statut invalide' });
        }
        if (!gameId) {
            return res.status(400).json({ success: false, msg: 'ID du jeu manquant' });
        }

        // chemin vers le document : users -> [ID_USER] -> library -> [ID_GAME]
        const gameRef = db.collection('users').doc(userId).collection('library').doc(gameId.toString());

        // sauvegarde dans Firestore (merge: true permet de mettre a jour sans ecraser le reste)
        await gameRef.set({
            gameId: gameId,
            status: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        res.json({
            success: true,
            msg: `Le jeu ${gameId} a bien été passé en statut '${status}'`
        });

    } catch (error) {
        next(error); // on envoie l'erreur a notre gestionnaire global
    }
};

// fonction pour recuperer toute la bibliotheque du user
exports.getMyLibrary = async (req, res, next) => {
    try {
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        const userId = req.user.id;
        const snapshot = await db.collection('users').doc(userId).collection('library').get();

        const library = [];
        snapshot.forEach(doc => {
            library.push(doc.data());
        });

        res.json({ success: true, library });
    } catch (error) {
        next(error);
    }
};