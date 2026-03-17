const express = require('express');
const router = express.Router();
const igdb = require('../Services/Api_igdb');

router.get('/popular', async (req, res) => {
    try {
        const games = await igdb.getPopularGames();
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