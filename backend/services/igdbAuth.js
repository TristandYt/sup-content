// Gestion de l'authentification OAuth2 Twitch/IGDB
const axios = require('axios');

let accessToken = null;
let tokenExpirationTime = null;

const getIgdbToken = async () => {
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
        tokenExpirationTime = Date.now() + (response.data.expires_in * 1000) - 60000;

        return accessToken;
    } catch (error) {
        console.error("Erreur lors de la récupération du token IGDB", error);
        throw new Error("Impossible de s'authentifier auprès de IGDB");
    }
};

module.exports = { getIgdbToken };