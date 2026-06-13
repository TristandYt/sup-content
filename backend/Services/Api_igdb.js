// Service API IGDB
const axios = require("axios");
const { getIgdbToken } = require("./igdbAuth");
const { ADULT_THEME_ID } = require("./constants");

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
        console.warn("Token IGDB expiré ou révoqué. Nouvelle tentative avec refresh du token...");
        // Forcer le rafraîchissement du token une fois
        try {
          await getIgdbToken(true);
        } catch (e) {}
        return this.request(endpoint, query, true);
      }
      throw error;
    }
  }

  async searchGames(title, limit = 15, offset = 0, includeAdultThemes = false, options = {}) {
    let query = `fields name, cover.image_id; search "${title}"; limit ${limit}; offset ${offset};`;
    let whereClauses = ["cover != null"];

    if (!includeAdultThemes) {
      whereClauses.push(`themes != (${ADULT_THEME_ID})`);
    }

    if (options.genre) whereClauses.push(`genres = (${options.genre})`);
    if (options.platform) whereClauses.push(`platforms = (${options.platform})`);
    if (options.style) whereClauses.push(`themes = (${options.style})`);

    if (whereClauses.length > 0) {
      query += ` where ${whereClauses.join(" & ")};`;
    }
    return this.request("games", query);
  }

  async getPopularGames(
    sortBy = "total_rating",
    order = "desc",
    limit = 15,
    offset = 0,
    includeAdultThemes = false
  ) {
    const adultFilter = includeAdultThemes ? "" : ` & themes != (${ADULT_THEME_ID})`;

    // récupérer les IDs des jeux tendance en ce moment via IGDB PopScore
    const popQuery = `
      fields game_id, value, popularity_type;
      sort value desc;
      where popularity_type = 1;
      limit ${limit};
      offset ${offset};
    `;
    const popData = await this.request("popularity_primitives", popQuery);
    const gameIds = popData.map((p) => p.game_id).filter(Boolean);

    if (gameIds.length === 0) return [];

    // récupérer les détails des jeux correspondants
      const detailsQuery = `
      fields name, cover.image_id, total_rating, first_release_date, genres.name,
             age_ratings.category, age_ratings.rating, age_ratings.rating_cover_url, age_ratings.rating_category, age_ratings.rating_content_descriptions;
      where id = (${gameIds.join(",")}) & cover != null${adultFilter};
      limit ${limit};
    `;
    const games = await this.request("games", detailsQuery);

    // Réordonner selon le rang de popularité IGDB
    const rankMap = Object.fromEntries(gameIds.map((id, i) => [id, i]));
    return games.sort((a, b) => (rankMap[a.id] ?? 99) - (rankMap[b.id] ?? 99));
  }

  async advancedSearch(
    q,
    genre,
    year,
    includeAdultThemes = false,
    limit = 20,
    offset = 0,
  ) {
    let query = `fields name, cover.image_id, first_release_date, total_rating, genres.name,
         age_ratings.category, age_ratings.rating, age_ratings.rating_cover_url, age_ratings.rating_category; limit ${limit}; offset ${offset};`;
    let whereClauses = [];
    if (q) whereClauses.push(`name ~ * "${q}" *`);
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
      whereClauses.push(`themes != (${ADULT_THEME_ID})`);
    }

    if (whereClauses.length > 0) query += ` where ${whereClauses.join(" & ")};`;

    return this.request("games", query);
  }

  async getUpcomingGames(limit = 20, offset = 0, includeAdultThemes = false) {
    const now = Math.floor(Date.now() / 1000);
    const adultFilter = includeAdultThemes ? "" : ` & themes != (${ADULT_THEME_ID})`;
    const query = `
      fields name, cover.image_id, first_release_date, total_rating,
             age_ratings.category, age_ratings.rating, age_ratings.rating_cover_url, age_ratings.rating_category;
      where first_release_date > ${now} & cover != null${adultFilter};
      sort first_release_date asc;
      limit ${limit};
      offset ${offset};
    `;
    return this.request("games", query);
  }

  async getGamesFiltered(
    { style, genre, platform, sortBy, order, limit = 15, offset = 0 },
    includeAdultThemes = false
  ) {
    // Résolution du champ de tri
    let field = "total_rating";
    if (sortBy === "name") field = "name";
    if (sortBy === "first_release_date") field = "first_release_date";

    // Résolution de la direction
    let direction = "desc";
    if (order === "asc") direction = "asc";

    // Si on trie par note, on exige total_rating != null
    const ratingFilter =
      field === "total_rating" ? "total_rating != null & " : "";

    let query = `fields name, cover.image_id, first_release_date, total_rating, genres.name,
             age_ratings.category, age_ratings.rating, age_ratings.rating_cover_url, age_ratings.rating_category; sort ${field} ${direction}; limit ${limit}; offset ${offset};`;

    let whereClauses = [];
    if (ratingFilter) whereClauses.push("total_rating != null");
    if (genre) whereClauses.push(`genres = (${genre})`);
    if (platform) whereClauses.push(`platforms = (${platform})`);
    if (style) whereClauses.push(`themes = (${style})`);

    if (!includeAdultThemes) {
      whereClauses.push(`themes != (${ADULT_THEME_ID})`);
    }

    if (whereClauses.length > 0) query += ` where ${whereClauses.join(" & ")};`;
    return this.request("games", query);
  }

  // Détails d'un jeu avec DLC et expansions
  async getGameDetails(gameId) {
    const query = `
      fields name, cover.image_id, summary, total_rating, total_rating_count,
             genres.name, platforms.name, themes,
             screenshots.image_id, first_release_date,
             age_ratings.category, age_ratings.rating, age_ratings.rating_cover_url, age_ratings.rating_category, age_ratings.rating_content_descriptions,
             dlcs.name, dlcs.cover.image_id, dlcs.first_release_date, dlcs.summary,
             expansions.name, expansions.cover.image_id, expansions.first_release_date, expansions.summary;
      where id = ${gameId};
    `;
    return this.request("games", query);
  }

  // DLC et expansions d'un jeu
  async getGameDlcsAndExpansions(gameId) {
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
      fields similar_games.name, similar_games.cover.image_id, similar_games.total_rating, similar_games.first_release_date,
             similar_games.age_ratings.category, similar_games.age_ratings.rating, similar_games.age_ratings.rating_cover_url, similar_games.age_ratings.rating_category;
      where id = ${gameId};
    `;
    return this.request("games", query);
  }
}

module.exports = new IGDBService();