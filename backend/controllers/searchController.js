// Recherche globale et recommandations
const { admin, db } = require("../Services/Firebase");
const IGDBService = require("../Services/Api_igdb");

const getOptionalUserId = async (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken.uid;
    } catch (err) {
      return null;
    }
  }
  return null;
};

exports.searchAll = async (req, res, next) => {
  try {
    let { q = "", type = "all", genre, year } = req.query;

    // Protection contre les requêtes trop longues (surcharge mémoire)
    q = q.substring(0, 100);

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
        // Affiche toujours les jeux pour adultes dans les résultats de recherche
        games = await IGDBService.advancedSearch(q, genre, year, true);
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
      recommendations = await IGDBService.getPopularGames("total_rating", "desc", 15, 0, true);
    }

    res.json({ success: true, recommendations });
  } catch (error) {
    next(error);
  }
};
