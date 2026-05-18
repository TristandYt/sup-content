const { admin, db } = require("../Services/Firebase");
const Logger = require("../Services/Logger");

// Créer un nouveau sujet de discussion
exports.createThread = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, msg: "Utilisateur non authentifié" });
    }

    const userId = req.user.id;
    const { title, content, gameId, pseudo, avatarUrl } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ success: false, msg: "Titre et contenu requis" });
    }

    const threadRef = db.collection("threads").doc();
    const newThread = {
      title,
      content,
      authorId: userId,
      authorName: pseudo || "Anonyme",
      authorAvatarUrl: avatarUrl || null,
      gameId: gameId || null,
      replyCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastReplyAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await threadRef.set(newThread);
    await Logger.log("forum_thread_created", userId, {
      threadId: threadRef.id,
    });

    res.status(201).json({ success: true, threadId: threadRef.id });
  } catch (error) {
    next(error);
  }
};

// Récupérer la liste des sujets (filtrable par jeu)
exports.getThreads = async (req, res, next) => {
  try {
    const { gameId } = req.query;
    let query = db.collection("threads").orderBy("lastReplyAt", "desc");

    if (gameId) {
      query = query.where("gameId", "==", gameId);
    }

    const snapshot = await query.limit(50).get();
    const threads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.json({ success: true, threads });
  } catch (error) {
    next(error);
  }
};

// Récupérer les détails d'un sujet précis
exports.getThreadById = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const threadDoc = await db.collection("threads").doc(threadId).get();

    if (!threadDoc.exists) {
      return res.status(404).json({ success: false, msg: "Sujet introuvable" });
    }

    res.json({
      success: true,
      thread: { id: threadDoc.id, ...threadDoc.data() },
    });
  } catch (error) {
    next(error);
  }
};

// Ajouter une réponse (commentaire) à un sujet
exports.addPost = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, msg: "Utilisateur non authentifié" });
    }

    const userId = req.user.id;
    const { threadId, content, pseudo, avatarUrl } = req.body;

    if (!content)
      return res.status(400).json({ success: false, msg: "Contenu vide" });

    const postRef = db.collection("posts").doc();
    const newPost = {
      threadId,
      authorId: userId,
      authorName: pseudo || "Anonyme",
      authorAvatarUrl: avatarUrl || null,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    batch.set(postRef, newPost);

    // Mise à jour des stats du sujet parent
    const threadRef = db.collection("threads").doc(threadId);
    batch.update(threadRef, {
      replyCount: admin.firestore.FieldValue.increment(1),
      lastReplyAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Récupérer toutes les réponses d'un sujet
exports.getPostsByThread = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const snapshot = await db
      .collection("posts")
      .where("threadId", "==", threadId)
      .orderBy("createdAt", "asc")
      .get();

    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};
