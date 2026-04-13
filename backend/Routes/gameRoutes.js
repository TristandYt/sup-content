const express = require("express");
const router = express.Router();
const igdb = require("../Services/Api_igdb");

// 1. Récupérer les jeux populaires
router.get("/popular", async (req, res) => {
  try {
    const { sortBy, order } = req.query;
    const games = await igdb.getPopularGames(sortBy, order);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: "Erreur IGDB Populaires" });
  }
});

// 2. Rechercher des jeux
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Requête vide" });
    const games = await igdb.searchGames(q);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: "Erreur IGDB Recherche" });
  }
});

// --- LA ROUTE MANQUANTE EST ICI ---
// 3. Récupérer les détails d'un jeu par son ID
router.get("/details/:id", async (req, res) => {
  try {
    const gameId = req.params.id;
    // On appelle la méthode getGameDetails de ton service Api_igdb.js
    const gameDetails = await igdb.getGameDetails(gameId);
    res.json(gameDetails);
  } catch (error) {
    console.error("Erreur détails jeu:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des détails du jeu" });
  }
});

// 4. Ajouter un favori
router.post("/favorites", async (req, res) => {
  const { userId, id, name, image_url } = req.body;
  try {
    // Remplace par ton vrai code SQL (ex: db.query("INSERT INTO favorites..."))
    console.log(`Ajout du jeu ${name} pour l'user ${userId}`);
    res.status(201).json({ message: "Favori ajouté" });
  } catch (error) {
    res.status(500).json({ error: "Erreur BDD Favoris" });
  }
});

// 5. Récupérer les favoris d'un utilisateur
router.get("/favorites/:userId", async (req, res) => {
  try {
    // Remplace par ton SELECT * FROM favorites WHERE user_id = ...
    res.json([]); // Renvoie vide pour l'instant
  } catch (error) {
    res.status(500).json({ error: "Erreur récupération favoris" });
  }
});

// 6. Récupérer les commentaires d'un jeu
router.get("/comments/:gameId", async (req, res) => {
  try {
    // Remplace par ton SELECT sur la table comments
    res.json([]);
  } catch (error) {
    res.status(404).json({ error: "Aucun commentaire" });
  }
});

module.exports = router;
