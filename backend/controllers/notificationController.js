// Gestion des notifications
const { db } = require('../../Services/Firebase');

exports.getMyNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(30)
            .get();

        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({ success: true, notifications });
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        const notifRef = db.collection('notifications').doc(notificationId);
        const notifDoc = await notifRef.get();

        if (!notifDoc.exists) {
            return res.status(404).json({ success: false, msg: 'Notification introuvable' });
        }
        if (notifDoc.data().userId !== userId) {
            return res.status(403).json({ success: false, msg: 'Accès refusé' });
        }

        await notifRef.update({ isRead: true });

        res.status(200).json({ success: true, msg: 'Notification marquée comme lue' });
    } catch (error) {
        next(error);
    }
};

exports.streamNotifications = (req, res) => {
    // 1. Configuration des en-têtes (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Envoie header

    const userId = req.user.id;

    // Écoute en temps réel de Firestore
    const unsubscribe = db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(30)
        .onSnapshot(
            (snapshot) => {
                const notifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Envoi des données au client sous le format SSE
                res.write(`data: ${JSON.stringify({ type: 'UPDATE', notifications })}\n\n`);
            },
            (error) => {
                console.error("Erreur SSE Notifications:", error);
                res.write(`data: ${JSON.stringify({ type: 'ERROR', msg: error.message })}\n\n`);
            }
        );

    // ferme la connexion
    req.on('close', () => {
        unsubscribe();
    });
};