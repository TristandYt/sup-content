// controller games
const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin'); // a tester si ça fonctionne
const { getIgdbToken } = require('../services/igdbAuth');


const router = express.Router();
const getDb = () => admin.apps.length ? admin.firestore() : null; // le temps qu'on a pas la db firebase
//const db = admin.firestore();

const IGDB_BASE_URL = 'https://api.igdb.com/v4';

// middleware pour configurer les headers IGDB
const getIgdbHeaders = async () => {
    const token = await getIgdbToken();
    return {
        'Client-ID': process.env.IGDB_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'text/plain' // IGDB utilise du texte brut pour ses requetes
    };
};

router.get('/popular', async (req, res) => {
    try {
        const { sortBy, order } = req.query;
        const games = await igdb.getPopularGames(sortBy, order);
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: "Erreur IGDB Populaires" });
    }
});

// route de recherche (barre de recherche du front)
router.get('/search', async (req, res) => {
    const { q } = req.query; // ex: /api/games/search?q=witcher

    if (!q) return res.status(400).json({ msg: 'Requête de recherche manquante' });

    try {
        const headers = await getIgdbHeaders();
        // requête Apicalypse : on cherche le nom, l'id, l'id de la cover, et l'année
        const body = `
      search "${q}";
      fields name, cover.image_id, first_release_date;
      limit 20;
    `;

        const response = await axios.post(`${IGDB_BASE_URL}/games`, body, { headers });
        res.json(response.data);
    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        res.status(500).json({ msg: 'Erreur serveur lors de la recherche' });
    }
});

// route pour les details d'un jeu (fiche media detaillée)
router.get('/:id', async (req, res) => {
    const gameId = req.params.id;

    try {
        // cherche le jeu dans notre base firestore locale
        // const gameRef = db.collection('games').doc(gameId); // L'ID du document sera l'ID IGDB // pareil on remettra apres
        const doc = await gameRef.get(); // same
        const db = getDb();
        if (!db) throw new Error("Base de données non initialisée");

        const gameRef = db.collection('games').doc(gameId);

        if (doc.exists) {
            console.log(`CACHE HIT : Le jeu ${gameId} a été trouvé dans Firebase !`);
            return res.json(doc.data());
        }

        // si non trouve --> on interroge l'API IGDB
        console.log(`CACHE MISS : Récupération du jeu ${gameId} depuis IGDB...`);
        const headers = await getIgdbHeaders();
        const body = `
      where id = ${gameId};
      fields name, summary, cover.image_id, genres.name, platforms.name, first_release_date, total_rating, total_rating_count, involved_companies.company.name;
    `;

        const response = await axios.post(`${IGDB_BASE_URL}/games`, body, { headers });

        if (response.data.length === 0) {
            return res.status(404).json({ msg: 'Jeu non trouvé sur IGDB' });
        }

        const gameData = response.data[0];

        // on sauvegarde le resultat dans firestore pour la prochaine fois
        await gameRef.set({
            ...gameData,
            supcontent_cached_at: admin.firestore.FieldValue.serverTimestamp() // on note quand on l'a mis en cache
        });

        // on renvoie la donnée au client
        res.json(gameData);

    } catch (err) {
        console.error("Erreur serveur API Games :", err.response ? err.response.data : err.message);
        res.status(500).json({ msg: 'Erreur serveur lors de la récupération des détails' });
    }
});

module.exports = router;