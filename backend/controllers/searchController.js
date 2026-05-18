// Recherche globale et recommandations
const { db } = require("../Services/Firebase");
const IGDBService = require("../Services/Api_igdb");
const { filterGamesByAge } = require("../utils/pegiHelper");

exports.searchAll = async (req, res, next) => {
  try {
    const { q = "", type = "all", genre, year } = req.query;

    let users = [];
    let games = [];
    let lists = [];

    // Recherche utilisateurs
    if (type === "all" || type === "users") {
      if (q.length >= 3) {
        const usersSnap = await db
          .collection("users")
          .where("username", ">=", q)
          .where("username", "<=", q + "\uf8ff")
          .limit(10)
          .get();

        users = usersSnap.docs.map((doc) => ({
          id: doc.id,
          username: doc.data().username,
          avatarUrl: doc.data().profileData?.avatarUrl || null,
        }));

        users = usersSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            username: data.username || data.pseudo || "Joueur",
            avatar: data.avatar || data.profileData?.avatarUrl || null,
            bio: data.bio || "Joueur passionné",
          };
        });
      }
    }

    // Recherche listes publiques
    if (type === "all" || type === "lists") {
      if (q.length >= 3) {
        const listsSnap = await db
          .collection("custom_lists")
          .where("isPrivate", "==", false)
          .where("name", ">=", q)
          .where("name", "<=", q + "\uf8ff")
          .limit(10)
          .get();

        lists = listsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
    }

    // Recherche jeux IGDB
    if (type === "all" || type === "games") {
      try {
        games = await IGDBService.advancedSearch(q, genre, year);
      } catch (igdbError) {
        console.error("Erreur IGDB recherche avancée", igdbError.message);
      }
    }

    res.json({ success: true, results: { users, lists, games } });
  } catch (error) {
    next(error);
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userDoc = await db.collection("users").doc(userId).get();
    const favorites = userDoc.data().favorites || [];
    const birthDate = userDoc.data().birthDate;
    let recommendations = [];

    // Recommandations via favoris
    if (favorites.length > 0) {
      const gameId = favorites[0].gameId;
      try {
        const result = await IGDBService.getSimilarGames(gameId);
        if (result.length > 0 && result[0].similar_games) {
          recommendations = result[0].similar_games;
        }
      } catch (igdbError) {
        console.error("Erreur IGDB recommandation:", igdbError.message);
      }
    }

    // Fallback : jeux populaires
    if (recommendations.length === 0) {
      recommendations = await IGDBService.getPopularGames();
    }

    recommendations = filterGamesByAge(recommendations, birthDate);

    res.json({ success: true, recommendations });
  } catch (error) {
    next(error);
  }
};
