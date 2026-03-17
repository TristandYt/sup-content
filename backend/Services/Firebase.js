const admin = require("firebase-admin");

// IMPORTANT : On dit à l'admin SDK de regarder vers le conteneur 'database'
process.env.FIRESTORE_EMULATOR_HOST = "database:8081";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "database:9099";

admin.initializeApp({
  projectId: "sup-content-tristan"
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };