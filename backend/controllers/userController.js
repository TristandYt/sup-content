/*
 * Contrôleur utilisateur.
 *
 * Modèle Firestore : users/{userId}
 *   { username, email, bio, favorites[], createdAt, updatedAt }
 */
const { admin, db, auth } = require("../Services/Firebase");
const Logger = require("../Services/Logger");
const IGDBService = require("../Services/Api_igdb");

/*
 * GET /api/users/profile  (privé)
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Profil introuvable" });
    }

    res.json({ success: true, user: userDoc.data() });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/users/:userId/profile  (public)
 * Retourne uniquement les champs non sensibles : username, bio, createdAt.
 */
exports.getPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Utilisateur introuvable" });
    }

    const {
      username,
      bio,
      createdAt,
      avatar,
      followersCount,
      followingCount,
      profileData,
    } = userDoc.data();
    res.json({
      success: true,
      user: {
        userId,
        username,
        bio,
        website: profileData?.website || "",
        createdAt,
        avatar,
        followersCount,
        followingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
 * PUT /api/users/profile
 * Body : { username?, bio?, avatarUrl?, preferences?, website? }
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, bio, avatarUrl, preferences, website, birthDate } = req.body;

    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (preferences !== undefined) updates.preferences = preferences;
    if (avatarUrl !== undefined) updates["profileData.avatarUrl"] = avatarUrl;
    if (website !== undefined) updates["profileData.website"] = website;
    if (birthDate !== undefined) updates.birthDate = birthDate;

    await db.collection("users").doc(userId).update(updates);

    // Logger la mise à jour du profil
    const logUpdates = {};
    if (username !== undefined) logUpdates.username = username;
    if (bio !== undefined) logUpdates.bio = bio;
    if (avatarUrl !== undefined) logUpdates.avatarUrl = avatarUrl;
    if (website !== undefined) logUpdates.website = website;
    if (birthDate !== undefined) logUpdates.birthDate = birthDate;

    if (Object.keys(logUpdates).length > 0) {
      await Logger.log("profile_updated", userId, { updates: logUpdates });
    }

    res.json({ success: true, msg: "Profil mis à jour" });
  } catch (error) {
    next(error);
  }
};

/*
 * PUT /api/users/password
 * Body : { newPassword }
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, msg: "Nouveau mot de passe requis" });
    }

    await auth.updateUser(userId, { password: newPassword });

    // Logger la mise à jour du mot de passe
    await Logger.log("password_updated", userId, {});

    res.json({ success: true, msg: "Mot de passe mis à jour" });
  } catch (error) {
    next(error);
  }
};

/*
 * POST /api/users/reset-password-public
 * Body : { email, newPassword }
 * Permet de forcer la réinitialisation sans email de vérification (pour tests).
 */
exports.resetPasswordByEmail = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ success: false, msg: "Email et nouveau mot de passe requis" });
    }

    // On récupère l'UID via l'email
    const userRecord = await auth.getUserByEmail(email);

    // On met à jour le mot de passe dans Firebase Auth
    await auth.updateUser(userRecord.uid, { password: newPassword });

    res.json({ success: true, msg: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return res
        .status(404)
        .json({ success: false, msg: "Aucun compte trouvé pour cet email" });
    }
    next(error);
  }
};

/*
 * PUT /api/users/email
 * Body : { newEmail }
 */
exports.updateEmail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;

    if (!newEmail) {
      return res
        .status(400)
        .json({ success: false, msg: "Nouvel email requis" });
    }

    await auth.updateUser(userId, { email: newEmail });
    await db.collection("users").doc(userId).update({
      email: newEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Logger la mise à jour de l'email
    await Logger.log("email_updated", userId, { newEmail });

    res.json({ success: true, msg: "Email mis à jour" });
  } catch (error) {
    next(error);
  }
};

/*
 * DELETE /api/users/account
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Nettoyage
    const bulkWriter = db.bulkWriter();

    const librarySnap = await db.collection("users").doc(userId).collection("library").get();
    librarySnap.forEach(doc => bulkWriter.delete(doc.ref));

    const reviewsSnap = await db.collection("reviews").where("userId", "==", userId).get();
    reviewsSnap.forEach(doc => bulkWriter.delete(doc.ref));

    const customListsSnap = await db.collection("custom_lists").where("userId", "==", userId).get();
    customListsSnap.forEach(doc => bulkWriter.delete(doc.ref));

    const followerSnap = await db.collection("follows").where("followerId", "==", userId).get();
    followerSnap.forEach(doc => bulkWriter.delete(doc.ref));

    const followingSnap = await db.collection("follows").where("followingId", "==", userId).get();
    followingSnap.forEach(doc => bulkWriter.delete(doc.ref));

    const notifSnap = await db.collection("notifications").where("userId", "==", userId).get();
    notifSnap.forEach(doc => bulkWriter.delete(doc.ref));

    const convSnap = await db.collection("conversations").where("participants", "array-contains", userId).get();
    for (const convDoc of convSnap.docs) {
      const msgsSnap = await convDoc.ref.collection("messages").get();
      msgsSnap.forEach(msg => bulkWriter.delete(msg.ref));
      bulkWriter.delete(convDoc.ref);
    }

    // Ferme le bulkWriter et attend que toutes les suppressions optimisées soient effectuées
    await bulkWriter.close();

    // Suppression du compte Auth et du profil racine
    await auth.deleteUser(userId);
    await db.collection("users").doc(userId).delete();

    // Logger la suppression du compte
    await Logger.log("account_deleted", userId, {});

    res.json({ success: true, msg: "Compte supprimé" });
  } catch (error) {
    next(error);
  }
};

/*
 * POST /api/users/favorites
 * Body : { gameId, gameName, gameCover }
 */
exports.addFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { gameId, gameName, gameCover } = req.body;

    if (!gameId)
      return res.status(400).json({ success: false, msg: "gameId manquant" });

    await db
      .collection("users")
      .doc(userId)
      .update({
        favorites: admin.firestore.FieldValue.arrayUnion({
          gameId: gameId.toString(),
          gameName: gameName || "",
          gameCover: gameCover || "",
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Logger l'ajout aux favoris
    await Logger.log("favorite_added", userId, { gameId, gameName });

    // Recommandation automatique basée sur le goût
    try {
      const similarGames = await IGDBService.getSimilarGames(gameId);
      if (
        similarGames &&
        similarGames.length > 0 &&
        similarGames[0].similar_games &&
        similarGames[0].similar_games.length > 0
      ) {
        const recGame = similarGames[0].similar_games[0];
        await db.collection("notifications").add({
          userId,
          type: "RECOMMENDATION",
          message: `Puisque vous avez aimé ${gameName || "ce jeu"}, vous devriez découvrir ${recGame.name} !`,
          gameId: recGame.id,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Erreur génération notification reco:", error.message);
    }

    res.json({ success: true, msg: "Jeu ajouté aux favoris" });
  } catch (error) {
    next(error);
  }
};

/*
 * DELETE /api/users/favorites/:gameId
 */
exports.removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.params;

    const doc = await db.collection("users").doc(userId).get();
    const favorites = doc.data().favorites || [];
    const updatedFavorites = favorites.filter(
      (fav) => fav.gameId !== gameId.toString(),
    );

    await db.collection("users").doc(userId).update({
      favorites: updatedFavorites,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Logger la suppression des favoris
    await Logger.log("favorite_removed", userId, { gameId });

    res.json({ success: true, msg: "Favori retiré" });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/users/preferences
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Profil introuvable" });
    }

    const preferences = userDoc.data().preferences || {
      theme: "dark",
      language: "fr",
      emailNotifications: true,
      pushNotifications: true,
    };

    res.json({ success: true, preferences });
  } catch (error) {
    next(error);
  }
};

/*
 * PUT /api/users/preferences
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { theme, language, emailNotifications, pushNotifications } = req.body;

    // Validation
    const validThemes = ["light", "dark"];
    const validLanguages = ["en", "fr"];

    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ success: false, msg: "Thème invalide" });
    }
    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({ success: false, msg: "Langue invalide" });
    }

    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    const preferences = {};

    if (theme !== undefined) preferences.theme = theme;
    if (language !== undefined) preferences.language = language;
    if (emailNotifications !== undefined)
      preferences.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined)
      preferences.pushNotifications = pushNotifications;

    updates.preferences = preferences;

    await db.collection("users").doc(userId).update(updates);

    // Logger la mise à jour des préférences
    await Logger.log("preferences_updated", userId, { preferences });

    res.json({ success: true, msg: "Préférences mises à jour", preferences });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/users/favorites
 */
exports.getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const doc = await db.collection("users").doc(userId).get();
    const favorites = doc.data().favorites || [];
    res.json({ success: true, total: favorites.length, favorites });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/users/logs (Admin seulement)
 */
exports.getLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await Logger.getLogs(limit);
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

/*
 * POST /api/users/promote/:userId (Admin seulement)
 * Body : { role: 'admin' }
 */
exports.promoteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (role !== "admin") {
      return res.status(400).json({ success: false, msg: "Rôle invalide" });
    }

    await db.collection("users").doc(userId).update({
      role: "admin",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Logger la promotion
    await Logger.log("user_promoted", req.user.id, {
      promotedUserId: userId,
      newRole: "admin",
    });

    res.json({ success: true, msg: "Utilisateur promu administrateur" });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/users/me/export
 * Exportation des données RGPD
 */
exports.exportUserData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const librarySnap = await db
      .collection("users")
      .doc(userId)
      .collection("library")
      .get();
    const library = librarySnap.docs.map((doc) => doc.data());

    const reviewsSnap = await db
      .collection("reviews")
      .where("userId", "==", userId)
      .get();
    const reviews = reviewsSnap.docs.map((doc) => doc.data());

    const followsSnap = await db
      .collection("follows")
      .where("followerId", "==", userId)
      .get();
    const follows = followsSnap.docs.map((doc) => doc.data());

    const exportData = {
      profile: userData,
      library,
      reviews,
      following: follows,
      exportedAt: new Date().toISOString(),
    };

    res.setHeader(
      "Content-disposition",
      `attachment; filename=export_rgpd_${userId}.json`,
    );
    res.setHeader("Content-type", "application/json");
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    next(error);
  }
};
