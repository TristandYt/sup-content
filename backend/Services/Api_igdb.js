// Service API IGDB
const axios = require('axios');
const { getIgdbToken } = require('./igdbAuth');

class IGDBService {
    constructor() {
        this.clientId = process.env.IGDB_CLIENT_ID;
        this.baseUrl = 'https://api.igdb.com/v4';
    }

    // Requête générique POST
    async request(endpoint, query, isRetry = false) {
        try {
            const token = await getIgdbToken();
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
            if (error.response && error.response.status === 401 && !isRetry) {
                console.warn(`Token IGDB expiré ou révoqué. Nouvelle tentative en cours...`);
                return this.request(endpoint, query, true);
            }
            console.error(`Erreur IGDB (${endpoint}):`, error.message);
            throw error;
        }
    }

    // Recherche par titre
    async searchGames(title) {
        const query = `
            fields name, cover.image_id, total_rating, summary, first_release_date, age_ratings.category, age_ratings.rating;
            search "${title}";
            limit 40;
        `;
        return this.request('games', query);
    }

    // Jeux populaires
    async getPopularGames(sortBy = 'total_rating', order = 'desc') {
        const field = ['name', 'total_rating', 'first_release_date'].includes(sortBy) ? sortBy : 'total_rating';
        const direction = order === 'asc' ? 'asc' : 'desc';

        const query = `
            fields name, cover.image_id, total_rating, first_release_date, age_ratings.category, age_ratings.rating;
            sort ${field} ${direction};
            where total_rating != null & cover != null;
            limit 40;
        `;
        return this.request('games', query);
    }

    // Recherche avancée (filtres)
    async advancedSearch(q, genre, year) {
        let query = `fields name, cover.image_id, first_release_date, total_rating, genres.name, age_ratings.category, age_ratings.rating; limit 20;`;
        let whereClauses = [];

        if (q) query += ` search "${q}";`;
        else if (genre || year) query += ` sort total_rating desc;`;

        if (genre) whereClauses.push(`genres = (${genre})`);
        if (year) {
            const startOfYear = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
            const endOfYear = Math.floor(new Date(`${year}-12-31`).getTime() / 1000);
            whereClauses.push(`first_release_date >= ${startOfYear} & first_release_date <= ${endOfYear}`);
        }
        if (!q && whereClauses.length === 0) {
            whereClauses.push('total_rating_count > 10');
        }

        if (whereClauses.length > 0) {
            query += ` where ${whereClauses.join(' & ')};`;
        }
        return this.request('games', query);
    }

    // Jeux qui vont sortir
    async getUpcomingGames() {
        const now = Math.floor(Date.now() / 1000);
        const query = `
            fields name, cover.image_id, first_release_date, total_rating, age_ratings.category, age_ratings.rating;
            where first_release_date > ${now};
            sort first_release_date asc;
            limit 20;
        `;
        return this.request('games', query);
    }

    // Filtrer par genre, plateforme, et style(theme)
    async getGamesFiltered({ style, genre, platform }) {
        let query = `fields name, cover.image_id, first_release_date, total_rating, age_ratings.category, age_ratings.rating; limit 40;`;
        let whereClauses = [];

        if (genre) whereClauses.push(`genres = (${genre})`);
        if (platform) whereClauses.push(`platforms = (${platform})`);
        if (style) whereClauses.push(`themes = (${style})`);

        if (whereClauses.length > 0) {
            query += ` where ${whereClauses.join(' & ')};`;
        }
        return this.request('games', query);
    }

    // Détails d'un jeu
    async getGameDetails(gameId) {
        const query = `
            fields name, cover.image_id, summary, genres.name, platforms.name, screenshots.image_id, first_release_date, age_ratings.category, age_ratings.rating;
            where id = ${gameId};
        `;
        return this.request('games', query);
    }

    // Jeux similaires
    async getSimilarGames(gameId) {
        const query = `
            fields similar_games.name, similar_games.cover.image_id, similar_games.total_rating, similar_games.first_release_date, similar_games.age_ratings.category, similar_games.age_ratings.rating;
            where id = ${gameId};
        `;
        return this.request('games', query);
    }
}

module.exports = new IGDBService();