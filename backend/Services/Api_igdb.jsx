const axios = require('axios');

app.get('/search-game', async (req, res) => {
    try {
        // 1. Obtenir le token (Tu devrais normalement le mettre en cache)
        const authRes = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`);
        const token = authRes.data.access_token;

        // 2. Requete vers IGDB
        const gamesRes = await axios({
            url: "https://api.igdb.com/v4/games",
            method: 'POST',
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
            },
            data: "fields name, cover.url, rating; search \"The Witcher 3\";"
        });

        res.json(gamesRes.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});