// Contrôleur des jeux
const { admin, db } = require('../Services/Firebase');
const IGDBService = require('../Services/Api_igdb');
const { filterGamesByAge, isAgeAllowed } = require('../utils/pegiHelper');

const getOptionalUserId = async (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(token);
            return decodedToken.uid;
        } catch (err) {
            return null; 
        }
    }
    return null;
};

exports.getPopularGames = async (req, res, next) => {
    try {
        const { sortBy, order } = req.query;
        let games = await IGDBService.getPopularGames(sortBy, order);

        const userId = await getOptionalUserId(req);
        if (userId) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                games = filterGamesByAge(games, userDoc.data().birthDate);
            }
        }

        res.json(games);
    } catch (error) {
        next(error);
    }
};

exports.searchGames = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, msg: 'Paramètre q (recherche) manquant' });
        }

        let games = await IGDBService.searchGames(q);

        const userId = await getOptionalUserId(req);
        if (userId) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                games = filterGamesByAge(games, userDoc.data().birthDate);
            }
        }

        res.json(games);
    } catch (error) {
        next(error);
    }
};

exports.getGameDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const gameRef = db.collection('games').doc(id.toString());
        const gameDoc = await gameRef.get();

        let game;
        if (gameDoc.exists) {
            game = gameDoc.data(); 
        } else {
            const details = await IGDBService.getGameDetails(id);
            if (!details || details.length === 0) return res.status(404).json({ success: false, msg: 'Jeu introuvable' });
            
            game = details[0];
            await gameRef.set({ ...game, supcontent_cached_at: admin.firestore.FieldValue.serverTimestamp() });
        }

        const userId = await getOptionalUserId(req);
        if (userId) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && !isAgeAllowed(userDoc.data().birthDate, game.age_ratings)) {
                return res.status(403).json({ success: false, msg: 'Contenu restreint. Vous n\'avez pas l\'âge requis pour voir ce jeu.' });
            }
        }

        res.json(game);
    } catch (error) {
        next(error);
    }
};