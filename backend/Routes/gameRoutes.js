const express = require('express');
const router = express.Router();
const igdb = require('../Services/Api_igdb');

router.get('/popular', async (req, res) => {
    try {
        // On récupère sortBy et order depuis les paramètres de l'URL (ex: ?sortBy=name&order=asc)
        const { sortBy, order } = req.query;
        
        // On passe ces paramètres à notre service IGDB
        const games = await igdb.getPopularGames(sortBy, order);
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: "Erreur IGDB Populaires" });
    }
});

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

module.exports = router;