// Gestion des notifications
const { db } = require('../Services/Firebase');

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