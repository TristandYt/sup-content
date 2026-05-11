// Contrôleur de messagerie privée
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

// Liste des conversations
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

// Créer ou récupérer une conversation
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res
        .status(400)
        .json({ success: false, msg: "Cible utilisateur manquant" });
    }
    if (userId === targetUserId) {
      return res
        .status(400)
        .json({
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
      return res
        .status(403)
        .json({
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

    await Logger.log("conversation_created", userId, {
      targetUserId,
      conversationId,
    });

    res
      .status(201)
      .json({
        success: true,
        created: true,
        conversation: { id: conversationId, ...newConversation },
      });
  } catch (error) {
    next(error);
  }
};

// Historique des messages
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

// Envoyer un message
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

    const batch = db.batch();
    batch.set(messageRef, messageData);
    batch.update(convRef, {
      lastMessage: text.trim() || `[${attachments.length} fichier(s)]`,
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessageSender: userId,
    });

    await batch.commit();

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

// Marquer un message comme lu
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

    await Logger.log("message_read", userId, { conversationId, messageId });

    res.json({ success: true, msg: "Message marqué comme lu" });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour un message
exports.updateMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId, messageId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, msg: "Le texte ne peut pas être vide" });
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
    if (messageDoc.data().senderId !== userId) {
      return res
        .status(403)
        .json({ success: false, msg: "Action non autorisée" });
    }

    await messageRef.update({
      text: text.trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, msg: "Message modifié" });
  } catch (error) {
    next(error);
  }
};

// Supprimer un message
exports.deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId, messageId } = req.params;

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
    if (messageDoc.data().senderId !== userId) {
      return res
        .status(403)
        .json({ success: false, msg: "Action non autorisée" });
    }

    await messageRef.delete();

    res.json({ success: true, msg: "Message supprimé" });
  } catch (error) {
    next(error);
  }
};
