process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'sup-content-tristan';

const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'sup-content-tristan' });
}

const db = admin.firestore();
db.settings({
    host: '127.0.0.1:8081',
    ssl: false
});