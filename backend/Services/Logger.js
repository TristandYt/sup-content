// Enregistrement des actions utilisateurs (Logs)
const { admin, db } = require('./Firebase');

class Logger {
    static async log(action, userId, details = {}) {
        try {
            await db.collection('logs').add({
                action,
                userId,
                details,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erreur lors du logging:', error);
        }
    }

    static async getLogs(limit = 100) {
        try {
            const logsSnapshot = await db.collection('logs')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const logs = [];
            logsSnapshot.forEach(doc => {
                logs.push({ id: doc.id, ...doc.data() });
            });

            return logs;
        } catch (error) {
            console.error('Erreur lors de la récupération des logs:', error);
            throw error;
        }
    }
}

module.exports = Logger;