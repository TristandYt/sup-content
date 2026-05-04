/*
 * Contrôleur bibliothèque.
 * Gère la sous-collection library de l'utilisateur.
 *
 * Modèle Firestore : users/{userId}/library/{gameId}
 *   { gameId, status, updatedAt }
 *
 * Statuts valides : to_play | playing | finished | dropped
 */
const { admin, db } = require("../Services/Firebase");
const Logger = require("../Services/Logger");

const VALID_STATUSES = ["to_play", "playing", "finished", "dropped"];

/*
 * POST /api/lists/status
 * PUT  /api/lists/status
 * Body : { gameId, status }
 * Ajoute ou met à jour le statut d'un jeu dans la bibliothèque (upsert).
 */
exports.updateGameStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { gameId, status, gameName, gameCover } = req.body;

    if (!gameId)
      return res.status(400).json({ success: false, msg: "gameId manquant" });
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(", ")}`,
      });
    }

    const gameRef = db
      .collection("users")
      .doc(userId)
      .collection("library")
      .doc(gameId.toString());

    await gameRef.set(
      {
        gameId: gameId.toString(),
        status,
        gameName: gameName || null,
        gameCover: gameCover || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // Logger la mise à jour du statut dans la bibliothèque
    await Logger.log("library_status_updated", userId, { gameId, status });

    res.json({ success: true, msg: `Statut mis à jour : ${status}` });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/lists/library
 * Retourne tous les jeux de la bibliothèque de l'utilisateur.
 * Supporte le filtre optionnel ?status=playing
 */
exports.getMyLibrary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = db.collection("users").doc(userId).collection("library");

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          msg: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(", ")}`,
        });
      }
      query = query.where("status", "==", status);
    }

    query = query.orderBy("updatedAt", "desc");

    const snapshot = await query.get();
    const library = snapshot.docs.map((doc) => doc.data());

    res.json({ success: true, total: library.length, library });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/lists/library/:gameId
 * Retourne le statut d'un jeu précis dans la bibliothèque.
 */
exports.getGameFromLibrary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const gameId = req.params.gameId.toString();

    const gameDoc = await db
      .collection("users")
      .doc(userId)
      .collection("library")
      .doc(gameId)
      .get();

    if (!gameDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Jeu introuvable dans la bibliothèque" });
    }

    res.json({ success: true, game: gameDoc.data() });
  } catch (error) {
    next(error);
  }
};

/*
 * DELETE /api/lists/library/:gameId
 * Supprime un jeu de la bibliothèque de l'utilisateur.
 */
exports.removeFromLibrary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const gameId = req.params.gameId.toString();

    const gameRef = db
      .collection("users")
      .doc(userId)
      .collection("library")
      .doc(gameId);

    const gameDoc = await gameRef.get();
    if (!gameDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Jeu introuvable dans la bibliothèque" });
    }

    await gameRef.delete();

    // Logger la suppression de la bibliothèque
    await Logger.log("library_game_removed", userId, { gameId });

    res.json({ success: true, msg: "Jeu retiré de la bibliothèque" });
  } catch (error) {
    next(error);
  }
};
