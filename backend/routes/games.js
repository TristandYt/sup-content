const express = require("express");
const axios = require("axios");
const { admin, db } = require("../Services/Firebase");
const { getIgdbToken } = require("../Services/igdbAuth");

const router = express.Router();
const IGDB_BASE_URL = "https://api.igdb.com/v4";

const getIgdbHeaders = async () => {
  const token = await getIgdbToken();
  return {
    "Client-ID": process.env.IGDB_CLIENT_ID,
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "text/plain",
  };
};

/*
 * Construit un filtre where IGDB combinant genre et plateforme.
 */
const buildWhereClause = (base = "", genre = "", platform = "") => {
  const conditions = [];
  if (base) conditions.push(base);
  if (genre) conditions.push(`genres = (${genre})`);
  if (platform) conditions.push(`platforms = (${platform})`);
  return conditions.length ? `where ${conditions.join(" & ")};` : "";
};

/*
 * Récupère un jeu depuis le cache Firestore ou depuis IGDB.
 */
const fetchGameById = async (gameId) => {
  const gameRef = db.collection("games").doc(gameId.toString());
  const cached = await gameRef.get();

  if (cached.exists) return cached.data();

  const headers = await getIgdbHeaders();
  const body = `
    where id = ${gameId};
    fields name, summary, cover.image_id, genres.name, platforms.name,
           first_release_date, total_rating, total_rating_count,
           involved_companies.company.name;
  `;

  const response = await axios.post(`${IGDB_BASE_URL}/games`, body, {
    headers,
  });

  if (!response.data || response.data.length === 0) {
    const error = new Error("Jeu non trouvé sur IGDB");
    error.status = 404;
    throw error;
  }

  const gameData = response.data[0];
  await gameRef.set({
    ...gameData,
    supcontent_cached_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return gameData;
};

/*
 * GET /api/games/popular?sortBy=total_rating&order=desc&genre=12&platform=48
 * Jeux populaires avec filtres genre/plateforme optionnels.
 */
router.get("/popular", async (req, res, next) => {
  try {
    const {
      sortBy = "total_rating",
      order = "desc",
      genre = "",
      platform = "",
    } = req.query;

    const safeSort = ["total_rating", "first_release_date", "name"].includes(
      sortBy,
    )
      ? sortBy
      : "total_rating";
    const safeOrder = order === "asc" ? "asc" : "desc";

    const whereClause = buildWhereClause(
      "total_rating_count > 10",
      genre,
      platform,
    );

    const headers = await getIgdbHeaders();
    const body = `
      fields name, cover.image_id, genres.name, first_release_date, total_rating, total_rating_count;
      ${whereClause}
      sort ${safeSort} ${safeOrder};
      limit 20;
    `;

    const response = await axios.post(`${IGDB_BASE_URL}/games`, body, {
      headers,
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

/*
 * GET /api/games/search?q=zelda&genre=12&platform=48
 * Recherche par titre avec filtres genre/plateforme optionnels.
 * q est obligatoire.
 */
router.get("/search", async (req, res, next) => {
  const { q, genre = "", platform = "" } = req.query;

  if (!q || !q.trim()) {
    return res
      .status(400)
      .json({ success: false, msg: "Paramètre q manquant" });
  }

  try {
    const headers = await getIgdbHeaders();

    // IGDB : search + where ne sont pas combinables directement,
    // on filtre genre/platform via where après la recherche textuelle.
    const whereClause = buildWhereClause("", genre, platform);

    const body = `
      search "${q.trim()}";
      fields name, cover.image_id, genres.name, first_release_date, total_rating;
      ${whereClause}
      limit 20;
    `;

    const response = await axios.post(`${IGDB_BASE_URL}/games`, body, {
      headers,
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

/*
 * GET /api/games/details/:id
 */
router.get("/details/:id", async (req, res, next) => {
  try {
    const gameData = await fetchGameById(req.params.id);
    res.json(gameData);
  } catch (error) {
    if (error.status === 404)
      return res.status(404).json({ success: false, msg: error.message });
    next(error);
  }
});

/*
 * GET /api/games/:id — alias de /details/:id
 */
router.get("/:id", async (req, res, next) => {
  try {
    const gameData = await fetchGameById(req.params.id);
    res.json(gameData);
  } catch (error) {
    if (error.status === 404)
      return res.status(404).json({ success: false, msg: error.message });
    next(error);
  }
});

module.exports = router;
