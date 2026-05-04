/*
 * Contrôleur conversations.
 * Messagerie privée 1-to-1 — suivi mutuel requis pour démarrer une conversation.
 *
 * Modèle Firestore :
 *   conversations/{userIdA}_{userIdB}          → document de conversation
 *   conversations/{id}/messages/{messageId}    → sous-collection messages
 *
 * Règle d'ID : les deux userIds sont triés alphabétiquement avant jointure
 *   pour éviter les doublons A_B / B_A.
 */
const { admin, db } = require("../Services/Firebase");
const Logger = require("../Services/Logger");

const buildConversationId = (idA, idB) => [idA, idB].sort().join("_");

const checkMutualFollow = async (idA, idB) => {
  const [snapAB, snapBA] = await Promise.all([
    db.collection("follows").doc(`${idA}_${idB}`).get(),
    db.collection("follows").doc(`${idB}_${idA}`).get(),
  ]);
  return snapAB.exists && snapBA.exists;
};

/*
 * GET /api/conversations
 * Retourne toutes les conversations de l'utilisateur connecté, triées par dernier message.
 */
exports.getMyConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const snapshot = await db
      .collection("conversations")
      .where("participants", "array-contains", userId)
      .orderBy("lastMessageAt", "desc")
      .get();

    const conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, total: conversations.length, conversations });
  } catch (error) {
    next(error);
  }
};

/*
 * POST /api/conversations
 * Body : { targetUserId }
 * Récupère la conversation existante ou en crée une nouvelle.
 * Vérifie le suivi mutuel avant création.
 */
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res
        .status(400)
        .json({ success: false, msg: "targetUserId manquant" });
    }
    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        msg: "Vous ne pouvez pas vous écrire à vous-même",
      });
    }

    const targetExists = await db.collection("users").doc(targetUserId).get();
    if (!targetExists.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Utilisateur introuvable" });
    }

    const isMutual = await checkMutualFollow(userId, targetUserId);
    if (!isMutual) {
      return res.status(403).json({
        success: false,
        msg: "Vous devez vous suivre mutuellement pour échanger des messages",
      });
    }

    const conversationId = buildConversationId(userId, targetUserId);
    const convRef = db.collection("conversations").doc(conversationId);
    const convDoc = await convRef.get();

    if (convDoc.exists) {
      return res.json({
        success: true,
        created: false,
        conversation: { id: convDoc.id, ...convDoc.data() },
      });
    }

    const newConversation = {
      participants: [userId, targetUserId],
      lastMessage: null,
      lastMessageAt: null,
      lastMessageSender: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await convRef.set(newConversation);

    // Logger la création de conversation
    await Logger.log("conversation_created", userId, {
      targetUserId,
      conversationId,
    });

    res.status(201).json({
      success: true,
      created: true,
      conversation: { id: conversationId, ...newConversation },
    });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/conversations/:conversationId/messages
 * Récupère les messages d'une conversation (50 plus récents).
 * Vérifie que l'utilisateur est bien un participant.
 */
exports.getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const convDoc = await db
      .collection("conversations")
      .doc(conversationId)
      .get();
    if (!convDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Conversation introuvable" });
    }
    if (!convDoc.data().participants.includes(userId)) {
      return res.status(403).json({ success: false, msg: "Accès refusé" });
    }

    const snapshot = await db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .limit(50)
      .get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ success: true, total: messages.length, messages });
  } catch (error) {
    next(error);
  }
};

/*
 * POST /api/conversations/:conversationId/messages
 * Body : { text?, attachments? }
 * Envoie un message. Met à jour le document parent en batch.
 * text OU attachments (min 1 entrée) est obligatoire.
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { text = "", attachments = [] } = req.body;

    if (!text.trim() && attachments.length === 0) {
      return res
        .status(400)
        .json({ success: false, msg: "Un message ne peut pas être vide" });
    }

    const convRef = db.collection("conversations").doc(conversationId);
    const convDoc = await convRef.get();

    if (!convDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Conversation introuvable" });
    }
    if (!convDoc.data().participants.includes(userId)) {
      return res.status(403).json({ success: false, msg: "Accès refusé" });
    }

    const messageRef = convRef.collection("messages").doc();

    const messageData = {
      senderId: userId,
      text: text.trim(),
      attachments,
      readBy: [userId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Batch : écriture du message + mise à jour du parent en une seule opération atomique
    const batch = db.batch();
    batch.set(messageRef, messageData);
    batch.update(convRef, {
      lastMessage: text.trim() || `[${attachments.length} fichier(s)]`,
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessageSender: userId,
    });

    await batch.commit();

    // Logger l'envoi de message
    await Logger.log("message_sent", userId, {
      conversationId,
      messageId: messageRef.id,
      hasText: !!text.trim(),
      attachmentsCount: attachments.length,
    });

    res
      .status(201)
      .json({ success: true, msg: "Message envoyé", messageId: messageRef.id });
  } catch (error) {
    next(error);
  }
};

/*
 * PATCH /api/conversations/:conversationId/messages/:messageId/read
 * Marque un message comme lu par l'utilisateur connecté (read receipt).
 * Ajoute l'userId dans le tableau readBy via arrayUnion.
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId, messageId } = req.params;

    const convDoc = await db
      .collection("conversations")
      .doc(conversationId)
      .get();
    if (!convDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Conversation introuvable" });
    }
    if (!convDoc.data().participants.includes(userId)) {
      return res.status(403).json({ success: false, msg: "Accès refusé" });
    }

    const messageRef = db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .doc(messageId);

    const messageDoc = await messageRef.get();
    if (!messageDoc.exists) {
      return res
        .status(404)
        .json({ success: false, msg: "Message introuvable" });
    }

    await messageRef.update({
      readBy: admin.firestore.FieldValue.arrayUnion(userId),
    });

    // Logger le marquage comme lu
    await Logger.log("message_read", userId, { conversationId, messageId });

    res.json({ success: true, msg: "Message marqué comme lu" });
  } catch (error) {
    next(error);
  }
};
