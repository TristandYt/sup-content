// Gestion de la bibliothèque et des listes de jeux
const { admin, db } = require("../Services/Firebase");
const Logger = require("../Services/Logger");

const VALID_STATUSES = ["to_play", "playing", "finished", "dropped"];

// Ajouter ou mettre à jour le statut d'un jeu
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
        gameName: gameName || "",
        gameCover: gameCover || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await Logger.log("library_status_updated", userId, { gameId, status });

    res.json({ success: true, msg: `Statut mis à jour : ${status}` });
  } catch (error) {
    next(error);
  }
};

// Récupérer la bibliothèque complète
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

// Récupérer le statut d'un jeu spécifique
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

// Supprimer un jeu de la bibliothèque
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

    await Logger.log("library_game_removed", userId, { gameId });

    res.json({ success: true, msg: "Jeu retiré de la bibliothèque" });
  } catch (error) {
    next(error);
  }
};

// Statistiques de la bibliothèque (Tableau de bord)
exports.getMyLibraryStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("library")
      .get();

    const stats = {
      to_play: 0,
      playing: 0,
      finished: 0,
      dropped: 0,
      total: 0,
    };

    snapshot.docs.forEach((doc) => {
      const status = doc.data().status;
      if (stats[status] !== undefined) stats[status]++;
      stats.total++;
    });

    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// Listes personnalisées
exports.createList = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, description = "", isPrivate = false } = req.body;

    if (!name)
      return res
        .status(400)
        .json({ success: false, msg: "Le nom de la liste est requis" });

    const docRef = await db.collection("custom_lists").add({
      userId,
      name,
      description,
      isPrivate,
      games: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res
      .status(201)
      .json({ success: true, listId: docRef.id, msg: "Liste créée" });
  } catch (error) {
    next(error);
  }
};

exports.getMyLists = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const snap = await db
      .collection("custom_lists")
      .where("userId", "==", userId)
      .get();
    res.json({
      success: true,
      lists: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    next(error);
  }
};

exports.getListDetails = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const userId = req.user?.id;

    const doc = await db.collection("custom_lists").doc(listId).get();
    if (!doc.exists)
      return res.status(404).json({ success: false, msg: "Liste introuvable" });

    const listData = doc.data();
    if (listData.isPrivate && listData.userId !== userId)
      return res
        .status(403)
        .json({ success: false, msg: "Cette liste est privée" });

    res.json({ success: true, list: { id: doc.id, ...listData } });
  } catch (error) {
    next(error);
  }
};

exports.addGameToList = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;
    const { gameId, gameName, gameCover } = req.body;

    const listRef = db.collection("custom_lists").doc(listId);
    const doc = await listRef.get();
    if (!doc.exists)
      return res.status(404).json({ success: false, msg: "Liste introuvable" });
    if (doc.data().userId !== userId)
      return res.status(403).json({ success: false, msg: "Accès refusé" });

    await listRef.update({
      games: admin.firestore.FieldValue.arrayUnion({
        gameId: gameId.toString(),
        gameName: gameName || "",
        gameCover: gameCover || "",
        addedAt: new Date(),
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true, msg: "Jeu ajouté à la liste" });
  } catch (error) {
    next(error);
  }
};
