// Service API IGDB
const axios = require("axios");
const { getIgdbToken } = require("./igdbAuth");

class IGDBService {
  constructor() {
    this.clientId = process.env.IGDB_CLIENT_ID;
    this.baseUrl = "https://api.igdb.com/v4";
  }

  async request(endpoint, query, isRetry = false) {
    try {
      const token = await getIgdbToken();
      const response = await axios({
        url: `${this.baseUrl}/${endpoint}`,
        method: "POST",
        headers: {
          "Client-ID": this.clientId,
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        data: query,
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401 && !isRetry) {
        console.warn("Token IGDB expiré ou révoqué. Nouvelle tentative...");
        return this.request(endpoint, query, true);
      }
      console.error(`Erreur IGDB (${endpoint}):`, error.message);
      throw error;
    }
  }

  async searchGames(title, limit = 15, offset = 0, includeAdultThemes = false) {
    const adultFilter = includeAdultThemes ? "" : "where themes != (42);";
    const query = `
      fields name, cover.image_id, total_rating, summary, first_release_date, genres.name, age_ratings.category, age_ratings.rating;
      search "${title}";
      ${adultFilter}
      limit ${limit};
      offset ${offset};
    `;
    return this.request("games", query);
  }

  async getPopularGames(
    sortBy = "total_rating",
    order = "desc",
    limit = 15,
    offset = 0,
    includeAdultThemes = false
  ) {
    // Gestion des alias potentiels envoyés par le front
    let field = "total_rating";
    if (sortBy === "name" || sortBy === "nom") field = "name";
    if (sortBy === "first_release_date" || sortBy === "date" || sortBy === "release_date") field = "first_release_date";
    
    // Gestion des alias pour l'ordre
    let direction = "desc";
    if (order === "asc" || order === "ascendant" || order === "croissant") direction = "asc";

    const adultFilter = includeAdultThemes ? "" : " & themes != (42)";
    const query = `
      fields name, cover.image_id, total_rating, first_release_date, genres.name, age_ratings.category, age_ratings.rating;
      sort ${field} ${direction};
      where total_rating != null & cover != null${adultFilter};
      limit ${limit};
      offset ${offset};
    `;
    return this.request("games", query);
  }

  async advancedSearch(q, genre, year, includeAdultThemes = false, limit = 20, offset = 0) {
    let query = `fields name, cover.image_id, first_release_date, total_rating, genres.name, age_ratings.category, age_ratings.rating; limit ${limit}; offset ${offset};`;
    let whereClauses = [];

    if (q) query += ` search "${q}";`;
    else if (genre || year) query += ` sort total_rating desc;`;

    if (genre) whereClauses.push(`genres = (${genre})`);
    if (year) {
      const startOfYear = Math.floor(
        new Date(`${year}-01-01`).getTime() / 1000,
      );
      const endOfYear = Math.floor(new Date(`${year}-12-31`).getTime() / 1000);
      whereClauses.push(
        `first_release_date >= ${startOfYear} & first_release_date <= ${endOfYear}`,
      );
    }
    if (!q && whereClauses.length === 0)
      whereClauses.push("total_rating_count > 10");

    if (!includeAdultThemes) {
      whereClauses.push("themes != (42)"); // Bloque les jeux érotiques / nudité
    }

    if (whereClauses.length > 0) query += ` where ${whereClauses.join(" & ")};`;

    return this.request("games", query);
  }

  async getUpcomingGames(limit = 20, offset = 0, includeAdultThemes = false) {
    const now = Math.floor(Date.now() / 1000);
    const adultFilter = includeAdultThemes ? "" : " & themes != (42)";
    const query = `
      fields name, cover.image_id, first_release_date, total_rating, age_ratings.category, age_ratings.rating;
      where first_release_date > ${now} & cover != null${adultFilter};
      sort first_release_date asc;
      limit ${limit};
      offset ${offset};
    `;
    return this.request("games", query);
  }

  async getGamesFiltered({ style, genre, platform, limit = 15, offset = 0 }, includeAdultThemes = false) {
    let query = `fields name, cover.image_id, first_release_date, total_rating, genres.name, age_ratings.category, age_ratings.rating; limit ${limit}; offset ${offset};`;
    let whereClauses = [];
    if (genre) whereClauses.push(`genres = (${genre})`);
    if (platform) whereClauses.push(`platforms = (${platform})`);
    if (style) whereClauses.push(`themes = (${style})`);

    if (!includeAdultThemes) {
      whereClauses.push("themes != (42)"); // Bloque les jeux érotiques / nudité
    }

    if (whereClauses.length > 0) query += ` where ${whereClauses.join(" & ")};`;
    return this.request("games", query);
  }

  // Détails d'un jeu avec DLC et expansions 
  async getGameDetails(gameId) {
    const query = `
      fields name, cover.image_id, summary, genres.name, platforms.name,
             screenshots.image_id, first_release_date,
             age_ratings.category, age_ratings.rating,
             dlcs.name, dlcs.cover.image_id, dlcs.first_release_date,
             expansions.name, expansions.cover.image_id, expansions.first_release_date;
      where id = ${gameId};
    `;
    return this.request("games", query);
  }

  // DLC et expansions d'un jeu
  async getGameDlcsAndExpansions(gameId) {
    // Récupère les DLC (category=1) et expansions (category=2) liés au jeu parent
    const query = `
      fields name, cover.image_id, first_release_date, category, summary;
      where parent_game = ${gameId} & category = (1,2);
      sort first_release_date asc;
      limit 20;
    `;
    return this.request("games", query);
  }

  async getSimilarGames(gameId) {
    const query = `
      fields similar_games.name, similar_games.cover.image_id, similar_games.total_rating, similar_games.first_release_date, similar_games.age_ratings.category, similar_games.age_ratings.rating;
      where id = ${gameId};
    `;
    return this.request("games", query);
  }
}

module.exports = new IGDBService();
