let cachedToken = null; 

app.get('/api/search-game', async (req, res) => {
    const gameTitle = req.query.q; 
    
    if (!gameTitle) return res.status(400).json({ error: "Nom du jeu manquant" });

    try {
        if (!cachedToken) {
            const authRes = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`);
            cachedToken = authRes.data.access_token;
            console.log("🔑 Nouveau Token IGDB généré et mis en cache");
        }

        const gamesRes = await axios({
            url: "https://api.igdb.com/v4/games",
            method: 'POST',
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${cachedToken}`,
            },
            data: `fields name, cover.url, total_rating; search "${gameTitle}"; limit 10;`
        });

        res.json(gamesRes.data);
    } catch (error) {
        if (error.response?.status === 401) cachedToken = null;
        
        console.error("Erreur IGDB:", error.message);
        res.status(500).json({ error: "Erreur lors de la recherche IGDB" });
    }
});