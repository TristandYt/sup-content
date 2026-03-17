let cachedToken = null; // On stocke le token ici (dans la RAM de ton Ryzen 7)

app.get('/api/search-game', async (req, res) => {
    const gameTitle = req.query.q; // Récupère le nom depuis l'URL : /search-game?q=zelda
    
    if (!gameTitle) return res.status(400).json({ error: "Nom du jeu manquant" });

    try {
        // 1. Gestion intelligente du Token (Évite de saturer Twitch)
        if (!cachedToken) {
            const authRes = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`);
            cachedToken = authRes.data.access_token;
            console.log("🔑 Nouveau Token IGDB généré et mis en cache");
        }

        // 2. Requête IGDB avec syntaxe "Apicalypse"
        const gamesRes = await axios({
            url: "https://api.igdb.com/v4/games",
            method: 'POST',
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${cachedToken}`,
            },
            // On demande : nom, url de l'image, et note moyenne
            data: `fields name, cover.url, total_rating; search "${gameTitle}"; limit 10;`
        });

        res.json(gamesRes.data);
    } catch (error) {
        // Si le token est expiré (401), on le vide pour le régénérer au prochain essai
        if (error.response?.status === 401) cachedToken = null;
        
        console.error("❌ Erreur IGDB:", error.message);
        res.status(500).json({ error: "Erreur lors de la recherche IGDB" });
    }
});