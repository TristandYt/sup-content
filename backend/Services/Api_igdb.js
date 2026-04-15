/*
 * Service IGDB.
 * Envoie des requêtes Apicalypse à l'API IGDB via le token Twitch.
 */
const axios = require('axios');

class IGDBService {
    constructor() {
        this.clientId = process.env.IGDB_CLIENT_ID;
        this.clientSecret = process.env.IGDB_CLIENT_SECRET;
        this.accessToken = null;
        this.baseUrl = 'https://api.igdb.com/v4';
    }

    /**
     * Gère l'authentification OAuth2 auprès de Twitch
     */
    async getAccessToken() {
        if (this.accessToken) return this.accessToken;

        try {
            const response = await axios.post(
                `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`
            );
            this.accessToken = response.data.access_token;
            return this.accessToken;
        } catch (error) {
            console.error("Erreur d'authentification Twitch:", error.message);
            throw new Error("Impossible de récupérer le token IGDB");
        }
    }

    /**
     * Méthode POST à IGDB
     */
    async request(endpoint, query) {
        try {
            const token = await this.getAccessToken();
            const response = await axios({
                url: `${this.baseUrl}/${endpoint}`,
                method: 'POST',
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                data: query
            });
            return response.data;
        } catch (error) {
            //token est expiré (401)
            if (error.response && error.response.status === 401) {
                this.accessToken = null;
            }
            console.error(`Erreur IGDB (${endpoint}):`, error.message);
            throw error;
        }
    }

    /**
     * Recherche de jeux par titre
     */
    async searchGames(title) {
        // On récupère le nom, l'ID de l'image (cover), la note et le résumé
        const query = `
            fields name, cover.image_id, total_rating, summary, first_release_date;
            search "${title}";
            limit 40;
        `;
        return this.request('games', query);
    }

    /**
     * Récupère les jeux les mieux notés (pour la page d'accueil)
     * Ajout de paramètres pour le tri global
     */
    async getPopularGames(sortBy = 'total_rating', order = 'desc') {
        // Validation simple pour éviter les erreurs de syntaxe IGDB
        const field = ['name', 'total_rating', 'first_release_date'].includes(sortBy) ? sortBy : 'total_rating';
        const direction = order === 'asc' ? 'asc' : 'desc';

        const query = `
            fields name, cover.image_id, total_rating, first_release_date;
            sort ${field} ${direction};
            where total_rating != null & cover != null;
            limit 40;
        `;
        return this.request('games', query);
    }

    /**
     * Récupère les détails complets d'un jeu par son ID
     */
    async getGameDetails(gameId) {
        const query = `
            fields name, cover.image_id, summary, genres.name, platforms.name, screenshots.image_id, first_release_date;
            where id = ${gameId};
        `;
        return this.request('games', query);
    }
}

module.exports = new IGDBService();