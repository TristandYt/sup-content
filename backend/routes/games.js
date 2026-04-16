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

const fetchGameById = async (gameId) => {
  const gameRef = db.collection("games").doc(gameId);
  const doc = await gameRef.get();

  if (doc.exists) {
    return doc.data();
  }

  const headers = await getIgdbHeaders();
  const body = `
      fields name, summary, cover.image_id, genres.name, platforms.name, first_release_date, total_rating, total_rating_count, involved_companies.company.name;
      where id = ${gameId};
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

router.get("/popular", async (req, res) => {
  try {
    const { sortBy = "total_rating", order = "desc" } = req.query;
    const headers = await getIgdbHeaders();

    const body = `
      fields name, cover.image_id, first_release_date, total_rating, total_rating_count;
      where total_rating_count > 5 & cover != null;
      sort ${sortBy} ${order};
      limit 20;
    `;

    const response = await axios.post(`${IGDB_BASE_URL}/games`, body, {
      headers,
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ msg: "Erreur jeux populaires" });
  }
});

router.get("/search", async (req, res) => {
  const {
    q,
    genre,
    platform,
    sortBy = "total_rating",
    order = "desc",
  } = req.query;

  try {
    const headers = await getIgdbHeaders();
    let conditions = [];

    if (genre) conditions.push(`genres = ${genre}`);
    if (platform) conditions.push(`platforms = ${platform}`);
    conditions.push("cover != null");

    const whereClause = `where ${conditions.join(" & ")}`;

    let body = "";
    if (q && q.trim() !== "") {
      body = `search "${q}"; fields name, cover.image_id, first_release_date, total_rating; ${whereClause}; limit 20;`;
    } else {
      body = `fields name, cover.image_id, first_release_date, total_rating; ${whereClause}; sort ${sortBy} ${order}; limit 20;`;
    }

    const response = await axios.post(`${IGDB_BASE_URL}/games`, body, {
      headers,
    });
    res.json(response.data);
  } catch (err) {
    console.error(
      "Détail Erreur IGDB:",
      err.response ? err.response.data : err.message,
    );
    res.status(400).json({ msg: "Syntaxe incorrecte ou erreur IGDB" });
  }
});

router.get("/details/:id", async (req, res) => {
  const gameId = req.params.id;
  try {
    const gameData = await fetchGameById(gameId);
    res.json(gameData);
  } catch (err) {
    res.status(500).json({ msg: "Erreur détails" });
  }
});

router.get("/:id", async (req, res) => {
  const gameId = req.params.id;
  try {
    const gameData = await fetchGameById(gameId);
    res.json(gameData);
  } catch (err) {
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

module.exports = router;
