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

// 2. Rechercher des jeux (MODIFIÉ POUR RECHERCHE AVANCÉE)
router.get("/search", async (req, res) => {
  try {
    // On récupère q, mais aussi genre et platform depuis les query params
    const { q, genre, platform } = req.query;

    // On accepte la requête si on a au moins un des critères
    if (!q && !genre && !platform) {
      return res
        .status(400)
        .json({ error: "Veuillez entrer un terme ou choisir un filtre" });
    }

    // On envoie tout à la fonction searchGames de ton service
    // On passe un objet contenant les filtres en deuxième argument
    const games = await igdb.searchGames(q, { genre, platform });

    res.json(games);
  } catch (error) {
    console.error("Erreur dans la route search:", error);
    res.status(500).json({ error: "Erreur IGDB Recherche" });
  }
});

// 3. Récupérer les détails d'un jeu par son ID
router.get("/details/:id", async (req, res) => {
  try {
    const gameId = req.params.id;
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
    console.log(`Ajout du jeu ${name} pour l'user ${userId}`);
    res.status(201).json({ message: "Favori ajouté" });
  } catch (error) {
    res.status(500).json({ error: "Erreur BDD Favoris" });
  }
});

// 5. Récupérer les favoris d'un utilisateur
router.get("/favorites/:userId", async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: "Erreur récupération favoris" });
  }
});

// 6. Récupérer les commentaires d'un jeu
router.get("/comments/:gameId", async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(404).json({ error: "Aucun commentaire" });
  }
});

module.exports = router;
