// Contrôleur des jeux
const { admin, db } = require("../Services/Firebase");
const IGDBService = require("../Services/Api_igdb");
const {
  isAgeAllowed,
  getMinAgeFromRating,
  calculateAge,
} = require("../utils/pegiHelper");

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

const getOffset = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(500, Math.max(1, parseInt(limit) || 15));
  return { limit: l, offset: (p - 1) * l };
};

const getAdultPreference = async (req) => {
  const userId = await getOptionalUserId(req);
  if (userId) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data().preferences?.showAdultGames || false;
    }
  }
  return false;
};

exports.getPopularGames = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { limit: lim, offset } = getOffset(page, limit);

    // Jeux du moment via IGDB PopScore
    const games = await IGDBService.getPopularGames(
      null,
      null,
      lim,
      offset,
      true,
    );
    res.json(games);
  } catch (error) {
    next(error);
  }
};

exports.searchGames = async (req, res, next) => {
  try {
    const { q, genre, platform, style, page, limit } = req.query;
    if (!q)
      return res
        .status(400)
        .json({ success: false, msg: "Paramètre q manquant" });
    const { limit: lim, offset } = getOffset(page, limit);

    let games = await IGDBService.searchGames(q, lim, offset, true, {
      genre,
      platform,
      style,
    });
    res.json(games);
  } catch (error) {
    next(error);
  }
};

exports.getGameDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const gameRef = db.collection("games").doc(id.toString());
    const gameDoc = await gameRef.get();

    let game;
    if (gameDoc.exists) {
      game = gameDoc.data();

      // Rafraîchit le cache si total_rating ou dlcs/expansions sont absents
      if (game.total_rating == null || (!game.dlcs && !game.expansions)) {
        try {
          const fresh = await IGDBService.getGameDetails(id);
          if (fresh && fresh.length > 0) {
            game = { ...game, ...fresh[0] };
            await gameRef.update(game);
          }
        } catch (_) {}
      }
    } else {
      const details = await IGDBService.getGameDetails(id);
      if (!details || details.length === 0)
        return res.status(404).json({ success: false, msg: "Jeu introuvable" });
      game = details[0];
      await gameRef.set({
        ...game,
        supcontent_cached_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const userId = await getOptionalUserId(req);

    // Calculer l'âge minimum requis pour ce jeu
    let requiredAge = 0;
    if (game.age_ratings && Array.isArray(game.age_ratings)) {
      for (const ratingObj of game.age_ratings) {
        const ratingVal =
          typeof ratingObj === "object" ? ratingObj.rating : ratingObj;
        const age = getMinAgeFromRating(ratingVal);
        if (age > requiredAge) requiredAge = age;
      }
    }

    // Détection des jeux érotiques/adultes via IGDB themes (ID 42 = Erotic)
    // Force un âge de 18 ans si le jeu a ce thème, même si le PEGI est absent.
    if (game.themes && Array.isArray(game.themes)) {
      const isAdultTheme = game.themes.some((t) => t === 42 || t.id === 42);
      if (isAdultTheme && requiredAge < 18) requiredAge = 18;
    }

    // Application stricte du blocage
    if (!userId) {
      if (requiredAge > 3) {
        return res.status(401).json({
          success: false,
          code: "LOGIN_REQUIRED",
          msg: `Vous devez être connecté pour voir ce contenu (+${requiredAge}).`,
        });
      }
    } else {
      const userDoc = await db.collection("users").doc(userId).get();
      const birthDate = userDoc.exists ? userDoc.data().birthDate : null;

      if (requiredAge > 3) {
        if (!birthDate) {
          return res.status(403).json({
            success: false,
            code: "BIRTHDATE_REQUIRED",
            msg: "Veuillez renseigner votre âge dans votre profil pour voir ce jeu.",
          });
        }
        const age = calculateAge(birthDate);
        if (age < requiredAge) {
          return res.status(403).json({
            success: false,
            code: "AGE_NOT_ALLOWED",
            msg: `Vous n'avez pas l'âge requis pour voir ce contenu (+${requiredAge}).`,
          });
        }
      }
    }

    res.json(game);
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingGames = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { limit: lim, offset } = getOffset(page, limit || 20);

    let games = await IGDBService.getUpcomingGames(lim, offset, true);
    res.json(games);
  } catch (error) {
    next(error);
  }
};

exports.getGamesFiltered = async (req, res, next) => {
  try {
    const { style, genre, platform, sortBy, order, page, limit } = req.query;
    const { limit: lim, offset } = getOffset(page, limit);

    let games = await IGDBService.getGamesFiltered(
      {
        style,
        genre,
        platform,
        sortBy,
        order,
        limit: lim,
        offset,
      },
      true,
    );
    res.json(games);
  } catch (error) {
    next(error);
  }
};

exports.getSimilarGames = async (req, res, next) => {
  try {
    const { id } = req.params;
    let igdbResponse = await IGDBService.getSimilarGames(id);
    let similarGames = [];
    if (
      igdbResponse &&
      igdbResponse.length > 0 &&
      igdbResponse[0].similar_games
    ) {
      // On limite à 10 jeux similaires maximum
      similarGames = igdbResponse[0].similar_games.slice(0, 10);
    } else {
      const gameDoc = await db.collection("games").doc(id.toString()).get();
      if (gameDoc.exists && gameDoc.data().genres?.length > 0) {
        const targetGenre = gameDoc.data().genres[0];
        const snapshot = await db.collection("games").limit(12).get();

        similarGames = snapshot.docs
          .map((doc) => doc.data())
          .filter((g) => g.id !== Number(id));
      }
    }

    res.json(similarGames);
  } catch (error) {
    next(error);
  }
};