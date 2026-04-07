const express = require('express');
const router = express.Router();
const igdb = require('../Services/Api_igdb');

// 1. Récupérer les jeux populaires
router.get('/popular', async (req, res) => {
    try {
        const { sortBy, order } = req.query;
        const games = await igdb.getPopularGames(sortBy, order);
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: "Erreur IGDB Populaires" });
    }
});

// 2. Rechercher des jeux
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: "Requête vide" });
        const games = await igdb.searchGames(q);
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: "Erreur IGDB Recherche" });
    }
});

// --- LA ROUTE MANQUANTE EST ICI ---
// 3. Récupérer les détails d'un jeu par son ID
router.get('/details/:id', async (req, res) => {
    try {
        const gameId = req.params.id;
        // On appelle la méthode getGameDetails de ton service Api_igdb.js
        const gameDetails = await igdb.getGameDetails(gameId);
        res.json(gameDetails);
    } catch (error) {
        console.error("Erreur détails jeu:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des détails du jeu" });
    }
});

module.exports = router;