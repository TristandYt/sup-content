process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'sup-content-tristan';

const admin = require('firebase-admin');

// Si l'application n'est pas encore initialisée, on le fait avec la configuration de test
if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'sup-content-tristan' });
}

// ⚠️ LE FIX EST ICI : On force les paramètres de la base de données
const db = admin.firestore();
db.settings({
    host: '127.0.0.1:8081',
    ssl: false
});