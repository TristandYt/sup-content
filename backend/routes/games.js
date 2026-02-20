// controller games
const express = require('express');
const axios = require('axios');
const { getIgdbToken } = require('../services/igdbAuth');
const router = express.Router();

const IGDB_BASE_URL = 'https://api.igdb.com/v4';

// Middleware pour configurer les headers IGDB
const getIgdbHeaders = async () => {
    const token = await getIgdbToken();
    return {
        'Client-ID': process.env.IGDB_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'text/plain' // IGDB utilise du texte brut pour ses requêtes
    };
};

// 1. Route de recherche (Barre de recherche du front)
router.get('/search', async (req, res) => {
    const { q } = req.query; // ex: /api/games/search?q=witcher

    if (!q) return res.status(400).json({ msg: 'Requête de recherche manquante' });

    try {
        const headers = await getIgdbHeaders();
        // Requête Apicalypse : on cherche le nom, l'id, l'id de la cover, et l'année
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

// 2. Route pour les détails d'un jeu (Fiche média détaillée)
router.get('/:id', async (req, res) => {
    try {
        const headers = await getIgdbHeaders();
        // On récupère beaucoup plus de champs pour la fiche détaillée
        const body = `
      where id = ${req.params.id};
      fields name, summary, cover.image_id, genres.name, platforms.name, first_release_date, total_rating, total_rating_count, involved_companies.company.name;
    `;

        const response = await axios.post(`${IGDB_BASE_URL}/games`, body, { headers });

        if (response.data.length === 0) {
            return res.status(404).json({ msg: 'Jeu non trouvé' });
        }

        res.json(response.data[0]);
    } catch (err) {
        res.status(500).json({ msg: 'Erreur serveur lors de la récupération des détails' });
    }
});

module.exports = router;