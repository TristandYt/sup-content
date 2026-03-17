// services/igdbAuth.js
const axios = require('axios');

let accessToken = null;
let tokenExpirationTime = null;

const getIgdbToken = async () => {
    // si on a un token et qu'il est encore valide --> on le réutilise
    if (accessToken && Date.now() < tokenExpirationTime) {
        return accessToken;
    }

    try {
        const response = await axios.post(`https://id.twitch.tv/oauth2/token`, null, {
            params: {
                client_id: process.env.IGDB_CLIENT_ID,
                client_secret: process.env.IGDB_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });

        accessToken = response.data.access_token;
        // on calcule la date d'expiration (expires_in est en secondes)
        tokenExpirationTime = Date.now() + (response.data.expires_in * 1000) - 60000; // Marge de 1 min

        return accessToken;
    } catch (error) {
        console.error("Erreur lors de la récupération du token IGDB", error);
        throw new Error("Impossible de s'authentifier auprès de IGDB");
    }
};

module.exports = { getIgdbToken };