/*
 * Routes jeux.
 * Gère la recherche IGDB, les jeux populaires et la récupération des détails.
 */
// controller games
const express = require('express');
const axios = require('axios');
const { admin, db } = require('../Services/Firebase');
const { getIgdbToken } = require('../Services/igdbAuth');

const router = express.Router();
const IGDB_BASE_URL = 'https://api.igdb.com/v4';

const getIgdbHeaders = async () => {
    const token = await getIgdbToken();
    return {
        'Client-ID': process.env.IGDB_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'text/plain'
    };
};

const fetchGameById = async (gameId) => {
    const gameRef = db.collection('games').doc(gameId);
    const doc = await gameRef.get();

    if (doc.exists) {
        console.log(`CACHE HIT : Le jeu ${gameId} a été trouvé dans Firebase !`);
        return doc.data();
    }

    console.log(`CACHE MISS : Récupération du jeu ${gameId} depuis IGDB...`);
    const headers = await getIgdbHeaders();
    const body = `
      where id = ${gameId};
      fields name, summary, cover.image_id, genres.name, platforms.name, first_release_date, total_rating, total_rating_count, involved_companies.company.name;
    `;

    const response = await axios.post(`${IGDB_BASE_URL}/games`, body, { headers });
    if (!response.data || response.data.length === 0) {
        const error = new Error('Jeu non trouvé sur IGDB');
        error.status = 404;
        throw error;
    }

    const gameData = response.data[0];
    await gameRef.set({
        ...gameData,
        supcontent_cached_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return gameData;
};

router.get('/popular', async (req, res) => {
    try {
        const { sortBy = 'total_rating', order = 'desc' } = req.query;
        const headers = await getIgdbHeaders();
        const body = `
      fields name, cover.image_id, first_release_date, total_rating, total_rating_count;
      where total_rating_count > 10;
      sort ${sortBy} ${order};
      limit 20;
    `;

        const response = await axios.post(`${IGDB_BASE_URL}/games`, body, { headers });
        res.json(response.data);
    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
        res.status(500).json({ msg: 'Erreur serveur lors de la récupération des jeux populaires' });
    }
});

router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ msg: 'Requête de recherche manquante' });

    try {
        const headers = await getIgdbHeaders();
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

router.get('/details/:id', async (req, res) => {
    const gameId = req.params.id;
    try {
        const gameData = await fetchGameById(gameId);
        res.json(gameData);
    } catch (err) {
        if (err.status === 404) return res.status(404).json({ msg: err.message });
        console.error(err.response ? err.response.data : err.message || err);
        res.status(500).json({ msg: 'Erreur lors de la récupération des détails du jeu' });
    }
});

router.get('/:id', async (req, res) => {
    const gameId = req.params.id;
    try {
        const gameData = await fetchGameById(gameId);
        res.json(gameData);
    } catch (err) {
        if (err.status === 404) return res.status(404).json({ msg: err.message });
        console.error(err.response ? err.response.data : err.message || err);
        res.status(500).json({ msg: 'Erreur serveur lors de la récupération des détails' });
    }
});

module.exports = router;
